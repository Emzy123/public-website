export const MEDIA_MAX_BYTES = 4 * 1024 * 1024;

export const MEDIA_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type MediaMimeType = (typeof MEDIA_ALLOWED_TYPES)[number];

function hasPrefix(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Verify the file contents instead of trusting the browser-provided MIME type.
 * The supported formats have stable, well-defined file signatures.
 */
export function detectMediaMimeType(bytes: Uint8Array): MediaMimeType | null {
  if (bytes.length < 12) return null;
  if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (hasPrefix(bytes, [0x47, 0x49, 0x46, 0x38]) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) return 'image/gif';
  if (hasPrefix(bytes, [0x52, 0x49, 0x46, 0x46]) && hasPrefix(bytes.slice(8), [0x57, 0x45, 0x42, 0x50])) return 'image/webp';
  return null;
}

export function validateMediaUpload(
  contentType: string,
  sizeBytes: number,
  filename?: string,
  bytes?: Uint8Array
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

  if (bytes) {
    const detected = detectMediaMimeType(bytes);
    if (!detected || detected !== contentType) {
      return { ok: false, error: 'File contents do not match the declared image type.' };
    }
  }

  return { ok: true };
}
