import { NextRequest, NextResponse } from 'next/server';
import { getAuthHealthDiagnostic } from '@/lib/auth/otp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function isAuthorizedAdmin(request: NextRequest): Promise<boolean> {
  const token = request.headers.get('x-health-token')?.trim();
  const expected = process.env.HEALTH_CHECK_TOKEN?.trim();
  if (expected && token && token === expected) {
    return true;
  }

  const adminCookie = request.cookies.get('sinet_admin_session')?.value;
  if (adminCookie) {
    try {
      const { verifySession } = await import('@admin/lib/auth');
      const session = await verifySession(adminCookie);
      if (session?.email) {
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        if (adminEmail && session.email.toLowerCase() === adminEmail) {
          return true;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return false;
}

/**
 * Public health check returns a minimal payload.
 * Detailed dependency status and OTP diagnostics require an admin session or HEALTH_CHECK_TOKEN.
 */
export async function GET(request: NextRequest) {
  const authorized = await isAuthorizedAdmin(request);

  const emailMissingFrom = Boolean(
    process.env.RESEND_API_KEY?.trim() && !process.env.AUTH_FROM_EMAIL?.trim()
  );

  if (!authorized) {
    if (emailMissingFrom) {
      return NextResponse.json({ status: 'unhealthy' }, { status: 503 });
    }
    return NextResponse.json({ ok: true, status: 'healthy' }, { status: 200 });
  }

  const { getMongoDb } = await import('@/lib/db/mongodb');

  let mongo: 'ok' | 'degraded' | 'error' = 'degraded';
  if (process.env.MONGODB_URI?.trim()) {
    try {
      const db = await getMongoDb();
      await db.command({ ping: 1 });
      mongo = 'ok';
    } catch {
      mongo = 'error';
    }
  }

  const redis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? 'ok' : 'degraded';
  const email = emailMissingFrom
    ? 'error'
    : (process.env.RESEND_API_KEY?.trim() && process.env.AUTH_FROM_EMAIL?.trim())
      ? 'ok'
      : 'degraded';

  const authOtp = await getAuthHealthDiagnostic();
  const checks = { mongo, redis, email, authOtp };
  const hasError = mongo === 'error' || email === 'error' || authOtp.status === 'error';

  return NextResponse.json(
    {
      status: hasError ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      checks,
    },
    { status: hasError ? 503 : 200 }
  );
}
