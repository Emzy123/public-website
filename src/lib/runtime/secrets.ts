import { isProductionMode } from './envMode';

export function getAdminSessionSecret(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret?.trim()) {
    throw new Error('ADMIN_SESSION_SECRET is required');
  }

  return new TextEncoder().encode(secret);
}

export function getMediaSigningSecret(): string {
  const dedicated = process.env.MEDIA_SIGNING_SECRET?.trim();
  if (dedicated) return dedicated;

  const session = process.env.ADMIN_SESSION_SECRET?.trim();
  if (session) return session;

  if (isProductionMode()) {
    throw new Error('MEDIA_SIGNING_SECRET or ADMIN_SESSION_SECRET is required in production');
  }

  return 'dev-media-key';
}

/**
 * Production boot checks.
 *
 * AUTH_SECRET missing: fatal. Member JWT signing has no production fallback.
 * DATABASE_URL missing: fatal. Instrumentation throws, so the Node server
 *   (including Vercel serverless functions that import instrumentation) will
 *   not boot — the whole site is down until the env var is set.
 * DATABASE_URL set but unreachable: the rest of the site stays up; Postgres
 *   routes return 503. Marketing/CMS Mongo routes are unaffected.
 */
export function assertProductionSecrets(): void {
  if (!isProductionMode()) return;

  if (!process.env.AUTH_SECRET?.trim()) {
    throw new Error('Fatal: AUTH_SECRET is required in production');
  }

  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error('Fatal: DATABASE_URL is required in production');
  }

  const required = [
    'ADMIN_SESSION_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD_HASH',
    'ADMIN_TOTP_SECRET',
    'NEXT_PUBLIC_SITE_URL',
    'MONGODB_URI',
    'MONGODB_DB',
    'AUTH_FROM_EMAIL',
  ] as const;

  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(`[security] Missing required production secrets: ${missing.join(', ')}`);
  }

  const sessionSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (sessionSecret && sessionSecret.length < 32) {
    console.error('[security] ADMIN_SESSION_SECRET must be at least 32 characters in production');
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (passwordHash && !passwordHash.includes(':')) {
    console.error('[security] ADMIN_PASSWORD_HASH is invalid — use salt:hash from scripts/hash-admin-password.ts');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl && !siteUrl.startsWith('https://')) {
    console.error('[security] NEXT_PUBLIC_SITE_URL must use https:// in production');
  }

  if (!process.env.UPSTASH_REDIS_REST_URL?.trim() || !process.env.UPSTASH_REDIS_REST_TOKEN?.trim()) {
    console.error('[security] Upstash Redis is not configured — rate limiting will fail closed in production');
  }

  if (process.env.ADMIN_PASSWORD?.trim()) {
    console.error('[security] ADMIN_PASSWORD is set — remove it and use ADMIN_PASSWORD_HASH only');
  }
}
