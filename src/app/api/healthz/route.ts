import { NextResponse } from 'next/server';
import { env } from '../../../lib/config/env';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    product: 'GRACE',
    tagline: 'Continuous care. Independent ageing.',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    env: env.NODE_ENV,
    integrations: {
      firebase: !!env.firebaseProjectId,
      resend: !!env.resendApiKey,
      gemini: !!env.geminiApiKey,
    },
  });
}
