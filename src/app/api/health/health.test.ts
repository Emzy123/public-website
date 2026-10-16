/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from './route';
import { recordAuthFailure, resetLastAuthFailure } from '@/lib/auth/otp';
import { createSession } from '@admin/lib/auth';
import { SignJWT } from 'jose';
import { getAdminSessionSecret } from '@/lib/runtime/secrets';

describe('GET /api/health Endpoint Scoping & Auth Diagnostics', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetLastAuthFailure();
    process.env = {
      ...originalEnv,
      ADMIN_EMAIL: 'admin@sinet.africa',
      HEALTH_CHECK_TOKEN: 'health-secret-token-xyz',
      ADMIN_SESSION_SECRET: 'test_admin_session_secret_32_characters_long_min',
      AUTH_FROM_EMAIL: 'SINet <no-reply@sinet.africa>',
      RESEND_API_KEY: 're_test_key_12345',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('unauthenticated health check returns minimal status without leaking dependency details', async () => {
    const req = new NextRequest('http://localhost:3000/api/health');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('healthy');
    expect(body.checks).toBeUndefined();
    expect(body.timestamp).toBeUndefined();
  });

  it('ignores ?token= in query string to prevent token leakage in access logs', async () => {
    const req = new NextRequest('http://localhost:3000/api/health?token=health-secret-token-xyz');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    // Must be treated as unauthenticated
    expect(body.checks).toBeUndefined();
  });

  it('authorized admin via x-health-token header receives complete dependency and auth diagnostics', async () => {
    const req = new NextRequest('http://localhost:3000/api/health', {
      headers: { 'x-health-token': 'health-secret-token-xyz' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(body.checks).toBeDefined();
    expect(body.checks.authOtp).toBeDefined();
    expect(body.checks.authOtp.authFromEmail).toBe('configured');
    expect(body.checks.authOtp.senderDomain).toBe('sinet.africa');
    expect(body.checks.authOtp.resendApiKey).toBe('configured');
  });

  it('authorized admin via live, non-expired sinet_admin_session cookie receives complete diagnostics', async () => {
    const adminToken = await createSession('admin@sinet.africa');

    const req = new NextRequest('http://localhost:3000/api/health', {
      headers: {
        cookie: `sinet_admin_session=${adminToken}`,
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks).toBeDefined();
    expect(body.checks.authOtp).toBeDefined();
    expect(body.checks.authOtp.senderDomain).toBe('sinet.africa');
  });

  it('rejects forged sinet_admin_session cookie (invalid signature)', async () => {
    const req = new NextRequest('http://localhost:3000/api/health', {
      headers: {
        cookie: 'sinet_admin_session=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQHNpbmV0LmFmcmljYSJ9.invalidSignature',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks).toBeUndefined();
  });

  it('rejects expired sinet_admin_session cookie', async () => {
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 30; // 30 seconds ago
    const expiredToken = await new SignJWT({
      email: 'admin@sinet.africa',
      lastActivity: expiredTimestamp,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(expiredTimestamp - 3600)
      .setIssuer('sinet-admin')
      .setAudience('sinet-admin')
      .setExpirationTime(expiredTimestamp)
      .sign(getAdminSessionSecret());

    const req = new NextRequest('http://localhost:3000/api/health', {
      headers: {
        cookie: `sinet_admin_session=${expiredToken}`,
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks).toBeUndefined();
  });

  it('rejects session cookie for non-admin user email', async () => {
    const nonAdminToken = await createSession('hacker@unauthorized-domain.com');

    const req = new NextRequest('http://localhost:3000/api/health', {
      headers: {
        cookie: `sinet_admin_session=${nonAdminToken}`,
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks).toBeUndefined();
  });

  it('exposes structured OTP failure reason to authorized admin', async () => {
    recordAuthFailure({
      reason: 'resend_domain_unverified',
      message: 'Resend domain unverified: sinet.africa domain is not verified in Resend dashboard.',
      error: 'Email delivery failed: The domain sinet.africa is not verified.',
      emailDomain: 'sinet.africa',
      mode: 'otp',
      timestamp: new Date().toISOString(),
    });

    const req = new NextRequest('http://localhost:3000/api/health', {
      headers: { 'x-health-token': 'health-secret-token-xyz' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks.authOtp.lastFailure).toEqual(
      expect.objectContaining({
        reason: 'resend_domain_unverified',
        message: expect.stringContaining('sinet.africa domain is not verified'),
      })
    );
  });

  it('reports error when AUTH_FROM_EMAIL is missing', async () => {
    delete process.env.AUTH_FROM_EMAIL;

    // Admin request gets full diagnostic error
    const adminReq = new NextRequest('http://localhost:3000/api/health', {
      headers: { 'x-health-token': 'health-secret-token-xyz' },
    });
    const adminRes = await GET(adminReq);
    expect(adminRes.status).toBe(503);
    const adminBody = await adminRes.json();
    expect(adminBody.status).toBe('unhealthy');
    expect(adminBody.checks.authOtp.status).toBe('error');
    expect(adminBody.checks.authOtp.authFromEmail).toBe('missing');

    // Public request gets minimal 503 without details
    const publicReq = new NextRequest('http://localhost:3000/api/health');
    const publicRes = await GET(publicReq);
    expect(publicRes.status).toBe(503);
    const publicBody = await publicRes.json();
    expect(publicBody.status).toBe('unhealthy');
    expect(publicBody.checks).toBeUndefined();
  });
});
