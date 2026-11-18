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

export function getClientKey(req: Request): string {
  const reqIp = (req as unknown as { ip?: string }).ip;
  if (reqIp?.trim()) return reqIp.trim();

  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const cfIp = req.headers.get('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;

  const vercelForwarded = req.headers.get('x-vercel-forwarded-for')?.trim();
  if (vercelForwarded) {
    const parts = vercelForwarded.split(',').map((p) => p.trim()).filter(Boolean);
    const rightMost = parts[parts.length - 1];
    if (rightMost) return rightMost;
  }

  const forwarded = req.headers.get('x-forwarded-for')?.trim();
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    const rightMost = parts[parts.length - 1];
    if (rightMost) return rightMost;
  }

  return 'unknown';
}

export function getRateLimitHeaders(result: { ok: true } | { ok: false; retryAfterSec: number }): Record<string, string> {
  if (result.ok) return {};
  return { 'Retry-After': String(result.retryAfterSec) };
}
