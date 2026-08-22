import type { NextRequest } from 'next/server';
import { isProductionMode } from '@/lib/runtime/envMode';

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    const origin = normalizeOrigin(siteUrl);
    if (origin) origins.add(origin);
  }

  // Production canonical hosts
  origins.add('https://sinet.africa');
  origins.add('https://www.sinet.africa');

  // Localhost only outside production
  if (!isProductionMode()) {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }

  // Current Vercel deployment hostname (preview + production)
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    origins.add(`https://${vercelUrl.replace(/^https?:\/\//, '')}`);
  }

  return origins;
}

let cachedOrigins: Set<string> | null = null;

function allowedOrigins(): Set<string> {
  if (!cachedOrigins) cachedOrigins = buildAllowedOrigins();
  return cachedOrigins;
}

export function validateOrigin(request: NextRequest | Request): boolean {
  const allowed = allowedOrigins();
  const originHeader = request.headers.get('origin');
  const refererHeader = request.headers.get('referer');

  if (originHeader) {
    const origin = normalizeOrigin(originHeader);
    return Boolean(origin && allowed.has(origin));
  }

  // Some same-origin navigations omit Origin; accept only exact Referer origins.
  if (refererHeader) {
    const refererOrigin = normalizeOrigin(refererHeader);
    return Boolean(refererOrigin && allowed.has(refererOrigin));
  }

  return false;
}

/** @deprecated Prefer validateOrigin — kept for any older imports */
export const allowedOriginsList = Array.from(allowedOrigins());
