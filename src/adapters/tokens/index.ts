import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';
import { Session, Role } from '../../domain/types';
import { env } from '../../lib/config/env';

const secretKey = new TextEncoder().encode(env.sessionSecret);

export async function createSessionToken(payload: {
  membershipId: string;
  careProfileId: string;
  role: Role;
  displayName: string;
}): Promise<string> {
  const token = await new SignJWT({
    membershipId: payload.membershipId,
    careProfileId: payload.careProfileId,
    role: payload.role,
    displayName: payload.displayName,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  return token;
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      membershipId: payload.membershipId as string,
      careProfileId: payload.careProfileId as string,
      role: payload.role as Role,
      displayName: payload.displayName as string,
      exp: payload.exp as number,
      iat: payload.iat as number,
    };
  } catch {
    return null;
  }
}

export function hashPasscode(passcode: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(`${salt}:${passcode}`).digest('hex');
  return { hash, salt };
}

export function verifyPasscode(passcode: string, hash: string, salt: string): boolean {
  const computed = createHash('sha256').update(`${salt}:${passcode}`).digest('hex');
  return computed === hash;
}

export function generateMagicToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
