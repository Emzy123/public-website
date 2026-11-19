/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getVerify } from '@/app/api/verify/[memberId]/route';
import MemberVerificationPage from './[memberId]/page';
import * as memberIdModule from '@/lib/members/member-id';
import * as rateLimit from '@/lib/security/rate-limit-unified';

jest.mock('next/headers', () => ({
  headers: jest.fn().mockReturnValue(new Headers({ 'x-real-ip': '127.0.0.1' })),
}));
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

  it('rate-limits verification requests and fails closed (429) with friendly message', async () => {
    (rateLimit.enforceRateLimit as jest.Mock).mockResolvedValue({
      ok: false,
      retryAfterSec: 60,
      headers: { 'Retry-After': '60' },
    });

    const req = new NextRequest('http://localhost:3000/api/verify/SIN-FULOKOJA-24-0001');
    const res = await getVerify(req, { params: { memberId: 'SIN-FULOKOJA-24-0001' } });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toBe('Too many verification requests. Please slow down.');
  });

  it('renders a friendly user-facing page message when rate limit is exceeded, not a raw error', async () => {
    (rateLimit.enforceRateLimit as jest.Mock).mockResolvedValue({
      ok: false,
      retryAfterSec: 60,
      headers: { 'Retry-After': '60' },
    });

    const jsx = await MemberVerificationPage({
      params: { memberId: 'SIN-FULOKOJA-24-0001' },
      searchParams: {},
    });

    const text = extractText(jsx);
    expect(text).toContain('Too Many Verification Requests');
    expect(text).toContain('Request Limit Exceeded');
    expect(text).toContain('Retry Verification');
    expect(text).not.toContain('ECONNREFUSED');
    expect(text).not.toContain('stack');
  });
});

function extractText(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (!node || typeof node !== 'object') return '';
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  const props = (node as { props?: Record<string, unknown> }).props;
  if (!props) return '';
  return extractText(props.children);
}
