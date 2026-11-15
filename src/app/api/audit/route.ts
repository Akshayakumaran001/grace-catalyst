import { NextRequest } from 'next/server';
import { requireAuth } from '../../../lib/api/session-helper';
import { auditRepo } from '../../../repositories/firestore';
import { apiSuccess, apiError } from '../../../lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { session } = await requireAuth(req);
    const logs = await auditRepo.findByProfile(session.careProfileId, 50);
    return apiSuccess(logs);
  } catch (err) {
    return apiError(err);
  }
}
