import {
  hashToken,
  generateNumericOtp,
  generateMagicToken,
  sendOtpEmail,
  sendMagicLinkEmail,
  mayLogAuthCodes,
} from './otp';

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

describe('auth email delivery', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('refuses placeholder Resend keys outside development', async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      AUTH_FROM_EMAIL: 'SINet <no-reply@sinet.africa>',
      RESEND_API_KEY: 're_placeholder_do_not_use',
    };

    await expect(sendOtpEmail('member@sinet.africa', '123456')).rejects.toThrow(
      /RESEND_API_KEY is missing or invalid/
    );
    await expect(
      sendMagicLinkEmail('member@sinet.africa', 'https://sinet.africa/api/auth/verify-magic')
    ).rejects.toThrow(/RESEND_API_KEY is missing or invalid/);
  });

  it('logs OTP codes only when NODE_ENV is development and DEV_LOG_OTP=1', async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      DEV_LOG_OTP: '1',
      AUTH_FROM_EMAIL: 'SINet <no-reply@sinet.africa>',
      RESEND_API_KEY: 're_placeholder',
    };
    expect(mayLogAuthCodes()).toBe(true);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    await sendOtpEmail('member@sinet.africa', '654321');
    expect(spy.mock.calls.some((call) => String(call[0]).includes('654321'))).toBe(true);
    spy.mockRestore();
  });

  it('does not log OTP codes when DEV_LOG_OTP is unset', async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      AUTH_FROM_EMAIL: 'SINet <no-reply@sinet.africa>',
      RESEND_API_KEY: 're_placeholder',
    };
    delete process.env.DEV_LOG_OTP;
    expect(mayLogAuthCodes()).toBe(false);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    await sendOtpEmail('member@sinet.africa', '654321');
    expect(spy.mock.calls.some((call) => String(call[0]).includes('654321'))).toBe(false);
    spy.mockRestore();
  });

  it('never logs OTP or magic link when NODE_ENV is production, even if DEV_LOG_OTP=1', async () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      DEV_LOG_OTP: '1',
      AUTH_FROM_EMAIL: 'SINet <no-reply@sinet.africa>',
    };
    expect(mayLogAuthCodes()).toBe(false);
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(sendOtpEmail('member@sinet.africa', '999888')).rejects.toThrow();
    await expect(
      sendMagicLinkEmail('member@sinet.africa', 'https://sinet.africa/api/auth/verify-magic?token=secret123')
    ).rejects.toThrow();

    const allCalls = [
      ...logSpy.mock.calls,
      ...infoSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls,
    ].map((c) => String(c[0]));

    expect(allCalls.some((c) => c.includes('999888'))).toBe(false);
    expect(allCalls.some((c) => c.includes('secret123'))).toBe(false);

    logSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
