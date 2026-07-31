export const MEDIA_URL_PREFIX = '/api/media/';

export function buildMediaUrl(id: string): string {
  return `${MEDIA_URL_PREFIX}${id}`;
}

export function isMediaUrl(value: string): boolean {
  return value.startsWith(MEDIA_URL_PREFIX);
}

export function extractMediaId(value: string): string | null {
  if (!isMediaUrl(value)) return null;
  const id = value.slice(MEDIA_URL_PREFIX.length).split(/[?#]/)[0];
  return id || null;
}
