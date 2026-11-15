import { NextRequest } from 'next/server';
import { getClock, setGlobalClock, VirtualClock } from '../../../../adapters/clock';
import { reminderService } from '../../../../services/reminder.service';
import { apiSuccess, apiError } from '../../../../lib/api/response';
import { z } from 'zod';

const schema = z.object({
  minutes: z.number().int().min(1).max(10080), // up to 7 days
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = schema.parse(body);

    const currentClock = getClock();
    let virtualClock: VirtualClock;

    if (currentClock instanceof VirtualClock) {
      virtualClock = currentClock;
      virtualClock.advance(validated.minutes);
    } else {
      virtualClock = new VirtualClock(currentClock.now());
      virtualClock.advance(validated.minutes);
      setGlobalClock(virtualClock);
    }

    // Execute the real reminder engine with the updated time
    const report = await reminderService.processDueReminders();

    return apiSuccess({
      newTime: virtualClock.now().toISOString(),
      minutesAdvanced: validated.minutes,
      reminderReport: report,
    });
  } catch (err) {
    return apiError(err);
  }
}
