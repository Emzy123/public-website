import * as OTPAuth from 'otpauth';
import { createTotpSecret, verifyTotpCode } from './totp';

describe('Admin 2FA TOTP Engine', () => {
  it('generates a valid TOTP secret and uri', () => {
    const { secret, uri } = createTotpSecret('admin@sinet.africa');
    expect(secret).toBeDefined();
    expect(secret.length).toBeGreaterThan(16);
    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain('admin%40sinet.africa');
    expect(uri).toContain('SINet');
  });

  it('verifies a generated TOTP code successfully', () => {
    const { secret } = createTotpSecret('admin@sinet.africa');

    const totp = new OTPAuth.TOTP({
      issuer: 'SINet',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    const currentToken = totp.generate();
    expect(verifyTotpCode(secret, currentToken)).toBe(true);
  });

  it('rejects an incorrect TOTP code', () => {
    const { secret } = createTotpSecret('admin@sinet.africa');
    expect(verifyTotpCode(secret, '000000')).toBe(false);
    expect(verifyTotpCode(secret, '123456')).toBe(false);
  });

  it('handles invalid or empty secrets gracefully', () => {
    expect(verifyTotpCode('', '123456')).toBe(false);
    expect(verifyTotpCode('invalid-base32-!', '123456')).toBe(false);
  });
});
