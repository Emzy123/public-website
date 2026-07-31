import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getAdminSessionSecret } from '@/lib/runtime/secrets';
import { verifyPassword, verifyPlainPassword } from './password';

const COOKIE_NAME = 'sinet_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export type AdminSession = {
  email: string;
  exp: number;
};

export async function createSession(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getAdminSessionSecret());
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getAdminSessionSecret());
    if (typeof payload.email !== 'string') return null;
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
  };
}

export function validateCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || email !== adminEmail) return false;

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (passwordHash) {
    return verifyPassword(password, passwordHash);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return verifyPlainPassword(password, adminPassword);
}

export { COOKIE_NAME };
