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
  it('extracts right-most trusted IP from x-forwarded-for, ignoring client-spoofed left-most IPs', () => {
    const req = mockRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientKey(req)).toBe('5.6.7.8');
    expect(getClientIp(req)).toBe('5.6.7.8');
  });

  it('prefers request.ip and x-real-ip when provided by Vercel edge runtime', () => {
    const reqWithIp = mockRequest({ 'x-forwarded-for': 'spoofed-1.1.1.1, 10.0.0.1' }, '203.0.113.10');
    expect(getClientIp(reqWithIp)).toBe('203.0.113.10');

    const reqWithRealIp = mockRequest({
      'x-real-ip': '198.51.100.22',
      'x-forwarded-for': 'spoofed-1.1.1.1, 10.0.0.1',
    });
    expect(getClientIp(reqWithRealIp)).toBe('198.51.100.22');
  });

  it('falls back to unknown when no IP headers are present', () => {
    const req = mockRequest({});
    expect(getClientKey(req)).toBe('unknown');
    expect(getClientIp(req)).toBe('unknown');
  });

  it('proves that a spoofed X-Forwarded-For does not reset the rate limit', async () => {
    const trustedEdgeIp = `203.0.113.${Math.floor(Math.random() * 200 + 10)}`;
    const prefix = `test-spoof-${Date.now()}`;

    // Attacker sends request 1 with spoofed header "11.11.11.11"
    const req1 = mockRequest({ 'x-forwarded-for': `11.11.11.11, ${trustedEdgeIp}` });
    const ip1 = getClientIp(req1);
    expect(ip1).toBe(trustedEdgeIp);
    const res1 = await enforceRateLimit(ip1, prefix, 2, 60);
    expect(res1.ok).toBe(true);

    // Attacker sends request 2 with different spoofed header "22.22.22.22"
    const req2 = mockRequest({ 'x-forwarded-for': `22.22.22.22, ${trustedEdgeIp}` });
    const ip2 = getClientIp(req2);
    expect(ip2).toBe(trustedEdgeIp);
    const res2 = await enforceRateLimit(ip2, prefix, 2, 60);
    expect(res2.ok).toBe(true);

    // Attacker sends request 3 with yet another spoofed header "33.33.33.33" trying to reset the counter
    const req3 = mockRequest({ 'x-forwarded-for': `33.33.33.33, ${trustedEdgeIp}` });
    const ip3 = getClientIp(req3);
    expect(ip3).toBe(trustedEdgeIp);
    const res3 = await enforceRateLimit(ip3, prefix, 2, 60);

    // Must be blocked because trusted edge IP reached limit (2); spoofed headers did NOT reset it
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
