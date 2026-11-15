import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/session-helper';
import { routineService } from '@/services/routine.service';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { membership } = await requireAuth(req);
    const todayDate = new Date().toISOString().slice(0, 10);
    const event = await routineService.completeRoutineToday(
      membership,
      params.id,
      todayDate
    );
    return apiSuccess(event);
  } catch (err) {
    return apiError(err);
  }
}
