import { Resend } from 'resend';
import { env } from '../../lib/config/env';

export interface EmailRecipient {
  email: string;
  name: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailAdapter {
  private resend: Resend | null = null;

  constructor() {
    if (env.resendApiKey && env.resendApiKey.startsWith('re_')) {
      try {
        this.resend = new Resend(env.resendApiKey);
      } catch (err) {
        console.warn('[EMAIL] Failed to initialize Resend client:', err);
      }
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<EmailSendResult> {
    // If Resend client is initialized, attempt live send
    if (this.resend) {
      try {
        // Resend sandbox testing requirement: map placeholder domains to delivered@resend.dev
        const destination = to.endsWith('@example.com') ? 'delivered@resend.dev' : to;

        const response = await this.resend.emails.send({
          from: `GRACE Care <${env.emailFrom}>`,
          to: destination,
          subject,
          html,
        });

        if (response.error) {
          console.warn('[EMAIL_PROVIDER_WARNING]', response.error);
          return { success: false, error: response.error.message };
        }

        const id = response.data?.id;
        console.log(`[EMAIL_SENT] to=${to} (delivered via ${destination}) subject="${subject}" messageId=${id}`);
        return { success: true, messageId: id };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[EMAIL_SEND_EXCEPTION]', message);
        return { success: false, error: message };
      }
    }

    // Fallback: log to console with formatted preview
    console.log(`[EMAIL_MOCK_DELIVERY] To: ${to} | Subject: ${subject}`);
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  // ── Template: Upcoming Dose ──────────────────────────────────────────
  async sendUpcomingDoseReminder(
    recipient: EmailRecipient,
    data: {
      elderName: string;
      medicineName: string;
      doseText: string;
      timeString: string;
      mealContext?: string;
      actionUrl?: string;
    }
  ): Promise<EmailSendResult> {
    const subject = `Reminder: ${data.medicineName} due at ${data.timeString} for ${data.elderName}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background: #FFFFFF;">
        <div style="border-bottom: 2px solid #1D4ED8; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #1D4ED8; margin: 0; font-size: 22px; font-weight: 700;">GRACE Care Reminder</h2>
          <p style="color: #6B7280; font-size: 13px; margin: 4px 0 0 0;">Continuous care. Independent ageing.</p>
        </div>
        <p style="font-size: 16px; color: #111827; margin: 0 0 16px 0;">Hello ${recipient.name},</p>
        <div style="background: #EFF6FF; border-left: 4px solid #1D4ED8; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <div style="font-size: 20px; font-weight: bold; color: #1E3A8A; margin-bottom: 6px;">${data.medicineName}</div>
          <div style="font-size: 15px; color: #1E40AF; margin-bottom: 4px;">Dose: <strong>${data.doseText}</strong></div>
          <div style="font-size: 14px; color: #3B82F6;">Scheduled for: <strong>${data.timeString}</strong> ${data.mealContext ? `(${data.mealContext})` : ''}</div>
        </div>
        ${
          data.actionUrl
            ? `<div style="text-align: center; margin: 24px 0;">
                <a href="${data.actionUrl}" style="background: #1D4ED8; color: #FFFFFF; padding: 14px 28px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Mark as Taken</a>
              </div>`
            : ''
        }
        <p style="font-size: 13px; color: #9CA3AF; margin-top: 24px; border-top: 1px solid #F3F4F6; padding-top: 12px;">
          This reminder was coordinated via the GRACE Care Circle. GRACE does not provide medical advice.
        </p>
      </div>
    `;
    return this.sendEmail(recipient.email, subject, html);
  }

  // ── Template: Missed Dose ────────────────────────────────────────────
  async sendMissedDoseAlert(
    recipient: EmailRecipient,
    data: {
      elderName: string;
      medicineName: string;
      doseText: string;
      scheduledTime: string;
      isEscalated?: boolean;
      actionUrl?: string;
    }
  ): Promise<EmailSendResult> {
    const prefix = data.isEscalated ? '🚨 [ESCALATION] Missed Dose Alert' : '⚠️ Missed Dose Notice';
    const subject = `${prefix}: ${data.medicineName} for ${data.elderName}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #FCA5A5; border-radius: 12px; background: #FFFFFF;">
        <div style="border-bottom: 2px solid #DC2626; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #DC2626; margin: 0; font-size: 22px; font-weight: 700;">GRACE Care Circle Notice</h2>
          <p style="color: #6B7280; font-size: 13px; margin: 4px 0 0 0;">Adherence Attention Required</p>
        </div>
        <p style="font-size: 16px; color: #111827; margin: 0 0 16px 0;">Hello ${recipient.name},</p>
        <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <p style="font-size: 16px; color: #991B1B; margin: 0 0 8px 0;">
            <strong>${data.elderName}</strong> has not confirmed taking their scheduled dose:
          </p>
          <div style="font-size: 18px; font-weight: bold; color: #7F1D1D; margin-bottom: 4px;">${data.medicineName} (${data.doseText})</div>
          <div style="font-size: 14px; color: #B91C1C;">Scheduled Time: ${data.scheduledTime}</div>
        </div>
        ${
          data.actionUrl
            ? `<div style="text-align: center; margin: 24px 0;">
                <a href="${data.actionUrl}" style="background: #DC2626; color: #FFFFFF; padding: 14px 28px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Update Status / Check In</a>
              </div>`
            : ''
        }
        <p style="font-size: 13px; color: #6B7280; margin-top: 16px;">
          Please reach out to ${data.elderName} if appropriate. Please do not infer whether a missed dose should be taken late without medical guidance.
        </p>
      </div>
    `;
    return this.sendEmail(recipient.email, subject, html);
  }

  // ── Template: Upcoming Appointment ───────────────────────────────────
  async sendAppointmentReminder(
    recipient: EmailRecipient,
    data: {
      elderName: string;
      appointmentTitle: string;
      provider?: string;
      dateTimeString: string;
      location?: string;
      notes?: string;
    }
  ): Promise<EmailSendResult> {
    const subject = `Upcoming Appointment: ${data.appointmentTitle} on ${data.dateTimeString}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px; background: #FFFFFF;">
        <div style="border-bottom: 2px solid #0D9488; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0D9488; margin: 0; font-size: 22px; font-weight: 700;">GRACE Appointment Reminder</h2>
          <p style="color: #6B7280; font-size: 13px; margin: 4px 0 0 0;">Care Circle Schedule</p>
        </div>
        <p style="font-size: 16px; color: #111827; margin: 0 0 16px 0;">Hello ${recipient.name},</p>
        <div style="background: #F0FDFA; border-left: 4px solid #0D9488; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <div style="font-size: 18px; font-weight: bold; color: #134E4A; margin-bottom: 6px;">${data.appointmentTitle}</div>
          ${data.provider ? `<div style="font-size: 14px; color: #0F766E;">Provider: <strong>${data.provider}</strong></div>` : ''}
          <div style="font-size: 14px; color: #0F766E; margin-top: 4px;">Time: <strong>${data.dateTimeString}</strong></div>
          ${data.location ? `<div style="font-size: 14px; color: #0F766E; margin-top: 4px;">Location: ${data.location}</div>` : ''}
          ${data.notes ? `<div style="font-size: 13px; color: #4B5563; margin-top: 8px; font-style: italic;">Notes: ${data.notes}</div>` : ''}
        </div>
      </div>
    `;
    return this.sendEmail(recipient.email, subject, html);
  }
}

export const emailAdapter = new EmailAdapter();
