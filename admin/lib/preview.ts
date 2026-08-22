import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { isProductionMode } from '@/lib/runtime/envMode';

export const PREVIEW_COOKIE = 'sinet_cms_preview';
export const PREVIEW_MAX_AGE = 60 * 60; // 1 hour

function getPreviewSigningKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.CSRF_SECRET?.trim();
  if (!secret) {
    // Avoid crashing public pages if secrets are misconfigured.
    return 'dev-preview-key';
  }
  return secret;
}

function signPreviewPayload(payload: string): string {
  return createHmac('sha256', getPreviewSigningKey()).update(payload).digest('base64url');
}

/** Creates a signed, time-bound preview token. Unsigned "1" values are rejected. */
export function createPreviewToken(): string {
  const expires = Math.floor(Date.now() / 1000) + PREVIEW_MAX_AGE;
  const payload = `1.${expires}`;
  return `${payload}.${signPreviewPayload(payload)}`;
}

export function verifyPreviewToken(value: string | undefined): boolean {
  if (!value || value === '1') return false;

  const parts = value.split('.');
  if (parts.length !== 3) return false;

  const [flag, expiresRaw, signature] = parts;
  if (flag !== '1' || !expiresRaw || !signature) return false;

  const expires = Number.parseInt(expiresRaw, 10);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;

  const payload = `${flag}.${expiresRaw}`;
  const expected = signPreviewPayload(payload);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;

  try {
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

export function isPreviewMode(): boolean {
  return verifyPreviewToken(cookies().get(PREVIEW_COOKIE)?.value);
}

export function previewCookieOptions(enabled: boolean) {
  return {
    name: PREVIEW_COOKIE,
    value: enabled ? createPreviewToken() : '',
    httpOnly: true,
    secure: isProductionMode(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: enabled ? PREVIEW_MAX_AGE : 0,
  };
}
