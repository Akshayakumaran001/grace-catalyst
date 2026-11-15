import { NextRequest } from 'next/server';
import { requireAuth } from '../../../../lib/api/session-helper';
import { careProfileService } from '../../../../services/care-profile.service';
import { apiSuccess, apiError } from '../../../../lib/api/response';
import { z } from 'zod';

const schema = z.object({
  collaborationMode: z.enum(['direct_edit', 'elder_approval_required']),
});

export async function PATCH(req: NextRequest) {
  try {
    const { membership } = await requireAuth(req);
    const body = await req.json();
    const validated = schema.parse(body);

    const updated = await careProfileService.updateCollaborationMode(
      membership,
      validated.collaborationMode
    );

    return apiSuccess(updated);
  } catch (err) {
    return apiError(err);
  }
}
