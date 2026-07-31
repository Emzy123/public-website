import { validateRouteSecurityConfig } from './securityConfig';

const originalEnv = process.env;

function withEnv(vars: Record<string, string | undefined>) {
  process.env = { ...originalEnv, ...vars };
}

describe('validateRouteSecurityConfig', () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  describe('waitlist route', () => {
    const waitlistEnv = {
      NODE_ENV: 'development',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'site-key',
      RECAPTCHA_SECRET_KEY: 'secret-key',
      EMAIL_SERVICE: 'resend',
      RESEND_API_KEY: 'api-key',
      RESEND_AUDIENCE_ID: 'audience-id',
    };

    it('passes when all required vars are set', () => {
      withEnv(waitlistEnv);
      const result = validateRouteSecurityConfig('waitlist');
      expect(result.ok).toBe(true);
    });

    it('fails with details in development when vars are missing', () => {
      withEnv({ NODE_ENV: 'development' });
      const result = validateRouteSecurityConfig('waitlist');
      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
      expect(result.details).toContain('Missing env vars for waitlist');
    });

    it('fails with generic message in production', () => {
      withEnv({ NODE_ENV: 'production' });
      const result = validateRouteSecurityConfig('waitlist');
      expect(result.ok).toBe(false);
      expect(result.message).toBe('Service is not configured correctly.');
      expect(result.details).toBeUndefined();
    });

    it('fails with 503 when Upstash Redis is missing in production', () => {
      withEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'site-key',
        RECAPTCHA_SECRET_KEY: 'secret-key',
        EMAIL_SERVICE: 'resend',
        RESEND_API_KEY: 'api-key',
        RESEND_AUDIENCE_ID: 'audience-id',
      });
      const result = validateRouteSecurityConfig('waitlist');
      expect(result.ok).toBe(false);
      expect(result.status).toBe(503);
    });

    it('passes in production when all vars including Upstash are set', () => {
      withEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
        NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'site-key',
        RECAPTCHA_SECRET_KEY: 'secret-key',
        EMAIL_SERVICE: 'resend',
        RESEND_API_KEY: 'api-key',
        RESEND_AUDIENCE_ID: 'audience-id',
        UPSTASH_REDIS_REST_URL: 'https://redis-url.com',
        UPSTASH_REDIS_REST_TOKEN: 'token',
      });
      const result = validateRouteSecurityConfig('waitlist');
      expect(result.ok).toBe(true);
    });
  });

  describe('contact route', () => {
    it('requires MongoDB and Resend config', () => {
      withEnv({ NODE_ENV: 'development' });
      const result = validateRouteSecurityConfig('contact');
      expect(result.ok).toBe(false);
      expect(result.details).toMatch(/MONGODB_URI/);
    });

    it('passes with contact env vars set', () => {
      withEnv({
        NODE_ENV: 'development',
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_DB: 'sinet',
        RESEND_API_KEY: 'key',
        RESEND_FROM_EMAIL: 'SINet <noreply@sinet.africa>',
      });
      const result = validateRouteSecurityConfig('contact');
      expect(result.ok).toBe(true);
    });
  });

  describe('academy route', () => {
    it('requires only MongoDB config', () => {
      withEnv({
        NODE_ENV: 'development',
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGODB_DB: 'sinet',
      });
      const result = validateRouteSecurityConfig('academy');
      expect(result.ok).toBe(true);
    });
  });
});
