/**
 * Routes where marketing chrome (announcement spotlight strips and flyer modals)
 * must NEVER be rendered.
 *
 * Covers:
 * - Auth flows (/sign-in, /verify-code, /2fa)
 * - Dashboard / portal (/portal, /dashboard)
 * - Admin console (/admin)
 * - Application wizard & deep-links (/join, /join/*)
 * - Credential verification (/verify, /verify/*)
 */
export const ADVERT_SUPPRESSED_PREFIXES = [
  '/sign-in',
  '/verify-code',
  '/2fa',
  '/portal',
  '/dashboard',
  '/admin',
  '/join',
  '/verify',
] as const;

export function isAdvertSuppressedRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // Strip query string and hash if passed
  const cleanPath = pathname.split('?')[0].split('#')[0].trim();
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  return ADVERT_SUPPRESSED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}
