/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from './route';
import { db } from '@/lib/db';
import * as sessionModule from '@/lib/auth/session';
import * as totpModule from '@/lib/auth/totp';

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
  },
  sanitizeDatabaseError: jest.fn().mockReturnValue('connection refused'),
}));

jest.mock('@/lib/security/origin', () => ({
  validateOrigin: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/security/rate-limit-unified', () => ({
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
  enforceRateLimit: jest.fn().mockResolvedValue({ ok: true, headers: {} }),
}));

jest.mock('@/lib/auth/guards', () => ({
  writeAdminAudit: jest.fn().mockResolvedValue(undefined),
}));

describe('POST /api/auth/verify-2fa fail-closed', () => {
  const originalTotp = process.env.ADMIN_TOTP_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_TOTP_SECRET = 'ADMINFALLBACKSECRET';
    jest.spyOn(sessionModule, 'getSession').mockResolvedValue({
      userId: 'user-1',
      email: 'member@sinet.africa',
      roles: ['member'],
      chapterIds: [],
      is2faAuthenticated: false,
      lastActive: Date.now(),
    });
  });

  afterAll(() => {
    process.env.ADMIN_TOTP_SECRET = originalTotp;
  });

  function request() {
    return new NextRequest('http://localhost:3000/api/auth/verify-2fa', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ code: '123456' }),
    });
  }

  function mockUser(row: Record<string, unknown> | undefined) {
    const limit = jest.fn().mockResolvedValue(row ? [row] : []);
    const where = jest.fn().mockReturnValue({ limit });
    const from = jest.fn().mockReturnValue({ where });
    (db.select as jest.Mock).mockReturnValue({ from });
  }

  it('denies when 2FA is enabled but totpSecret is missing, and never uses ADMIN_TOTP_SECRET', async () => {
    mockUser({ id: 'user-1', totpEnabled: true, totpSecret: null });
    const verifySpy = jest.spyOn(totpModule, 'verifyTotpCode');

    const res = await POST(request());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/not fully configured/i);
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it('verifies only the member totpSecret when present', async () => {
    mockUser({ id: 'user-1', totpEnabled: true, totpSecret: 'MEMBERSECRET' });
    jest.spyOn(totpModule, 'verifyTotpCode').mockReturnValue(true);
    jest.spyOn(sessionModule, 'createSessionToken').mockResolvedValue('elevated');
    jest.spyOn(sessionModule, 'setSessionCookie').mockImplementation(() => undefined);

    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(totpModule.verifyTotpCode).toHaveBeenCalledWith('MEMBERSECRET', '123456');
    expect(totpModule.verifyTotpCode).not.toHaveBeenCalledWith('ADMINFALLBACKSECRET', expect.anything());
  });
});
