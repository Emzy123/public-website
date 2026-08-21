import { NextRequest, NextResponse } from 'next/server';
import { createSession, sessionCookieOptions, validateCredentials } from '@admin/lib/auth';
import { isMfaEnabled, verifyTotp } from '@admin/lib/mfa';
import { writeAuditLog } from '@/lib/audit/log';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';

function normalizeEnv(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '');
}

function isAdminAuthConfigured(): boolean {
  const email = normalizeEnv(process.env.ADMIN_EMAIL);
  const hash = normalizeEnv(process.env.ADMIN_PASSWORD_HASH);
  const sessionSecret = normalizeEnv(process.env.ADMIN_SESSION_SECRET);
  return Boolean(email && hash.includes(':') && sessionSecret.length >= 32);
}

const accountAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ACCOUNT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkAccountLockout(email: string): { locked: boolean; remainingMs?: number } {
  const key = email.toLowerCase();
  const record = accountAttempts.get(key);
  if (!record) return { locked: false };

  if (record.lockedUntil > Date.now()) {
    return { locked: true, remainingMs: record.lockedUntil - Date.now() };
  }

  if (record.lockedUntil > 0 && record.lockedUntil <= Date.now()) {
    accountAttempts.delete(key);
  }
  return { locked: false };
}

function recordFailedAttempt(email: string): void {
  const key = email.toLowerCase();
  const record = accountAttempts.get(key) ?? { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_ACCOUNT_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  accountAttempts.set(key, record);
}

function clearAttempts(email: string): void {
  accountAttempts.delete(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  // Fail predictably when a deployment is missing an admin setting. Without
  // this guard, a valid password reaches JWT signing and becomes a vague 500.
  if (!isAdminAuthConfigured()) {
    console.error('Admin login is unavailable: required admin authentication environment variables are missing.');
    return NextResponse.json({ error: 'Admin sign-in is temporarily unavailable. Please contact site support.' }, { status: 503 });
  }

  const ip = getClientIp(request);

  try {
    const limited = await enforceRateLimit(ip, 'admin-login', 5, 15 * 60);
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429, headers: limited.headers }
      );
    }

    const body = await request.json();
    const email = String(body?.email ?? '').trim();
    const password = String(body?.password ?? '');
    const totpCode = String(body?.totpCode ?? '').trim();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const lockout = checkAccountLockout(email);
    if (lockout.locked) {
      const minutes = Math.ceil((lockout.remainingMs ?? 0) / 60000);
      await writeAuditLog({
        action: 'admin.login_failed',
        actor: email,
        ip,
        metadata: { reason: 'account_locked', remainingMinutes: minutes },
      });
      return NextResponse.json(
        { error: `Account temporarily locked. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` },
        { status: 429 }
      );
    }

    if (isMfaEnabled() && !totpCode) {
      return NextResponse.json({ error: 'Authentication code is required', mfaRequired: true }, { status: 400 });
    }

    if (!validateCredentials(email, password)) {
      await writeAuditLog({
        action: 'admin.login_failed',
        actor: email,
        ip,
        metadata: { reason: 'invalid_credentials' },
      });
      recordFailedAttempt(email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (isMfaEnabled() && !verifyTotp(totpCode)) {
      await writeAuditLog({
        action: 'admin.login_failed',
        actor: email,
        ip,
        metadata: { reason: 'invalid_totp' },
      });
      recordFailedAttempt(email);
      return NextResponse.json({ error: 'Invalid authentication code' }, { status: 401 });
    }

    clearAttempts(email);
    const token = await createSession(email);
    await writeAuditLog({
      action: 'admin.login',
      actor: email,
      ip,
    });

    const response = NextResponse.json({ success: true, email, mfaRequired: isMfaEnabled() });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
