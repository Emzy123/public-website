import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { isProductionMode } from '@/lib/runtime/envMode';
import type { UserRole } from './roles';

export const MEMBER_SESSION_COOKIE = 'sinet_member_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
export const IDLE_TIMEOUT = 60 * 30; // 30 minutes

export interface AuthSession {
  userId: string;
  email: string;
  phone?: string | null;
  roles: UserRole[];
  chapterIds: string[];
  is2faAuthenticated: boolean;
  lastActive: number;
}

function getAuthSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    'sinet-development-auth-secret-key-at-least-32-chars-long';
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: Omit<AuthSession, 'lastActive'>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    sub: session.userId,
    email: session.email,
    phone: session.phone || undefined,
    roles: session.roles,
    chapterIds: session.chapterIds,
    is2faAuthenticated: session.is2faAuthenticated,
    lastActive: now,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('sinet-members')
    .setAudience('sinet-members')
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getAuthSecretKey());
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecretKey(), {
      issuer: 'sinet-members',
      audience: 'sinet-members',
    });

    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      return null;
    }

    const lastActive = typeof payload.lastActive === 'number' ? payload.lastActive : 0;
    const now = Math.floor(Date.now() / 1000);
    if (lastActive > 0 && now - lastActive > IDLE_TIMEOUT) {
      return null;
    }

    const roles: UserRole[] = Array.isArray(payload.roles)
      ? (payload.roles as UserRole[])
      : ['member'];
    const chapterIds = Array.isArray(payload.chapterIds) ? (payload.chapterIds as string[]) : [];

    return {
      userId: payload.sub,
      email: payload.email,
      phone: (payload.phone as string) || null,
      roles,
      chapterIds,
      is2faAuthenticated: Boolean(payload.is2faAuthenticated),
      lastActive,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    name: MEMBER_SESSION_COOKIE,
    httpOnly: true,
    secure: isProductionMode(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
    priority: 'high' as const,
  };
}

export async function getSession(): Promise<AuthSession | null> {
  const token = cookies().get(MEMBER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    ...getSessionCookieOptions(),
    value: token,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    ...getSessionCookieOptions(0),
    value: '',
  });
}
