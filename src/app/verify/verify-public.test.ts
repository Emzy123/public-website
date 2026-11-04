/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getVerify } from '@/app/api/verify/[memberId]/route';
import * as memberIdModule from '@/lib/members/member-id';
import * as rateLimit from '@/lib/security/rate-limit-unified';

jest.mock('@/lib/members/member-id');
jest.mock('@/lib/security/rate-limit-unified', () => ({
  enforceRateLimit: jest.fn().mockResolvedValue({ ok: true, headers: {} }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

describe('GET /api/verify/[memberId] public payload (B2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit.enforceRateLimit as jest.Mock).mockResolvedValue({ ok: true, headers: {} });
  });

  it('returns name, role, chapter, status only — never email or phone', async () => {
    (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue({
      fullMemberId: 'SIN-FULOKOJA-24-0001',
      userId: 'user-1',
      fullName: 'Ada Lovelace',
      avatarUrl: null,
      campusCode: 'FULOKOJA',
      universityName: 'Federal University Lokoja',
      chapterName: 'FULOKOJA Chapter',
      division: 'student_finance',
      programme: 'Economics',
      level: '300',
      status: 'active',
      issuedAt: new Date('2024-01-15'),
      userEmail: 'ada@example.com',
      userPhone: '+2348012345678',
    });
    (memberIdModule.verifyMemberSignature as jest.Mock).mockReturnValue(true);

    const req = new NextRequest('http://localhost:3000/api/verify/SIN-FULOKOJA-24-0001?sig=abc');
    const res = await getVerify(req, { params: { memberId: 'SIN-FULOKOJA-24-0001' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.valid).toBe(true);
    expect(body.member.fullName).toBe('Ada Lovelace');
    expect(body.member.role).toBe('student_finance');
    expect(body.member.chapterName).toBe('FULOKOJA Chapter');
    expect(body.member.credential).toBe('valid');
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('ada@example.com');
    expect(serialized).not.toContain('+2348012345678');
    expect(serialized).not.toContain('userEmail');
    expect(serialized).not.toContain('userPhone');
    expect(body.member).not.toHaveProperty('email');
    expect(body.member).not.toHaveProperty('phone');
  });

  it('marks suspended members as revoked', async () => {
    (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue({
      fullMemberId: 'SIN-FULOKOJA-24-0002',
      userId: 'user-2',
      fullName: 'Revoked Member',
      campusCode: 'FULOKOJA',
      universityName: 'Federal University Lokoja',
      chapterName: 'FULOKOJA Chapter',
      division: 'student_enterprise',
      programme: null,
      level: null,
      status: 'suspended',
      issuedAt: new Date('2024-01-15'),
    });

    const req = new NextRequest('http://localhost:3000/api/verify/SIN-FULOKOJA-24-0002');
    const res = await getVerify(req, { params: { memberId: 'SIN-FULOKOJA-24-0002' } });
    const body = await res.json();

    expect(body.valid).toBe(false);
    expect(body.revoked).toBe(true);
    expect(body.member.credential).toBe('revoked');
  });

  it('rate-limits verification requests', async () => {
    (rateLimit.enforceRateLimit as jest.Mock).mockResolvedValue({
      ok: false,
      headers: { 'Retry-After': '60' },
    });

    const req = new NextRequest('http://localhost:3000/api/verify/SIN-FULOKOJA-24-0001');
    const res = await getVerify(req, { params: { memberId: 'SIN-FULOKOJA-24-0001' } });
    expect(res.status).toBe(429);
  });
});
