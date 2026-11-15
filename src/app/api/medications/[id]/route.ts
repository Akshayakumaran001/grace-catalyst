import { NextRequest } from 'next/server';
import { requireAuth } from '../../../../lib/api/session-helper';
import { medicationService } from '../../../../services/medication.service';
import { apiSuccess, apiError } from '../../../../lib/api/response';
import { NotFoundError } from '../../../../lib/errors/app-errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session } = await requireAuth(req);
    const med = await medicationService.getMedication(params.id);
    if (!med || med.careProfileId !== session.careProfileId) {
      throw new NotFoundError('Medication');
    }
    return apiSuccess(med);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { membership } = await requireAuth(req);
    await medicationService.archiveMedication(membership, params.id);
    return apiSuccess({ archived: true });
  } catch (err) {
    return apiError(err);
  }
}
