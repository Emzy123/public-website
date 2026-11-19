/**
 * Unified Rate Limiting Module (Upstash Redis with in-memory fallback)
 *
 * Security & Architecture Guarantees:
 * 1. IP Extraction Trust Model:
 *    - `getClientIp` derives client IP from platform-set headers (x-real-ip, x-forwarded-for).
 *    - Leftmost entry in `x-forwarded-for` is trusted ONLY because Vercel (the edge CDN/reverse proxy)
 *      overwrites/sets this header with the client's actual IP before forwarding the request to serverless functions.
 *      If deployed outside Vercel or behind a proxy that does not strip untrusted client headers,
 *      client-supplied x-forwarded-for spoofing could occur.
 *
 * 2. Distributed vs In-Memory Fallback:
 *    - Under normal conditions, limits are tracked centrally in Upstash Redis across all serverless instances.
 *    - If Upstash credentials are missing in production, requests fail closed (429) for public endpoints.
 *    - If Upstash is configured but throws an error at runtime (e.g., Redis timeout, network glitch),
 *      the system falls back to the per-instance in-memory limiter (`checkRateLimit`).
 *      This is an accepted residual risk: during an Upstash outage, limits are enforced per-serverless instance
 *      rather than globally, preventing a total denial-of-service outage for legitimate users.
 */
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
      // Accepted residual risk: fall back to per-instance in-memory limiter below
      // to preserve service availability during transient Upstash Redis outages.
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
