import { resetDemoDatabase } from '../../../../repositories/firestore';
import { apiSuccess } from '../../../../lib/api/response';

export async function POST() {
  resetDemoDatabase();
  return apiSuccess({
    reset: true,
    message: 'Demo database has been reset to seeded initial state.',
  });
}
