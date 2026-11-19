type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function pruneExpiredBuckets(now: number) {
  buckets.forEach((bucket, key) => {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  });
}

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();

  // Protect against unbounded memory growth under high traffic
  if (buckets.size > 1000) {
    pruneExpiredBuckets(now);
  }

  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= max) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }

  existing.count += 1;
  return { ok: true };
}

export function getClientIp(requestOrHeaders: Request | Headers): string {
  if (!requestOrHeaders) return 'unknown';

  let headers: Headers;
  let nextRequestIp: string | undefined;

  if ('headers' in requestOrHeaders && requestOrHeaders.headers) {
    headers = requestOrHeaders.headers;
    nextRequestIp = (requestOrHeaders as unknown as { ip?: string }).ip;
  } else {
    headers = requestOrHeaders as Headers;
  }

  // 1. NextRequest.ip (populated by Next.js / Vercel Edge runtime)
  if (nextRequestIp?.trim()) {
    return nextRequestIp.trim();
  }

  // 2. x-real-ip header (set by trusted reverse proxy / Vercel edge)
  const realIp = headers.get('x-real-ip');
  if (realIp?.trim()) {
    return realIp.trim();
  }

  // 3. x-vercel-forwarded-for (Vercel platform header - platform-set leftmost client IP entry)
  const vercelForwarded = headers.get('x-vercel-forwarded-for');
  if (vercelForwarded?.trim()) {
    const parts = vercelForwarded.split(',').map((p) => p.trim()).filter(Boolean);
    const leftmost = parts[0];
    if (leftmost) return leftmost;
  }

  // 4. x-forwarded-for (platform-set leftmost client IP entry on Vercel)
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded?.trim()) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    const leftmost = parts[0];
    if (leftmost) return leftmost;
  }

  // Fixed fallback bucket — never trust arbitrary client-supplied headers (e.g. cf-connecting-ip or custom headers)
  return 'unknown';
}

export function getClientKey(req: Request | Headers): string {
  return getClientIp(req);
}

export function getRateLimitHeaders(result: { ok: true } | { ok: false; retryAfterSec: number }): Record<string, string> {
  if (result.ok) return {};
  return { 'Retry-After': String(result.retryAfterSec) };
}
