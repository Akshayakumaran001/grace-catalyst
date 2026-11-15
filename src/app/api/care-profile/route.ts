import { NextRequest } from 'next/server';
import { requireAuth } from '../../../lib/api/session-helper';
import { careProfileRepo } from '../../../repositories/firestore';
import { apiSuccess, apiError } from '../../../lib/api/response';
import { NotFoundError } from '../../../lib/errors/app-errors';

export async function GET(req: NextRequest) {
  try {
    const { session } = await requireAuth(req);
    const profile = await careProfileRepo.findById(session.careProfileId);
    if (!profile) throw new NotFoundError('CareProfile');
    return apiSuccess(profile);
  } catch (err) {
    return apiError(err);
  }
}
