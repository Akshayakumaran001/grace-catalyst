import { NextRequest } from 'next/server';
import { verifySessionToken } from '../../adapters/tokens';
import { Session, Membership } from '../../domain/types';
import { membershipRepo } from '../../repositories/firestore';
import { UnauthenticatedError } from '../errors/app-errors';

export async function getSessionFromRequest(
  req: NextRequest
): Promise<Session | null> {
  const cookie = req.cookies.get('grace_session');
  if (!cookie || !cookie.value) return null;
  return verifySessionToken(cookie.value);
}

export async function requireAuth(req: NextRequest): Promise<{
  session: Session;
  membership: Membership;
}> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    throw new UnauthenticatedError();
  }

  const membership = await membershipRepo.findById(session.membershipId);
  if (!membership || membership.status !== 'active') {
    throw new UnauthenticatedError('Membership is no longer active.');
  }

  return { session, membership };
}
