import { NextRequest } from 'next/server';
import { requireAuth } from '../../../lib/api/session-helper';
import { medicationService } from '../../../services/medication.service';
import { createMedicationSchema } from '../../../lib/validation/schemas';
import { apiCreated, apiSuccess, apiError } from '../../../lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { session } = await requireAuth(req);
    const meds = await medicationService.listMedications(session.careProfileId);
    return apiSuccess(meds);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { membership } = await requireAuth(req);
    const body = await req.json();
    const validated = createMedicationSchema.parse(body);

    const result = await medicationService.createMedication(membership, {
      name: validated.name,
      brandOrGeneric: validated.brandOrGeneric,
      doseText: validated.doseText,
      form: validated.form,
      instructions: validated.instructions,
      startDate: validated.startDate,
      endDate: validated.endDate,
      schedule: {
        frequency: validated.schedule.frequency,
        weekdays: validated.schedule.weekdays,
        localTimes: validated.schedule.localTimes,
        mealContext: validated.schedule.mealContext,
      },
    });

    return apiCreated(result);
  } catch (err) {
    return apiError(err);
  }
}
