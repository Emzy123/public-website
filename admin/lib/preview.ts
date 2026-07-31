import { cookies } from 'next/headers';

export const PREVIEW_COOKIE = 'sinet_cms_preview';
export const PREVIEW_MAX_AGE = 60 * 60; // 1 hour

export function isPreviewMode(): boolean {
  return cookies().get(PREVIEW_COOKIE)?.value === '1';
}

export function previewCookieOptions(enabled: boolean) {
  return {
    name: PREVIEW_COOKIE,
    value: enabled ? '1' : '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: enabled ? PREVIEW_MAX_AGE : 0,
  };
}
