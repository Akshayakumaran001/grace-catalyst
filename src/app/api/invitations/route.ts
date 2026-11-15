import { NextRequest } from 'next/server';
import { requireAuth } from '../../../lib/api/session-helper';
import { careProfileService } from '../../../services/care-profile.service';
import { createInvitationSchema } from '../../../lib/validation/schemas';
import { apiCreated, apiError } from '../../../lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const { membership } = await requireAuth(req);
    const body = await req.json();
    const validated = createInvitationSchema.parse(body);

    const result = await careProfileService.createInvitation(membership, {
      role: validated.role,
      passcode: validated.passcode,
      expiresInDays: validated.expiresInDays,
    });

    return apiCreated(result);
  } catch (err) {
    return apiError(err);
  }
}
