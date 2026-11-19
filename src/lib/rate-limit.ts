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

export function getClientIp(input: unknown): string {
  if (!input || typeof input !== 'object') return 'unknown';

  let headersGetter: { get(name: string): string | null } | null = null;
  let nextRequestIp: string | undefined;

  // 1. Detect a real Headers object (or HeadersAdapter) first
  if (typeof (input as { get?: unknown }).get === 'function') {
    headersGetter = input as { get(name: string): string | null };
  } else if (
    'headers' in input &&
    input.headers &&
    typeof (input.headers as { get?: unknown }).get === 'function'
  ) {
    // 2. Otherwise read input.headers if that has a .get function (e.g. Request / NextRequest)
    headersGetter = input.headers as { get(name: string): string | null };
    nextRequestIp = (input as { ip?: string }).ip;
  }

  // If no valid headers object with .get exists, fall back to 'unknown'
  if (!headersGetter) {
    return 'unknown';
  }

  // NextRequest.ip (populated by Next.js / Vercel Edge runtime)
  if (nextRequestIp?.trim()) {
    return nextRequestIp.trim();
  }

  const realIp = headersGetter.get('x-real-ip');
  if (realIp?.trim()) {
    return realIp.trim();
  }

  const vercelForwarded = headersGetter.get('x-vercel-forwarded-for');
  if (vercelForwarded?.trim()) {
    const parts = vercelForwarded.split(',').map((p) => p.trim()).filter(Boolean);
    const leftmost = parts[0];
    if (leftmost) return leftmost;
  }

  const forwarded = headersGetter.get('x-forwarded-for');
  if (forwarded?.trim()) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    const leftmost = parts[0];
    if (leftmost) return leftmost;
  }

  // Fixed fallback bucket — never trust arbitrary client-supplied headers (e.g. cf-connecting-ip or custom headers)
  return 'unknown';
}

export function getClientKey(req: unknown): string {
  return getClientIp(req);
}

export function getRateLimitHeaders(result: { ok: true } | { ok: false; retryAfterSec: number }): Record<string, string> {
  if (result.ok) return {};
  return { 'Retry-After': String(result.retryAfterSec) };
}
