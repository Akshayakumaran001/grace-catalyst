import { NextRequest } from 'next/server';
import { careProfileService } from '@/services/care-profile.service';
import { createCareProfileSchema } from '@/lib/validation/schemas';
import { apiCreated, apiError } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createCareProfileSchema.parse(body);

    const result = await careProfileService.createProfile({
      displayName: validated.displayName,
      elderDisplayName: validated.elderDisplayName || validated.displayName,
      elderEmail: validated.elderEmail,
      timezone: validated.timezone,
      locale: validated.locale,
    });

    const response = apiCreated({
      profile: result.profile,
      membership: result.membership,
    });

    response.cookies.set('grace_session', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (err) {
    return apiError(err);
  }
}
