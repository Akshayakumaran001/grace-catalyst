import { NextRequest } from 'next/server';
import { reminderService } from '../../../../services/reminder.service';
import { apiSuccess, apiError } from '../../../../lib/api/response';
import { env } from '../../../../lib/config/env';
import { UnauthenticatedError } from '../../../../lib/errors/app-errors';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronHeader = req.headers.get('x-vercel-cron');

    // In production, verify secret unless triggered by Vercel Cron
    if (env.isProduction) {
      const url = new URL(req.url);
      const keyParam = url.searchParams.get('key');
      const isValidKey = keyParam && keyParam === env.cronSharedSecret;
      const isValidBearer =
        authHeader && authHeader === `Bearer ${env.cronSharedSecret}`;
      const isVercelCron = cronHeader === '1';

      if (!isValidBearer && !isVercelCron && !isValidKey) {
        throw new UnauthenticatedError('Invalid or missing cron secret.');
      }
    }

    const report = await reminderService.processDueReminders();
    return apiSuccess({
      message: 'Reminder tick completed successfully.',
      report,
    });
  } catch (err) {
    return apiError(err);
  }
}

// Allow GET for easy browser testing / ping
export async function GET(req: NextRequest) {
  return POST(req);
}
