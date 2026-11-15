import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/session-helper';
import { geminiAdapter } from '@/adapters/gemini';
import { aiMedicationIntakeTextSchema } from '@/lib/validation/schemas';
import { apiSuccess, apiError } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const validated = aiMedicationIntakeTextSchema.parse(body);

    const extracted = await geminiAdapter.parseMedicationText(validated.text);
    return apiSuccess({
      candidate: extracted,
      disclaimer:
        'Please verify this information against the prescription. GRACE does not provide medical advice.',
    });
  } catch (err) {
    return apiError(err);
  }
}
