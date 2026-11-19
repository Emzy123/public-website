import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { checkRateLimit, getRateLimitHeaders, getClientIp } from '@/lib/rate-limit';
import { isProductionMode } from '@/lib/runtime/envMode';

export { getClientIp };

let cachedRedis: Redis | null = null;
let cachedRedisUrl = '';
let cachedRedisToken = '';

const limiterCache = new Map<string, Ratelimit>();

export function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || '';
  if (!url || !token) {
    cachedRedis = null;
    cachedRedisUrl = '';
    cachedRedisToken = '';
    return null;
  }
  if (cachedRedis && cachedRedisUrl === url && cachedRedisToken === token) {
    return cachedRedis;
  }
  cachedRedisUrl = url;
  cachedRedisToken = token;
  cachedRedis = new Redis({ url, token });
  limiterCache.clear();
  return cachedRedis;
}

export function clearLimiterCache(): void {
  limiterCache.clear();
  cachedRedis = null;
  cachedRedisUrl = '';
  cachedRedisToken = '';
}

function getUpstashLimiter(prefix: string, max: number, windowSec: number): Ratelimit | null {
  const client = getRedisClient();
  if (!client) return null;

  const cacheKey = `${prefix}:${max}:${windowSec}`;
  const existing = limiterCache.get(cacheKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: client,
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
