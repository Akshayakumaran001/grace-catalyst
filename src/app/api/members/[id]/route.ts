import { NextRequest } from 'next/server';
import { requireAuth } from '../../../../lib/api/session-helper';
import { careProfileService } from '../../../../services/care-profile.service';
import { apiSuccess, apiError } from '../../../../lib/api/response';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { membership } = await requireAuth(req);
    await careProfileService.revokeMember(membership, params.id);
    return apiSuccess({ revoked: true });
  } catch (err) {
    return apiError(err);
  }
}
