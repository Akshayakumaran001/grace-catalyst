import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/api/session-helper';
import { membershipRepo, careProfileRepo } from '@/repositories/firestore';
import { apiSuccess, apiError } from '@/lib/api/response';
import { UnauthenticatedError } from '@/lib/errors/app-errors';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      throw new UnauthenticatedError();
    }

    const membership = await membershipRepo.findById(session.membershipId);
    if (!membership || membership.status !== 'active') {
      throw new UnauthenticatedError('Membership expired or revoked.');
    }

    const profile = await careProfileRepo.findById(session.careProfileId);

    return apiSuccess({
      session,
      membership,
      profile,
    });
  } catch (err) {
    return apiError(err);
  }
}
