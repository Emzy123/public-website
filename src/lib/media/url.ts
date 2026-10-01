export const MEDIA_URL_PREFIX = '/api/media/';

export function extractMediaId(value: string): string | null {
  if (!value.startsWith(MEDIA_URL_PREFIX)) return null;
  const id = value.slice(MEDIA_URL_PREFIX.length).split(/[?#]/)[0];
  return id || null;
}

export function isMediaUrl(value: string): boolean {
  return value.startsWith(MEDIA_URL_PREFIX);
}

/**
 * CMS uploads are public marketing assets. Store and serve stable paths —
 * never persist signed query params (those expire and break flyers/logos).
 */
export function buildMediaUrl(id: string): string {
  return `${MEDIA_URL_PREFIX}${id}`;
}

/** Strip expired `?expires=&sig=` (or any query) from a stored media URL. */
export function toPublicMediaUrl(value: string): string {
  const id = extractMediaId(value);
  if (!id) return value;
  return buildMediaUrl(id);
}

/** Deep-rewrite any `/api/media/...` strings inside CMS payloads to durable URLs. */
export function rewriteMediaUrlsDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return toPublicMediaUrl(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => rewriteMediaUrlsDeep(item)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      out[key] = rewriteMediaUrlsDeep(child);
    }
    return out as T;
  }
  return value;
}
