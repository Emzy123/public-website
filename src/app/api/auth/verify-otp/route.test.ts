/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from './route';
import * as otpModule from '@/lib/auth/otp';
import { db } from '@/lib/db';
import { getMongoDb } from '@/lib/db/mongodb';
import { verifySessionToken, MEMBER_SESSION_COOKIE } from '@/lib/auth/session';

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
  isPostgresConfigured: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/db/mongodb', () => ({
  getMongoDb: jest.fn(),
}));

jest.mock('@/lib/security/rate-limit-unified', () => ({
  enforceRateLimit: jest.fn().mockResolvedValue({ ok: true, headers: {} }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

describe('POST /api/auth/verify-otp fallback security', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      ADMIN_EMAIL: 'admin@sinet.africa',
      ADMIN_SESSION_SECRET: 'test-admin-session-secret-32-chars-minimum!',
    };

    // OTP verification succeeds
    jest.spyOn(otpModule, 'verifyOtpOrMagicToken').mockResolvedValue({ success: true });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('fails closed with 503 when Postgres is down and user has 2FA enabled', async () => {
    // Postgres is down
    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    // Mongo has member with 2FA enabled
    const mockFindOne = jest.fn().mockResolvedValue({
      _id: 'mongo-user-1',
      email: 'user-with-2fa@example.com',
      fullName: 'User With 2FA',
      totpEnabled: true,
      status: 'active',
    });
    (getMongoDb as jest.Mock).mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne: mockFindOne,
        updateOne: jest.fn().mockResolvedValue({}),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'user-with-2fa@example.com',
        code: '123456',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('Sign-in temporarily unavailable');
    // Ensure no session cookie was set
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeNull();
  });

  it('fails closed with 503 when Postgres is down and 2FA status cannot be determined', async () => {
    // Postgres is down
    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    // Mongo has member without explicit 2FA status (totpEnabled undefined)
    const mockFindOne = jest.fn().mockResolvedValue({
      _id: 'mongo-user-2',
      email: 'user-unknown-2fa@example.com',
      fullName: 'User Unknown 2FA',
      status: 'active',
    });
    (getMongoDb as jest.Mock).mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne: mockFindOne,
        updateOne: jest.fn().mockResolvedValue({}),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'user-unknown-2fa@example.com',
        code: '123456',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toContain('Sign-in temporarily unavailable');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('allows sign-in when Postgres is down and user is known NOT to have 2FA', async () => {
    // Postgres is down
    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    // Mongo has member explicitly known NOT to have 2FA
    const mockFindOne = jest.fn().mockResolvedValue({
      _id: 'mongo-user-3',
      email: 'user-no-2fa@example.com',
      fullName: 'User No 2FA',
      totpEnabled: false,
      status: 'active',
    });
    (getMongoDb as jest.Mock).mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne: mockFindOne,
        updateOne: jest.fn().mockResolvedValue({}),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'user-no-2fa@example.com',
        code: '123456',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(res.cookies.get(MEMBER_SESSION_COOKIE)?.value).toBeTruthy();
  });

  it('ensures fallback JWT defaults to member role and NEVER carries admin role even for ADMIN_EMAIL', async () => {
    // Postgres is down
    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    // Known not to have 2FA in Mongo, but email matches ADMIN_EMAIL
    const mockFindOne = jest.fn().mockResolvedValue({
      _id: 'mongo-admin-user',
      email: 'admin@sinet.africa',
      fullName: 'Admin User',
      totpEnabled: false,
      status: 'active',
      role: 'super_admin',
    });
    (getMongoDb as jest.Mock).mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne: mockFindOne,
        updateOne: jest.fn().mockResolvedValue({}),
      }),
    });

    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'admin@sinet.africa',
        code: '123456',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Response roles must not have super_admin
    expect(body.user.roles).toEqual(['member']);

    // Check JWT payload via cookies API
    const cookie = res.cookies.get(MEMBER_SESSION_COOKIE);
    expect(cookie?.value).toBeTruthy();
    const session = await verifySessionToken(cookie!.value);
    expect(session).not.toBeNull();
    expect(session?.roles).toEqual(['member']);
    expect(session?.roles).not.toContain('super_admin');
    expect(session?.roles).not.toContain('admin');
  });
});
