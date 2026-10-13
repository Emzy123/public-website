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

  it('validates codes generated with legacy issuer (SINet Africa) without enrollment breaking', () => {
    // Generate a fixed base32 secret simulating an enrollment before Phase 2:
    const legacySecret = 'JBSWY3DPEHPK3PXP'; // Base32 encoded secret
    const legacyTotp = new OTPAuth.TOTP({
      issuer: 'SINet Africa', // Old issuer
      label: 'admin@sinet.africa',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(legacySecret),
    });

    const tokenFromOldEnrollment = legacyTotp.generate();
    // Verify using our current verifyTotpCode (which uses issuer: 'SINet')
    expect(verifyTotpCode(legacySecret, tokenFromOldEnrollment)).toBe(true);
  });

  it('handles invalid or empty secrets gracefully', () => {
    expect(verifyTotpCode('', '123456')).toBe(false);
    expect(verifyTotpCode('invalid-base32-!', '123456')).toBe(false);
  });
});
