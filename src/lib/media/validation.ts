export const MEDIA_MAX_BYTES = 4 * 1024 * 1024;

export const MEDIA_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type MediaMimeType = (typeof MEDIA_ALLOWED_TYPES)[number];

export function validateMediaUpload(
  contentType: string,
  sizeBytes: number,
  filename?: string
): { ok: true } | { ok: false; error: string } {
  if (!contentType || !MEDIA_ALLOWED_TYPES.includes(contentType as MediaMimeType)) {
    return {
      ok: false,
      error: `Unsupported file type. Allowed: JPEG, PNG, WebP, GIF.`,
    };
  }

  if (sizeBytes <= 0) {
    return { ok: false, error: 'File is empty.' };
  }

  if (sizeBytes > MEDIA_MAX_BYTES) {
    return {
      ok: false,
      error: `File is too large. Maximum size is ${Math.round(MEDIA_MAX_BYTES / (1024 * 1024))}MB.`,
    };
  }

  if (filename && filename.length > 200) {
    return { ok: false, error: 'Filename is too long.' };
  }

  return { ok: true };
}
