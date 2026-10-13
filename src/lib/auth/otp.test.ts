import { hashToken, generateNumericOtp, generateMagicToken } from './otp';

describe('OTP & Magic Link Cryptographic Utilities', () => {
  it('generates a 6-digit numeric OTP', () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateNumericOtp();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
    }
  });

  it('generates high-entropy magic tokens', () => {
    const token1 = generateMagicToken();
    const token2 = generateMagicToken();
    expect(token1).toHaveLength(64); // 32 bytes hex
    expect(token2).toHaveLength(64);
    expect(token1).not.toEqual(token2);
  });

  it('computes deterministic SHA-256 hashes of tokens', () => {
    const raw = '123456';
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);
    expect(hash1).toEqual(hash2);
    expect(hash1).toHaveLength(64);

    // Trims whitespace before hashing
    const hashWithWhitespace = hashToken('  123456  ');
    expect(hashWithWhitespace).toEqual(hash1);
  });
});
