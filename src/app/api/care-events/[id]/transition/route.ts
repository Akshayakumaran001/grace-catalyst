import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/session-helper';
import { careEventService } from '@/services/care-event.service';
import { careEventTransitionSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { membership } = await requireAuth(req);
    const body = await req.json();
    const validated = careEventTransitionSchema.parse(body);

    const updated = await careEventService.transitionEventStatus(
      membership,
      params.id,
      validated.targetStatus,
      validated.note
    );

    return apiSuccess(updated);
  } catch (err) {
    return apiError(err);
  }
}
