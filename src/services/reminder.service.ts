import { randomUUID } from 'crypto';
import {
  NotificationLog,
  NotificationStage,
} from '../domain/types';
import {
  careProfileRepo,
  membershipRepo,
  careEventRepo,
  appointmentRepo,
  notificationLogRepo,
} from '../repositories/firestore';
import { emailAdapter } from '../adapters/email';
import { getClock } from '../adapters/clock';
import { env } from '../lib/config/env';

export interface ReminderRunReport {
  timestamp: string;
  processedEvents: number;
  emailsSent: number;
  emailsFailed: number;
  skippedIdempotent: number;
  details: Array<{
    eventId: string;
    stage: string;
    recipientEmail: string;
    status: string;
    messageId?: string;
  }>;
}

export class ReminderService {
  async processDueReminders(): Promise<ReminderRunReport> {
    const clock = getClock();
    const now = clock.now();
    const report: ReminderRunReport = {
      timestamp: now.toISOString(),
      processedEvents: 0,
      emailsSent: 0,
      emailsFailed: 0,
      skippedIdempotent: 0,
      details: [],
    };

    // ── 1. Process Care Events (Medications & Routines) ───────────────────
    // Query events due in the window: [now - 2 hours, now + 30 minutes]
    const windowStart = new Date(now.getTime() - 2 * 3600 * 1000);
    const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

    const dueEvents = await careEventRepo.findPendingAndDue(windowEnd);

    for (const event of dueEvents) {
      const eventDueTime = new Date(event.dueAtUtc);
      if (eventDueTime < windowStart) continue;

      report.processedEvents++;

      const profile = await careProfileRepo.findById(event.careProfileId);
      if (!profile) continue;

      const members = await membershipRepo.findByProfile(profile.id);
      const isPastDue = eventDueTime <= now;
      const minutesPastDue = isPastDue
        ? Math.floor((now.getTime() - eventDueTime.getTime()) / 60000)
        : 0;

      // Determine stage:
      // If overdue by >= 15 min: missed_dose_first or escalated
      // If overdue by >= 45 min: missed_dose_escalated
      // If upcoming (within 30 min): upcoming_dose
      let stage: NotificationStage = 'upcoming_dose';
      if (isPastDue) {
        if (minutesPastDue >= 45) {
          stage = 'missed_dose_escalated';
        } else if (minutesPastDue >= 15) {
          stage = 'missed_dose_first';
        } else {
          stage = 'upcoming_dose';
        }
      }

      // Mark event as reminded if it was pending
      if (event.status === 'pending' && !isPastDue) {
        await careEventRepo.update(event.id, { status: 'reminded' });
      }

      // If overdue by 15 min and still pending/reminded, mark status as missed
      if (isPastDue && minutesPastDue >= 15 && (event.status === 'pending' || event.status === 'reminded')) {
        await careEventRepo.update(event.id, { status: 'missed' });
      }

      // Find elder displayName
      const elderMember = members.find((m) => m.role === 'elderly');
      const elderName = elderMember ? elderMember.displayName : 'Elder';

      // Send to eligible recipients based on stage and notification policy
      for (const member of members) {
        if (!member.email || !member.notificationPreferences?.emailEnabled) {
          continue;
        }

        const isElder = member.role === 'elderly';
        const isCaretaker = member.role === 'caretaker';
        const isFamily = member.role === 'family_member';

        let shouldSend = false;
        if (stage === 'upcoming_dose') {
          shouldSend = isElder; // default upcoming to elder
        } else if (stage === 'missed_dose_first') {
          shouldSend = isElder; // first stage alert to elder
        } else if (stage === 'missed_dose_escalated') {
          shouldSend = isElder || isCaretaker || isFamily; // escalate to all circle
        }

        if (!shouldSend) continue;

        // Idempotency check: (eventId, stage, recipientMembershipId)
        const idempotencyKey = `${event.id}:${stage}:${member.id}`;
        const existingLog = await notificationLogRepo.findByIdempotencyKey(
          idempotencyKey
        );

        if (existingLog && existingLog.status === 'sent') {
          report.skippedIdempotent++;
          continue;
        }

        // Atomically claim notification log
        const logId = randomUUID();
        const notificationLog: NotificationLog = {
          id: logId,
          careProfileId: profile.id,
          eventId: event.id,
          recipientMembershipId: member.id,
          stage,
          channel: 'email',
          idempotencyKey,
          status: 'queued',
          attemptCount: 1,
          createdAt: now,
        };
        await notificationLogRepo.create(notificationLog);

        // Send Email
        let sendResult;
        if (stage === 'upcoming_dose') {
          sendResult = await emailAdapter.sendUpcomingDoseReminder(
            { email: member.email, name: member.displayName },
            {
              elderName,
              medicineName: event.titleSnapshot,
              doseText: event.instructionsSnapshot || 'As directed',
              timeString: event.localDueTime,
              actionUrl: `${env.appUrl}/today?action=take&eventId=${event.id}`,
            }
          );
        } else {
          sendResult = await emailAdapter.sendMissedDoseAlert(
            { email: member.email, name: member.displayName },
            {
              elderName,
              medicineName: event.titleSnapshot,
              doseText: event.instructionsSnapshot || 'As directed',
              scheduledTime: `${event.localDueDate} ${event.localDueTime}`,
              isEscalated: stage === 'missed_dose_escalated',
              actionUrl: `${env.appUrl}/today?eventId=${event.id}`,
            }
          );
        }

        if (sendResult.success) {
          report.emailsSent++;
          await notificationLogRepo.update(logId, {
            status: 'sent',
            sentAt: now,
            providerMessageId: sendResult.messageId,
          });
          report.details.push({
            eventId: event.id,
            stage,
            recipientEmail: member.email,
            status: 'sent',
            messageId: sendResult.messageId,
          });
        } else {
          report.emailsFailed++;
          await notificationLogRepo.update(logId, {
            status: 'failed',
            lastErrorCode: sendResult.error,
          });
          report.details.push({
            eventId: event.id,
            stage,
            recipientEmail: member.email,
            status: 'failed',
          });
        }
      }
    }

    // ── 2. Process Upcoming Appointments ──────────────────────────────────
    const upcomingAppts = await appointmentRepo.findUpcoming(now);
    for (const appt of upcomingAppts) {
      const apptTime = new Date(appt.startsAtUtc);
      const minutesUntil = Math.floor((apptTime.getTime() - now.getTime()) / 60000);

      // Check if within 24 hours (1440 min)
      if (minutesUntil > 0 && minutesUntil <= 1440) {
        const profile = await careProfileRepo.findById(appt.careProfileId);
        if (!profile) continue;

        const members = await membershipRepo.findByProfile(profile.id);
        const elderMember = members.find((m) => m.role === 'elderly');
        const elderName = elderMember ? elderMember.displayName : 'Elder';

        for (const member of members) {
          if (!member.email || !member.notificationPreferences?.emailEnabled) {
            continue;
          }

          const idempotencyKey = `${appt.id}:appointment_reminder:${member.id}`;
          const existingLog = await notificationLogRepo.findByIdempotencyKey(
            idempotencyKey
          );
          if (existingLog && existingLog.status === 'sent') {
            continue;
          }

          const logId = randomUUID();
          await notificationLogRepo.create({
            id: logId,
            careProfileId: profile.id,
            eventId: appt.id,
            recipientMembershipId: member.id,
            stage: 'upcoming_appointment',
            channel: 'email',
            idempotencyKey,
            status: 'queued',
            attemptCount: 1,
            createdAt: now,
          });

          const sendResult = await emailAdapter.sendAppointmentReminder(
            { email: member.email, name: member.displayName },
            {
              elderName,
              appointmentTitle: appt.title,
              provider: appt.provider,
              dateTimeString: apptTime.toLocaleString('en-IN', {
                timeZone: appt.timezone || 'Asia/Kolkata',
              }),
              location: appt.location,
              notes: appt.notes,
            }
          );

          if (sendResult.success) {
            report.emailsSent++;
            await notificationLogRepo.update(logId, {
              status: 'sent',
              sentAt: now,
              providerMessageId: sendResult.messageId,
            });
            report.details.push({
              eventId: appt.id,
              stage: 'upcoming_appointment',
              recipientEmail: member.email,
              status: 'sent',
              messageId: sendResult.messageId,
            });
          }
        }
      }
    }

    return report;
  }
}

export const reminderService = new ReminderService();
