/** @jest-environment node */

import { NextRequest } from 'next/server';
import { GET as getVerifyMember } from './verify/[memberId]/route';
import { POST as postVerify2fa } from './auth/verify-2fa/route';
import { GET as getAdminAudit } from './admin/audit/route';
import { GET as getUniversities } from './universities/route';
import { db } from '@/lib/db';
import * as memberIdModule from '@/lib/members/member-id';
import * as sessionModule from '@/lib/auth/session';
import * as guardsModule from '@/lib/auth/guards';

jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
  },
  sanitizeDatabaseError: jest.fn().mockReturnValue('connection refused'),
}));

describe('P1 Availability - 503 Handling on Postgres Down', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/verify/[memberId] returns 503 instead of 500 when database throws', async () => {
    jest.spyOn(memberIdModule, 'getVerifiedMemberRecord').mockRejectedValue(
      new Error('connect ECONNREFUSED 127.0.0.1:5432')
    );

    const req = new NextRequest('http://localhost:3000/api/verify/SIN-FULOKOJA-24-0001');
    const res = await getVerifyMember(req, { params: { memberId: 'SIN-FULOKOJA-24-0001' } });

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.valid).toBe(false);
  });

  it('POST /api/auth/verify-2fa returns 503 instead of unhandled 500 when database throws', async () => {
    jest.spyOn(sessionModule, 'getSession').mockResolvedValue({
      userId: 'user-123',
      email: 'user@example.com',
      roles: ['member'],
      chapterIds: [],
      is2faAuthenticated: false,
      lastActive: Date.now(),
    });

    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
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
  });

  it('GET /api/admin/audit returns 503 instead of 500 when database throws', async () => {
    jest.spyOn(guardsModule, 'requireAdmin').mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@sinet.africa',
      roles: ['super_admin'],
      chapterIds: [],
      is2faAuthenticated: true,
      lastActive: Date.now(),
    });

    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    const req = new NextRequest('http://localhost:3000/api/admin/audit');
    const res = await getAdminAudit(req);

    expect(res.status).toBe(503);
  });

  it('GET /api/universities returns built-in catalog instead of 500 when database throws', async () => {
    (db.select as jest.Mock).mockImplementation(() => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
    });

    const res = await getUniversities();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.universities.length).toBeGreaterThan(0);
  });
});
