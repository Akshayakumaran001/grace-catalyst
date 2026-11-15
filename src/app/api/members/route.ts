import { NextRequest } from 'next/server';
import { requireAuth } from '../../../lib/api/session-helper';
import { careProfileService } from '../../../services/care-profile.service';
import { apiSuccess, apiError } from '../../../lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { session } = await requireAuth(req);
    const members = await careProfileService.getMembers(session.careProfileId);
    return apiSuccess(members);
  } catch (err) {
    return apiError(err);
  }
}
