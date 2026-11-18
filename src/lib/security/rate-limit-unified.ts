import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { isProductionMode } from '@/lib/runtime/envMode';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(prefix: string, max: number, windowSec: number): Ratelimit | null {
  if (!redis) return null;

  const cacheKey = `${prefix}:${max}:${windowSec}`;
  const existing = limiterCache.get(cacheKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
    analytics: true,
    prefix: `sinet:${prefix}`,
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

export type RateLimitResult =
  | { ok: true; headers: Record<string, string> }
  | { ok: false; retryAfterSec: number; headers: Record<string, string> };

export async function enforceRateLimit(
  identifier: string,
  prefix: string,
  max: number,
  windowSec: number
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(prefix, max, windowSec);

  if (limiter) {
    try {
      const { success, reset } = await limiter.limit(identifier);
      if (!success) {
        const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return {
          ok: false,
          retryAfterSec,
          headers: { 'Retry-After': String(retryAfterSec) },
        };
      }
      return { ok: true, headers: {} };
    } catch (error) {
      console.error(`Upstash rate limit failed for ${prefix}:`, error);
      // Fall through to memory limiter below for availability.
    }
  } else if (isProductionMode() && prefix !== 'admin-login') {
    console.error(`Upstash rate limiter unavailable for ${prefix}; rejecting request in production.`);
    return {
      ok: false,
      retryAfterSec: 60,
      headers: { 'Retry-After': '60' },
    };
  }

  const memoryKey = `${prefix}:${identifier}`;
  const result = checkRateLimit(memoryKey, max, windowSec * 1000);
  if (!result.ok) {
    return {
      ok: false,
      retryAfterSec: result.retryAfterSec,
      headers: getRateLimitHeaders(result),
    };
  }
  return { ok: true, headers: {} };
}

export function getClientIp(request: Request): string {
  // 1. NextRequest.ip (populated by Next.js / Vercel Edge runtime)
  const nextRequestIp = (request as unknown as { ip?: string }).ip;
  if (nextRequestIp?.trim()) {
    return nextRequestIp.trim();
  }

  // 2. x-real-ip header (set by trusted reverse proxy / Vercel edge)
  const realIp = request.headers.get('x-real-ip');
  if (realIp?.trim()) return realIp.trim();

  // 3. x-vercel-forwarded-for (Vercel platform header - right-most trusted entry)
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwarded?.trim()) {
    const parts = vercelForwarded.split(',').map((p) => p.trim()).filter(Boolean);
    const rightMost = parts[parts.length - 1];
    if (rightMost) return rightMost;
  }

  // 4. x-forwarded-for (standard proxy header - right-most trusted entry, never left-most client spoof)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded?.trim()) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    const rightMost = parts[parts.length - 1];
    if (rightMost) return rightMost;
  }

  return 'unknown';
}
