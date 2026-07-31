import type { NextRequest } from 'next/server';
import { allowedOrigins } from '@/lib/constants';

export function validateOrigin(request: NextRequest | Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (origin && allowedOrigins.includes(origin as (typeof allowedOrigins)[number])) {
    return true;
  }

  if (referer) {
    return allowedOrigins.some((allowed) => referer.startsWith(allowed));
  }

  return false;
}
