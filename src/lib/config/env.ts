// Runtime configuration helper reading purely from environment variables

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Session
  sessionSecret:
    process.env.SESSION_SECRET || 'dev_session_secret_change_in_production_min_32_chars',

  // Firebase
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),

  // Resend
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'onboarding@resend.dev',

  // Gemini / GCP AI
  geminiApiKey:
    process.env.GEMINI_API_KEY || process.env.GCP_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',

  // Cron
  cronSharedSecret: process.env.CRON_SHARED_SECRET || 'grace_cron_secret_4892c5a7f910e3d2b8',
  demoMode: process.env.DEMO_MODE !== 'false',
};
