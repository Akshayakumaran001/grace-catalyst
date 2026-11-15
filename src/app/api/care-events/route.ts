import { NextRequest } from 'next/server';
import { requireAuth } from '../../../lib/api/session-helper';
import { careEventService } from '../../../services/care-event.service';
import { apiSuccess, apiError } from '../../../lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { session } = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const events = await careEventService.getTodayEvents(
      session.careProfileId,
      date
    );
    return apiSuccess(events);
  } catch (err) {
    return apiError(err);
  }
}
