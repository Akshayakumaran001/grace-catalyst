import { NextRequest } from 'next/server';
import { requireAuth } from '../../../lib/api/session-helper';
import { appointmentService } from '../../../services/appointment.service';
import { createAppointmentSchema } from '../../../lib/validation/schemas';
import { apiCreated, apiSuccess, apiError } from '../../../lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { session } = await requireAuth(req);
    const appts = await appointmentService.listAppointments(session.careProfileId);
    return apiSuccess(appts);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { membership } = await requireAuth(req);
    const body = await req.json();
    const validated = createAppointmentSchema.parse(body);

    const appt = await appointmentService.createAppointment(membership, {
      title: validated.title,
      provider: validated.provider,
      startsAtUtc: validated.startsAtUtc,
      location: validated.location,
      notes: validated.notes,
      reminderOffsets: validated.reminderOffsets,
    });

    return apiCreated(appt);
  } catch (err) {
    return apiError(err);
  }
}
