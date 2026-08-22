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

export function assertProductionSecrets(): void {
  if (!isProductionMode()) return;

  const required = [
    'ADMIN_SESSION_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD_HASH',
    'CSRF_SECRET',
    'NEXT_PUBLIC_SITE_URL',
    'MONGODB_URI',
    'MONGODB_DB',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ] as const;

  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required production secrets: ${missing.join(', ')}`);
  }

  const sessionSecret = process.env.ADMIN_SESSION_SECRET!.trim();
  if (sessionSecret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters in production');
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH!.trim();
  if (!passwordHash.includes(':')) {
    throw new Error('ADMIN_PASSWORD_HASH is invalid — plaintext passwords are not supported in production');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!.trim();
  if (!siteUrl.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_SITE_URL must use https:// in production');
  }

  if (!process.env.ADMIN_TOTP_SECRET?.trim()) {
    throw new Error('ADMIN_TOTP_SECRET is required in production (admin MFA)');
  }

  if (process.env.ADMIN_PASSWORD?.trim()) {
    throw new Error('ADMIN_PASSWORD must not be set in production — use ADMIN_PASSWORD_HASH only');
  }
}
