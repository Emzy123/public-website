import { createHmac, timingSafeEqual } from 'node:crypto';

const EXPIRY_SECONDS = 3600; // 1 hour

function getSigningKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.CSRF_SECRET || 'dev-media-key';
  return secret;
}

export function generateSignedMediaUrl(id: string): string {
  const expires = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;
  const data = `${id}:${expires}`;
  const signature = createHmac('sha256', getSigningKey()).update(data).digest('hex').slice(0, 16);
  return `/api/media/${id}?expires=${expires}&sig=${signature}`;
}

export function verifyMediaSignature(id: string, expires: string, signature: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const exp = parseInt(expires, 10);
  if (isNaN(exp) || exp < now) return false;

  const data = `${id}:${exp}`;
  const expected = createHmac('sha256', getSigningKey()).update(data).digest('hex').slice(0, 16);

  const expectedBytes = Buffer.from(expected, 'utf8');
  const signatureBytes = Buffer.from(signature, 'utf8');
  return expectedBytes.length === signatureBytes.length && timingSafeEqual(expectedBytes, signatureBytes);
}
