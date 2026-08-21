import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getAdminSessionSecret } from '@/lib/runtime/secrets';
import { verifyPassword } from './password';

const COOKIE_NAME = 'sinet_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 2; // 2 hours
const IDLE_TIMEOUT = 60 * 30; // 30 minutes

export type AdminSession = {
  email: string;
  exp: number;
};

export async function createSession(email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ email, lastActivity: now })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('sinet-admin')
    .setAudience('sinet-admin')
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getAdminSessionSecret());
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getAdminSessionSecret(), { issuer: 'sinet-admin', audience: 'sinet-admin' });
    if (typeof payload.email !== 'string') return null;

    const lastActivity = typeof payload.lastActivity === 'number' ? payload.lastActivity : 0;
    const now = Math.floor(Date.now() / 1000);
    if (lastActivity > 0 && now - lastActivity > IDLE_TIMEOUT) {
      return null;
    }

    return { email: payload.email, exp: payload.exp ?? 0 };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
    priority: 'high' as const,
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    priority: 'high' as const,
  };
}

export function validateCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || email !== adminEmail) return false;

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash) return false;
  return verifyPassword(password, passwordHash);
}

export { COOKIE_NAME };
