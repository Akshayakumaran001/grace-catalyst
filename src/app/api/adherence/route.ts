import { NextRequest } from 'next/server';
import { requireAuth } from '../../../lib/api/session-helper';
import { careEventService } from '../../../services/care-event.service';
import { apiSuccess, apiError } from '../../../lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { session } = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const summary = await careEventService.getAdherenceSummary(
      session.careProfileId,
      days
    );
    return apiSuccess(summary);
  } catch (err) {
    return apiError(err);
  }
}
