import { NextRequest } from 'next/server';
import { requireAuth } from '../../../../lib/api/session-helper';
import { appointmentService } from '../../../../services/appointment.service';
import { apiSuccess, apiError } from '../../../../lib/api/response';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { membership } = await requireAuth(req);
    await appointmentService.cancelAppointment(membership, params.id);
    return apiSuccess({ cancelled: true });
  } catch (err) {
    return apiError(err);
  }
}
