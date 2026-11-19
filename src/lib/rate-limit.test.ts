import { checkRateLimit, getClientKey, getRateLimitHeaders } from './rate-limit';

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: {
    slidingWindow: jest.fn(),
  },
}));

import { getClientIp, enforceRateLimit } from './security/rate-limit-unified';

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

function mockRequest(headers: Record<string, string>, ip?: string): Request {
  const req = {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as Request;
  if (ip) {
    (req as unknown as { ip: string }).ip = ip;
  }
  return req;
}

describe('getClientKey & getClientIp trusted reverse proxy extraction', () => {
  it('extracts platform-set leftmost trusted IP from x-forwarded-for and x-vercel-forwarded-for', () => {
    const req1 = mockRequest({ 'x-forwarded-for': '198.51.100.1, 10.0.0.1' });
    expect(getClientKey(req1)).toBe('198.51.100.1');
    expect(getClientIp(req1)).toBe('198.51.100.1');

    const req2 = mockRequest({ 'x-vercel-forwarded-for': '198.51.100.2, 10.0.0.2' });
    expect(getClientKey(req2)).toBe('198.51.100.2');
    expect(getClientIp(req2)).toBe('198.51.100.2');
  });

  it('prefers request.ip and x-real-ip when provided by Vercel edge runtime', () => {
    const reqWithIp = mockRequest({ 'x-forwarded-for': '10.0.0.1' }, '203.0.113.10');
    expect(getClientIp(reqWithIp)).toBe('203.0.113.10');

    const reqWithRealIp = mockRequest({
      'x-real-ip': '198.51.100.22',
      'x-forwarded-for': '10.0.0.1',
    });
    expect(getClientIp(reqWithRealIp)).toBe('198.51.100.22');
  });

  it('extracts IP from a Headers instance directly (used by Server Components)', () => {
    const headers = new Headers();
    headers.set('x-real-ip', '198.51.100.55');
    expect(getClientIp(headers)).toBe('198.51.100.55');
  });

  it('falls back to fixed bucket unknown when no trusted IP headers are present', () => {
    const req = mockRequest({});
    expect(getClientKey(req)).toBe('unknown');
    expect(getClientIp(req)).toBe('unknown');
  });

  it('proves that rotating client-supplied headers (e.g. cf-connecting-ip, x-client-ip) does not reset the rate limit', async () => {
    const trustedEdgeIp = `203.0.113.${Math.floor(Math.random() * 200 + 10)}`;
    const prefix = `test-client-headers-${Date.now()}`;

    // Request 1: attacker supplies custom headers
    const req1 = mockRequest({
      'x-real-ip': trustedEdgeIp,
      'cf-connecting-ip': '1.1.1.1',
      'x-client-ip': '10.1.1.1',
    });
    const ip1 = getClientIp(req1);
    expect(ip1).toBe(trustedEdgeIp);
    const res1 = await enforceRateLimit(ip1, prefix, 2, 60);
    expect(res1.ok).toBe(true);

    // Request 2: attacker rotates custom headers
    const req2 = mockRequest({
      'x-real-ip': trustedEdgeIp,
      'cf-connecting-ip': '2.2.2.2',
      'x-client-ip': '10.2.2.2',
    });
    const ip2 = getClientIp(req2);
    expect(ip2).toBe(trustedEdgeIp);
    const res2 = await enforceRateLimit(ip2, prefix, 2, 60);
    expect(res2.ok).toBe(true);

    // Request 3: attacker rotates custom headers again, trying to reset the counter
    const req3 = mockRequest({
      'x-real-ip': trustedEdgeIp,
      'cf-connecting-ip': '3.3.3.3',
      'x-client-ip': '10.3.3.3',
    });
    const ip3 = getClientIp(req3);
    expect(ip3).toBe(trustedEdgeIp);
    const res3 = await enforceRateLimit(ip3, prefix, 2, 60);

    // Must be blocked because trusted edge IP reached limit (2); rotating client headers did NOT reset it
    expect(res3.ok).toBe(false);
  });

  it('proves that rotating client-supplied headers without trusted platform headers maps to fixed unknown bucket and does not reset the limit', async () => {
    const prefix = `test-unknown-bucket-${Date.now()}`;

    // Request 1: rotating arbitrary header without trusted x-real-ip
    const req1 = mockRequest({ 'cf-connecting-ip': '101.101.101.101', 'x-custom-ip': '1.1.1.1' });
    const ip1 = getClientIp(req1);
    expect(ip1).toBe('unknown');
    const res1 = await enforceRateLimit(ip1, prefix, 2, 60);
    expect(res1.ok).toBe(true);

    // Request 2: attacker changes the custom headers
    const req2 = mockRequest({ 'cf-connecting-ip': '102.102.102.102', 'x-custom-ip': '2.2.2.2' });
    const ip2 = getClientIp(req2);
    expect(ip2).toBe('unknown');
    const res2 = await enforceRateLimit(ip2, prefix, 2, 60);
    expect(res2.ok).toBe(true);

    // Request 3: attacker changes the custom headers again
    const req3 = mockRequest({ 'cf-connecting-ip': '103.103.103.103', 'x-custom-ip': '3.3.3.3' });
    const ip3 = getClientIp(req3);
    expect(ip3).toBe('unknown');
    const res3 = await enforceRateLimit(ip3, prefix, 2, 60);

    // Must be blocked because all fallback requests map to fixed bucket 'unknown'
    expect(res3.ok).toBe(false);
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
