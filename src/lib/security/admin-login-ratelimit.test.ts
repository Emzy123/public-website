/** @jest-environment node */

const mockLimit = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    del: jest.fn(),
  })),
}));

jest.mock('@upstash/ratelimit', () => {
  const MockRatelimit = jest.fn().mockImplementation(() => ({
    limit: mockLimit,
  }));
  (MockRatelimit as any).slidingWindow = jest.fn().mockReturnValue({});
  return { Ratelimit: MockRatelimit };
});

import { enforceRateLimit, clearLimiterCache } from './rate-limit-unified';
import { Ratelimit } from '@upstash/ratelimit';

describe('admin-login limiter Upstash integration & in-memory fallback', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    clearLimiterCache();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = { ...originalEnv };
  });

  it('uses Upstash Ratelimit when UPSTASH_REDIS_REST_URL and TOKEN are configured', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token-xyz';
    (process.env as any).NODE_ENV = 'production';

    mockLimit.mockResolvedValueOnce({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 900_000,
    });

    const result = await enforceRateLimit('198.51.100.5', 'admin-login', 5, 900);

    expect(result.ok).toBe(true);
    expect(Ratelimit).toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith('198.51.100.5');
  });

  it('enforces Upstash rejection when Upstash returns success: false', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token-xyz';
    (process.env as any).NODE_ENV = 'production';

    mockLimit.mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const result = await enforceRateLimit('198.51.100.6', 'admin-login', 5, 900);

    expect(result.ok).toBe(false);
    expect(result.headers['Retry-After']).toBeDefined();
    expect(mockLimit).toHaveBeenCalledWith('198.51.100.6');
  });

  it('falls back to in-memory limiter without lockout when Upstash is unconfigured in production', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    (process.env as any).NODE_ENV = 'production';

    // Other routes fail closed with 429 when Upstash is missing
    const otherResult = await enforceRateLimit('198.51.100.7', 'member-auth-otp', 3, 600);
    expect(otherResult.ok).toBe(false);
    expect(otherResult.headers['Retry-After']).toBe('60');

    // admin-login falls back to in-memory sliding window to prevent operator lockout
    const adminResult = await enforceRateLimit('198.51.100.7', 'admin-login', 5, 900);
    expect(adminResult.ok).toBe(true);
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it('falls back to in-memory limiter when Upstash throws a runtime connection error', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token-xyz';
    (process.env as any).NODE_ENV = 'production';

    // Mock Upstash throwing network error (e.g. timeout / DNS error)
    mockLimit.mockRejectedValueOnce(new Error('Connection timeout to upstash.io'));

    const result = await enforceRateLimit('198.51.100.8', 'admin-login', 5, 900);

    // Succeeded via in-memory fallback
    expect(result.ok).toBe(true);
    expect(mockLimit).toHaveBeenCalledWith('198.51.100.8');
  });
});
