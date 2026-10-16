/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET } from './route';
import { recordAuthFailure, resetLastAuthFailure } from '@/lib/auth/otp';
import { createSession } from '@admin/lib/auth';

describe('GET /api/health Endpoint Scoping & Auth Diagnostics', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetLastAuthFailure();
    process.env = {
      ...originalEnv,
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

  it('authorized admin via HEALTH_CHECK_TOKEN receives complete dependency and auth diagnostics', async () => {
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

  it('authorized admin via sinet_admin_session cookie receives complete diagnostics', async () => {
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

  it('exposes structured OTP failure reason to authorized admin', async () => {
    recordAuthFailure({
      reason: 'resend_domain_unverified',
      message: 'Resend domain unverified: sinet.africa domain is not verified in Resend dashboard.',
      error: 'Email delivery failed: The domain sinet.africa is not verified.',
      emailDomain: 'sinet.africa',
      mode: 'otp',
      timestamp: new Date().toISOString(),
    });

    const req = new NextRequest('http://localhost:3000/api/health?token=health-secret-token-xyz');
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
