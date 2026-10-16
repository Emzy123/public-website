/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST } from './route';
import { getAuthFromEmail, CLIENT_AUTH_ERROR_MESSAGE } from '@/lib/auth/otp';
import * as otpModule from '@/lib/auth/otp';
import * as auditModule from '@/lib/audit/log';
import * as guardsModule from '@/lib/auth/guards';
import { GET as healthGet } from '@/app/api/health/route';

jest.mock('@/lib/audit/log', () => ({
  writeAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/auth/guards', () => ({
  writeAdminAudit: jest.fn().mockResolvedValue(undefined),
}));

describe('Auth Request-OTP & Magic Link Provider Error Masking', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      AUTH_FROM_EMAIL: 'SINet <no-reply@sinet.africa>',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('proves raw Resend provider errors on the OTP path never leak to the client', async () => {
    const rawProviderError =
      'Email delivery failed: You can only send testing emails to your own email address (owner@gmail.com). To send to other addresses, add your domain at resend.com/domains';

    jest.spyOn(otpModule, 'createEmailOtp').mockResolvedValue({
      otp: '123456',
      expiresAt: new Date(Date.now() + 600000),
    });
    jest.spyOn(otpModule, 'sendOtpEmail').mockRejectedValue(new Error(rawProviderError));

    const req = new NextRequest('http://localhost:3000/api/auth/request-otp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'visitor@external-domain.com',
        mode: 'otp',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.error).toBe(CLIENT_AUTH_ERROR_MESSAGE);

    // Assert that NO provider internals leak into the client payload
    const stringified = JSON.stringify(body);
    expect(stringified).not.toContain('owner@gmail.com');
    expect(stringified).not.toContain('resend.com');
    expect(stringified).not.toContain('resend');
    expect(stringified).not.toContain('testing emails');

    // Assert that the real error is logged to the audit system as auth.otp_failed with structured reason
    expect(auditModule.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.otp_failed',
        actor: 'visitor@external-domain.com',
        metadata: expect.objectContaining({
          mode: 'otp',
          reason: 'resend_domain_unverified',
          error: rawProviderError,
        }),
      })
    );
    expect(guardsModule.writeAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.otp_failed',
        actorEmail: 'visitor@external-domain.com',
        metadata: expect.objectContaining({
          mode: 'otp',
          reason: 'resend_domain_unverified',
          error: rawProviderError,
        }),
      })
    );
  });

  it('proves raw Resend provider errors on the magic-link path never leak to the client', async () => {
    const rawProviderError =
      'Email delivery failed: You can only send testing emails to your own email address (owner@gmail.com). To send to other addresses, add your domain at resend.com/domains';

    jest.spyOn(otpModule, 'createMagicLink').mockResolvedValue({
      token: 'tok-12345',
      url: 'http://localhost:3000/api/auth/verify-magic?token=tok-12345',
      expiresAt: new Date(Date.now() + 600000),
    });
    jest.spyOn(otpModule, 'sendMagicLinkEmail').mockRejectedValue(new Error(rawProviderError));

    const req = new NextRequest('http://localhost:3000/api/auth/request-otp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'prospective-student@external-domain.com',
        mode: 'magic_link',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.error).toBe(CLIENT_AUTH_ERROR_MESSAGE);

    // Assert that NO provider internals leak into the client payload
    const stringified = JSON.stringify(body);
    expect(stringified).not.toContain('owner@gmail.com');
    expect(stringified).not.toContain('resend.com');
    expect(stringified).not.toContain('resend');
    expect(stringified).not.toContain('testing emails');

    // Assert that the real error is logged to the audit system as auth.otp_failed with structured reason
    expect(auditModule.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.otp_failed',
        actor: 'prospective-student@external-domain.com',
        metadata: expect.objectContaining({
          mode: 'magic_link',
          reason: 'resend_domain_unverified',
          error: rawProviderError,
        }),
      })
    );
  });

  it('getAuthFromEmail fails loudly when AUTH_FROM_EMAIL is missing', () => {
    delete process.env.AUTH_FROM_EMAIL;
    expect(() => getAuthFromEmail()).toThrow(
      /AUTH_FROM_EMAIL environment variable is missing/i
    );
  });

  it('getAuthFromEmail returns configured sender when AUTH_FROM_EMAIL is set', () => {
    process.env.AUTH_FROM_EMAIL = 'SINet <no-reply@sinet.africa>';
    expect(getAuthFromEmail()).toBe('SINet <no-reply@sinet.africa>');
  });

  it('health check fails loudly (503 error) when RESEND_API_KEY is present but AUTH_FROM_EMAIL is missing', async () => {
    process.env.HEALTH_CHECK_TOKEN = 'test-health-token';
    process.env.RESEND_API_KEY = 're_test_key_123';
    delete process.env.AUTH_FROM_EMAIL;

    const req = new NextRequest('http://localhost:3000/api/health', {
      headers: {
        'x-health-token': 'test-health-token',
      },
    });

    const res = await healthGet(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe('unhealthy');
    expect(body.checks.email).toBe('error');
    expect(body.checks.authOtp.status).toBe('error');
    expect(body.checks.authOtp.authFromEmail).toBe('missing');
  });

  it('unauthenticated health check returns 503 (status only, no details) when email is enabled but AUTH_FROM_EMAIL is missing', async () => {
    process.env.RESEND_API_KEY = 're_test_key_123';
    delete process.env.AUTH_FROM_EMAIL;

    const req = new NextRequest('http://localhost:3000/api/health');

    const res = await healthGet(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe('unhealthy');
    // Ensure no internal details/checks are leaked to unauthenticated callers
    expect(body.checks).toBeUndefined();
  });

  it('classifyAuthError correctly maps error strings to structured reasons', () => {
    expect(
      otpModule.classifyAuthError(new Error('AUTH_FROM_EMAIL environment variable is missing')).reason
    ).toBe('auth_from_email_missing');

    expect(
      otpModule.classifyAuthError(
        new Error('Email delivery failed: The domain sinet.africa is not verified. Please verify at resend.com/domains')
      ).reason
    ).toBe('resend_domain_unverified');

    expect(
      otpModule.classifyAuthError(
        new Error('You can only send testing emails to your own email address. Add your domain at resend.com/domains')
      ).reason
    ).toBe('resend_domain_unverified');

    expect(
      otpModule.classifyAuthError(new Error('resend_api_key is invalid')).reason
    ).toBe('resend_api_key_missing');

    expect(
      otpModule.classifyAuthError(new Error('Database unavailable to store verification token')).reason
    ).toBe('database_unavailable');
  });

  it('shows structured OTP failure reason in /api/health for authorized admins only', async () => {
    process.env.HEALTH_CHECK_TOKEN = 'test-health-token';
    process.env.RESEND_API_KEY = 're_live_key';
    process.env.AUTH_FROM_EMAIL = 'SINet <no-reply@sinet.africa>';

    // Simulate OTP failure due to unverified domain
    const unverifiedError = 'Email delivery failed: The domain sinet.africa is not verified at resend.com/domains';
    jest.spyOn(otpModule, 'createEmailOtp').mockResolvedValue({
      otp: '654321',
      expiresAt: new Date(Date.now() + 600000),
    });
    jest.spyOn(otpModule, 'sendOtpEmail').mockRejectedValue(new Error(unverifiedError));

    const otpReq = new NextRequest('http://localhost:3000/api/auth/request-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
      body: JSON.stringify({ email: 'admin@sinet.africa', mode: 'otp' }),
    });
    const otpRes = await POST(otpReq);
    expect(otpRes.status).toBe(503);

    // 1. Authorized admin health check shows structured reason
    const authHealthReq = new NextRequest('http://localhost:3000/api/health', {
      headers: { 'x-health-token': 'test-health-token' },
    });
    const authHealthRes = await healthGet(authHealthReq);
    expect(authHealthRes.status).toBe(200);

    const authHealthBody = await authHealthRes.json();
    expect(authHealthBody.checks.authOtp).toBeDefined();
    expect(authHealthBody.checks.authOtp.lastFailure).toEqual(
      expect.objectContaining({
        reason: 'resend_domain_unverified',
        message: expect.stringContaining('sinet.africa domain is not verified'),
      })
    );

    // 2. Unauthenticated caller never sees authOtp or lastFailure
    const unauthHealthReq = new NextRequest('http://localhost:3000/api/health');
    const unauthHealthRes = await healthGet(unauthHealthReq);
    expect(unauthHealthRes.status).toBe(200);

    const unauthHealthBody = await unauthHealthRes.json();
    expect(unauthHealthBody.checks).toBeUndefined();
    expect(JSON.stringify(unauthHealthBody)).not.toContain('resend_domain_unverified');
    expect(JSON.stringify(unauthHealthBody)).not.toContain('lastFailure');
  });
});
