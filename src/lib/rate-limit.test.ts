import { checkRateLimit, getClientKey, getRateLimitHeaders } from './rate-limit';

describe('checkRateLimit', () => {
  it('allows requests within the limit', () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60_000)).toEqual({ ok: true });
    expect(checkRateLimit(key, 3, 60_000)).toEqual({ ok: true });
    expect(checkRateLimit(key, 3, 60_000)).toEqual({ ok: true });
  });

  it('blocks requests over the limit', () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    const result = checkRateLimit(key, 2, 60_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterSec).toBeGreaterThan(0);
    }
  });
});

function mockRequest(headers: Record<string, string>): Request {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as Request;
}

describe('getClientKey', () => {
  it('extracts IP from x-forwarded-for', () => {
    const req = mockRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientKey(req)).toBe('1.2.3.4');
  });

  it('falls back to unknown', () => {
    const req = mockRequest({});
    expect(getClientKey(req)).toBe('unknown');
  });
});

describe('getRateLimitHeaders', () => {
  it('returns empty headers when allowed', () => {
    expect(getRateLimitHeaders({ ok: true })).toEqual({});
  });

  it('returns Retry-After when blocked', () => {
    expect(getRateLimitHeaders({ ok: false, retryAfterSec: 30 })).toEqual({
      'Retry-After': '30',
    });
  });
});
