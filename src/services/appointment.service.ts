import { randomUUID } from 'crypto';
import { Appointment, Membership } from '../domain/types';
import {
  appointmentRepo,
  careProfileRepo,
  auditRepo,
} from '../repositories/firestore';
import { can } from '../domain/permissions/policy';
import { ForbiddenError, NotFoundError } from '../lib/errors/app-errors';
import { getClock } from '../adapters/clock';

export class AppointmentService {
  async listAppointments(careProfileId: string): Promise<Appointment[]> {
    return appointmentRepo.findByProfile(careProfileId);
  }

  async createAppointment(
    actor: Membership,
    data: {
      title: string;
      provider?: string;
      startsAtUtc: string | Date;
      location?: string;
      notes?: string;
      reminderOffsets?: number[];
    }
  ): Promise<Appointment> {
    if (!can(actor.role, 'manage_appointments')) {
      throw new ForbiddenError('You do not have permission to manage appointments.');
    }

    const profile = await careProfileRepo.findById(actor.careProfileId);
    if (!profile) throw new NotFoundError('CareProfile');

    const now = getClock().now();
    const id = randomUUID();
    const appointment: Appointment = {
      id,
      careProfileId: profile.id,
      title: data.title,
      provider: data.provider,
      startsAtUtc: new Date(data.startsAtUtc),
      timezone: profile.timezone,
      location: data.location,
      notes: data.notes,
      reminderOffsets: data.reminderOffsets || [1440, 120], // 24h and 2h default
      status: 'scheduled',
      createdBy: actor.id,
      updatedBy: actor.id,
      createdAt: now,
      updatedAt: now,
    };
    await appointmentRepo.create(appointment);

    await auditRepo.create({
      id: randomUUID(),
      careProfileId: profile.id,
      actorMembershipId: actor.id,
      action: 'APPOINTMENT_SCHEDULED',
      resourceType: 'Appointment',
      resourceId: id,
      after: { title: appointment.title, startsAt: appointment.startsAtUtc },
      createdAt: now,
    });

    return appointment;
  }

  async cancelAppointment(actor: Membership, id: string): Promise<void> {
    if (!can(actor.role, 'manage_appointments')) {
      throw new ForbiddenError('You do not have permission to cancel appointments.');
    }

    const appt = await appointmentRepo.findById(id);
    if (!appt || appt.careProfileId !== actor.careProfileId) {
      throw new NotFoundError('Appointment');
    }

    await appointmentRepo.delete(id);

    await auditRepo.create({
      id: randomUUID(),
      careProfileId: actor.careProfileId,
      actorMembershipId: actor.id,
      action: 'APPOINTMENT_CANCELLED',
      resourceType: 'Appointment',
      resourceId: id,
      createdAt: new Date(),
    });
  }
}

export const appointmentService = new AppointmentService();
