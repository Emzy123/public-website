import { isProductionMode } from './envMode';

export function getAdminSessionSecret(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret?.trim()) {
    throw new Error('ADMIN_SESSION_SECRET is required');
  }

  return new TextEncoder().encode(secret);
}

export function assertProductionSecrets(): void {
  if (!isProductionMode()) return;

  const required = ['ADMIN_SESSION_SECRET', 'CSRF_SECRET', 'NEXT_PUBLIC_SITE_URL'] as const;
  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required production secrets: ${missing.join(', ')}`);
  }

  if (!process.env.ADMIN_PASSWORD_HASH?.trim() && !process.env.ADMIN_PASSWORD?.trim()) {
    throw new Error('ADMIN_PASSWORD_HASH is required in production (plain ADMIN_PASSWORD is discouraged)');
  }
}
