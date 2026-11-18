/** @jest-environment node */

import { NextRequest } from 'next/server';
import { POST as postVerify2fa } from './auth/verify-2fa/route';
import { POST as postVerifyOtp } from './auth/verify-otp/route';
import { GET as getAuthMe } from './auth/me/route';
import { GET as getVerifyMember } from './verify/[memberId]/route';
import { POST as postJoinApply } from './join/[slug]/apply/route';
import { GET as getAdminAudit } from './admin/audit/route';
import { GET as getAdminApp } from './admin/applications/[id]/route';
import { db } from '@/lib/db';
import * as memberIdModule from '@/lib/members/member-id';
import * as sessionModule from '@/lib/auth/session';
import * as guardsModule from '@/lib/auth/guards';
import * as otpModule from '@/lib/auth/otp';
import * as campaignsModule from '@/lib/applications/campaigns';

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
  isPostgresConfigured: jest.fn().mockReturnValue(true),
  sanitizeDatabaseError: jest.fn().mockReturnValue('connection refused'),
}));

jest.mock('@/lib/db/mongodb', () => ({
  getMongoDb: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/security/rate-limit-unified', () => ({
  enforceRateLimit: jest.fn().mockResolvedValue({ ok: true, headers: {} }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

jest.mock('@/lib/security/public-form', () => ({
  enforcePublicFormGuards: jest.fn().mockResolvedValue(null),
  isHoneypotTriggered: jest.fn().mockReturnValue(false),
}));

const pgConnectionError = new Error(
  'connect ECONNREFUSED 127.0.0.1:5432\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1146:16)'
);

function assertNoInternalLeak(bodyObj: unknown, rawText?: string) {
  const jsonStr = rawText || JSON.stringify(bodyObj);
  expect(jsonStr).not.toContain('ECONNREFUSED');
  expect(jsonStr).not.toContain('127.0.0.1');
  expect(jsonStr).not.toContain('5432');
  expect(jsonStr).not.toContain('connection refused');
  expect(jsonStr).not.toContain('TCPConnectWrap');
  expect(jsonStr).not.toContain('stack');
  expect(jsonStr).not.toContain('"reason"');
}

describe('Zero Internal Error Text Leakage Under Database Failure', () => {
  const uuidId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/verify-2fa leaks no driver/stack details when Postgres throws', async () => {
    jest.spyOn(sessionModule, 'getSession').mockResolvedValue({
      userId: 'user-123',
      email: 'user@example.com',
      roles: ['member'],
      chapterIds: [],
      is2faAuthenticated: false,
      lastActive: Date.now(),
    });

    (db.select as jest.Mock).mockImplementation(() => {
      throw pgConnectionError;
    });

    const req = new NextRequest('http://localhost:3000/api/auth/verify-2fa', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ code: '123456' }),
    });

    const res = await postVerify2fa(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('Authentication service temporarily unavailable. Please retry shortly.');
    assertNoInternalLeak(body);
  });

  it('POST /api/auth/verify-otp leaks no driver/stack details when Postgres throws with unconfirmed status', async () => {
    jest.spyOn(otpModule, 'verifyOtpOrMagicToken').mockResolvedValue({ success: true });

    (db.select as jest.Mock).mockImplementation(() => {
      throw pgConnectionError;
    });

    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({ email: 'user@fulokoja.edu.ng', code: '123456' }),
    });

    const res = await postVerifyOtp(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('Sign-in temporarily unavailable');
    assertNoInternalLeak(body);
  });

  it('GET /api/auth/me leaks no driver/stack details when Postgres throws during profile lookup', async () => {
    jest.spyOn(sessionModule, 'getSession').mockResolvedValue({
      userId: 'user-123',
      email: 'member@fulokoja.edu.ng',
      roles: ['member'],
      chapterIds: [],
      is2faAuthenticated: true,
      lastActive: Date.now(),
    });

    (db.select as jest.Mock).mockImplementation(() => {
      throw pgConnectionError;
    });

    const req = new NextRequest('http://localhost:3000/api/auth/me');
    const res = await getAuthMe(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.degraded).toBe(true);
    assertNoInternalLeak(body);
  });

  it('GET /api/verify/[memberId] leaks no driver/stack details when Postgres throws', async () => {
    jest.spyOn(memberIdModule, 'getVerifiedMemberRecord').mockRejectedValue(pgConnectionError);

    const req = new NextRequest('http://localhost:3000/api/verify/SIN-FULOKOJA-24-0001');
    const res = await getVerifyMember(req, { params: { memberId: 'SIN-FULOKOJA-24-0001' } });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toBe('Verification service temporarily unavailable. Please retry shortly.');
    assertNoInternalLeak(body);
  });

  it('POST /api/join/[slug]/apply leaks no driver/stack details when Postgres throws', async () => {
    const mockPostgresCampaign = {
      campaign: {
        id: 'camp-pg-002',
        slug: 'test-membership',
        name: 'Test Membership (Evergreen)',
        description: 'University campus members',
        targetRole: 'member',
        isAccepting: true,
        status: 'active',
        applicationCount: 10,
      },
      isAccepting: true,
      seatsRemaining: 50,
    };

    jest.spyOn(campaignsModule, 'getCampaignBySlug').mockResolvedValue(mockPostgresCampaign as any);
    jest.spyOn(campaignsModule, 'submitCampaignApplication').mockRejectedValue(pgConnectionError);

    const req = new NextRequest('http://localhost:3000/api/join/test-membership/apply', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Amina Sani',
        email: 'amina.sani@fulokoja.edu.ng',
        phone: '+2348011223344',
        universityId: '550e8400-e29b-41d4-a716-446655440000',
        programme: 'B.Sc Economics',
        level: '300',
        division: 'student_finance',
        contributionPitch: 'I want to build a campus student investment club at FULOKOJA.',
        codeOfConductAccepted: true,
        chapter: 'fulokoja',
      }),
    });

    const res = await postJoinApply(req, { params: { slug: 'test-membership' } });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('We could not save your application. Please try again.');
    assertNoInternalLeak(body);
  });

  it('GET /api/admin/audit leaks no driver/stack details when Postgres throws', async () => {
    jest.spyOn(guardsModule, 'requireAdmin').mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@sinet.africa',
      roles: ['super_admin'],
      chapterIds: [],
      is2faAuthenticated: true,
      lastActive: Date.now(),
    });

    (db.select as jest.Mock).mockImplementation(() => {
      throw pgConnectionError;
    });

    const req = new NextRequest('http://localhost:3000/api/admin/audit');
    const res = await getAdminAudit(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('Institutional audit log is temporarily unavailable. Please retry shortly.');
    assertNoInternalLeak(body);
  });

  it('GET /api/admin/applications/[id] leaks no driver/stack details when Postgres throws', async () => {
    jest.spyOn(guardsModule, 'requireRole').mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@sinet.africa',
      roles: ['super_admin'],
      chapterIds: [],
      is2faAuthenticated: true,
      lastActive: Date.now(),
    });

    (db.select as jest.Mock).mockImplementation(() => {
      throw pgConnectionError;
    });

    const req = new NextRequest(`http://localhost:3000/api/admin/applications/${uuidId}`);
    const res = await getAdminApp(req, { params: { id: uuidId } });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('database_unavailable');
    assertNoInternalLeak(body);
  });
});
