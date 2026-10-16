import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public health check returns a minimal payload.
 * Detailed dependency status requires HEALTH_CHECK_TOKEN.
 */
export async function GET(request: NextRequest) {
  const token = request.headers.get('x-health-token') || request.nextUrl.searchParams.get('token');
  const expected = process.env.HEALTH_CHECK_TOKEN?.trim();
  const authorized = Boolean(expected && token && token === expected);

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
  const checks = { mongo, redis, email };
  const hasError = Object.values(checks).includes('error');

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
