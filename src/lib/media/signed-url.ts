import { createHmac, timingSafeEqual } from 'node:crypto';
import { getMediaSigningSecret } from '@/lib/runtime/secrets';

const EXPIRY_SECONDS = 3600; // 1 hour

export function generateSignedMediaUrl(id: string): string {
  const expires = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;
  const data = `${id}:${expires}`;
  const signature = createHmac('sha256', getMediaSigningSecret()).update(data).digest('base64url');
  return `/api/media/${id}?expires=${expires}&sig=${encodeURIComponent(signature)}`;
}

export function verifyMediaSignature(id: string, expires: string, signature: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const exp = Number.parseInt(expires, 10);
  if (!Number.isFinite(exp) || exp < now) return false;

  const data = `${id}:${exp}`;
  const expected = createHmac('sha256', getMediaSigningSecret()).update(data).digest('base64url');

  try {
    const expectedBytes = Buffer.from(expected);
    const signatureBytes = Buffer.from(decodeURIComponent(signature));
    return expectedBytes.length === signatureBytes.length && timingSafeEqual(expectedBytes, signatureBytes);
  } catch {
    return false;
  }
}
