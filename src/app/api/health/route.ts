import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckStatus = 'ok' | 'degraded' | 'error';

async function checkMongo(): Promise<CheckStatus> {
  if (!process.env.MONGODB_URI?.trim()) return 'degraded';
  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    return 'ok';
  } catch {
    return 'error';
  }
}

function checkRedis(): CheckStatus {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return 'ok';
  }
  return 'degraded';
}

function checkEmail(): CheckStatus {
  return process.env.RESEND_API_KEY?.trim() ? 'ok' : 'degraded';
}

export async function GET() {
  const [mongo] = await Promise.all([checkMongo()]);
  const redis = checkRedis();
  const email = checkEmail();

  const checks = { mongo, redis, email };
  const hasError = Object.values(checks).includes('error');
  const status = hasError ? 'unhealthy' : 'healthy';

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      checks,
    },
    { status: hasError ? 503 : 200 }
  );
}
