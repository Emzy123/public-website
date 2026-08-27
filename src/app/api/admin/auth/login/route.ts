import { NextRequest, NextResponse } from 'next/server';
import { createSession, sessionCookieOptions, validateCredentials } from '@admin/lib/auth';
import { isMfaEnabled, verifyTotp } from '@admin/lib/mfa';
import { writeAuditLog } from '@/lib/audit/log';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { validateOrigin } from '@/lib/security/origin';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { csrfProtect } from '@/lib/csrf';
import { isProductionMode } from '@/lib/runtime/envMode';
import { Redis } from '@upstash/redis';

function normalizeEnv(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '');
}

function isAdminAuthConfigured(): boolean {
  const email = normalizeEnv(process.env.ADMIN_EMAIL);
  const hash = normalizeEnv(process.env.ADMIN_PASSWORD_HASH);
  const sessionSecret = normalizeEnv(process.env.ADMIN_SESSION_SECRET);
  return Boolean(email && hash.includes(':') && sessionSecret.length >= 32);
}

const memoryAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ACCOUNT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

async function checkAccountLockout(email: string): Promise<{ locked: boolean; remainingMs?: number }> {
  const key = `sinet:admin-lockout:${email.toLowerCase()}`;

  if (redis) {
    try {
      const lockedUntil = await redis.get<number>(key);
      if (typeof lockedUntil === 'number' && lockedUntil > Date.now()) {
        return { locked: true, remainingMs: lockedUntil - Date.now() };
      }
      return { locked: false };
    } catch (error) {
      console.error('Redis lockout check failed:', error);
      // Fall through to in-memory lockout — do not lock every admin out of the site.
    }
  }

  const record = memoryAttempts.get(email.toLowerCase());
  if (!record) return { locked: false };
  if (record.lockedUntil > Date.now()) {
    return { locked: true, remainingMs: record.lockedUntil - Date.now() };
  }
  if (record.lockedUntil > 0 && record.lockedUntil <= Date.now()) {
    memoryAttempts.delete(email.toLowerCase());
  }
  return { locked: false };
}

async function recordFailedAttempt(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  const key = `sinet:admin-lockout-count:${normalized}`;

  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.pexpire(key, LOCKOUT_DURATION_MS);
      if (count >= MAX_ACCOUNT_ATTEMPTS) {
        await redis.set(`sinet:admin-lockout:${normalized}`, Date.now() + LOCKOUT_DURATION_MS, {
          px: LOCKOUT_DURATION_MS,
        });
      }
      return;
    } catch (error) {
      console.error('Redis lockout write failed:', error);
    }
  }

  const record = memoryAttempts.get(normalized) ?? { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_ACCOUNT_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
  memoryAttempts.set(normalized, record);
}

async function clearAttempts(email: string): Promise<void> {
  const normalized = email.toLowerCase();
  memoryAttempts.delete(normalized);
  if (redis) {
    try {
      await redis.del(`sinet:admin-lockout:${normalized}`, `sinet:admin-lockout-count:${normalized}`);
    } catch {
      /* ignore */
    }
  }
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  await csrfProtect(request, response);
  return response;
}

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;

  if (!isAdminAuthConfigured()) {
    console.error('Admin login is unavailable: required admin authentication environment variables are missing.');
    return NextResponse.json({ error: 'Admin sign-in is temporarily unavailable. Please contact site support.' }, { status: 503 });
  }

  if (isProductionMode() && !isMfaEnabled()) {
    console.error('[security] ADMIN_TOTP_SECRET is not set — admin login is unavailable until MFA is configured.');
    return NextResponse.json(
      { error: 'Admin sign-in requires multi-factor authentication. Please contact site support.' },
      { status: 503 }
    );
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

    const lockout = await checkAccountLockout(email);
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
      await recordFailedAttempt(email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (isMfaEnabled() && !verifyTotp(totpCode)) {
      await writeAuditLog({
        action: 'admin.login_failed',
        actor: email,
        ip,
        metadata: { reason: 'invalid_totp' },
      });
      await recordFailedAttempt(email);
      return NextResponse.json({ error: 'Invalid authentication code' }, { status: 401 });
    }

    await clearAttempts(email);
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
