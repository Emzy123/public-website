import { TOTP } from 'otpauth';

let totpVerifier: TOTP | null = null;

function getVerifier(): TOTP | null {
  const secret = process.env.ADMIN_TOTP_SECRET?.trim();
  if (!secret) return null;

  if (!totpVerifier) {
    totpVerifier = new TOTP({
      issuer: 'SINet Admin',
      label: process.env.ADMIN_EMAIL ?? 'admin',
      secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
  }

  return totpVerifier;
}

export function isMfaEnabled(): boolean {
  return Boolean(process.env.ADMIN_TOTP_SECRET?.trim());
}

export function verifyTotp(code: string): boolean {
  const verifier = getVerifier();
  // Fail closed when MFA is not configured — callers must gate with isMfaEnabled().
  if (!verifier) return false;

  const normalized = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;

  return verifier.validate({ token: normalized, window: 1 }) !== null;
}
