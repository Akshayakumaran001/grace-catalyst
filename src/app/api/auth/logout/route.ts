import { NextResponse } from 'next/server';
import { apiSuccess } from '../../../../lib/api/response';

export async function POST() {
  const response = apiSuccess({ loggedOut: true });
  response.cookies.delete('grace_session');
  return response;
}
