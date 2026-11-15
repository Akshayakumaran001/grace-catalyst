import { NextRequest } from 'next/server';
import { requireAuth } from '../../../lib/api/session-helper';
import { routineService } from '../../../services/routine.service';
import { createRoutineSchema } from '../../../lib/validation/schemas';
import { apiCreated, apiSuccess, apiError } from '../../../lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { session } = await requireAuth(req);
    const routines = await routineService.listRoutines(session.careProfileId);
    return apiSuccess(routines);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { membership } = await requireAuth(req);
    const body = await req.json();
    const validated = createRoutineSchema.parse(body);

    const routine = await routineService.createRoutine(membership, {
      title: validated.title,
      description: validated.description,
      category: validated.category,
      frequency: validated.frequency,
      weekdays: validated.weekdays,
      localTimes: validated.localTimes,
      effectiveFrom: validated.effectiveFrom,
      effectiveUntil: validated.effectiveUntil,
    });

    return apiCreated(routine);
  } catch (err) {
    return apiError(err);
  }
}
