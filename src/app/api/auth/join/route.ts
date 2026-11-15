import { NextRequest } from 'next/server';
import { careProfileService } from '../../../../services/care-profile.service';
import { joinCareProfileSchema } from '../../../../lib/validation/schemas';
import { apiSuccess, apiError } from '../../../../lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = joinCareProfileSchema.parse(body);

    const result = await careProfileService.joinWithPasscode({
      passcode: validated.passcode,
      displayName: validated.displayName,
      email: validated.email,
    });

    const response = apiSuccess({
      profile: result.profile,
      membership: result.membership,
    });

    // Set signed httpOnly session cookie
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
