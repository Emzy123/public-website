/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getVerify } from '@/app/api/verify/[memberId]/route';
import MemberVerificationPage, { generateMetadata } from './[memberId]/page';
import * as memberIdModule from '@/lib/members/member-id';
import * as rateLimit from '@/lib/security/rate-limit-unified';
import { HeadersAdapter } from 'next/dist/server/web/spec-extension/adapters/headers';
import { headers } from 'next/headers';

const mockPermanentRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  permanentRedirect: (...args: any[]) => mockPermanentRedirect(...args),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));
jest.mock('@/lib/members/member-id');
jest.mock('@/lib/security/rate-limit-unified', () => {
  const actual = jest.requireActual('@/lib/security/rate-limit-unified');
  return {
    ...actual,
    enforceRateLimit: jest.fn().mockResolvedValue({ ok: true, headers: {} }),
  };
});

describe('GET /api/verify/[memberId] public payload (B2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (headers as jest.Mock).mockReturnValue(
      HeadersAdapter.seal(HeadersAdapter.from({ 'x-real-ip': '127.0.0.1' }))
    );
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
    const res = await getVerify(req, { params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }) });
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
    const res = await getVerify(req, { params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0002' }) });
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
    const res = await getVerify(req, { params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }) });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.error).toBe('Too many verification requests. Please slow down.');
  });

  it('resolves legacy doubled-prefix member ID and verifies successfully', async () => {
    (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue({
      fullMemberId: 'SIN-UEPX3B',
      userId: 'user-legacy',
      fullName: 'Legacy Member',
      campusCode: 'KOGI',
      universityName: 'Federal University Lokoja',
      chapterName: 'Kogi Chapter',
      division: 'student_finance',
      programme: 'Computer Science',
      level: '200',
      status: 'active',
      issuedAt: new Date('2026-01-01'),
    });
    (memberIdModule.verifyMemberSignature as jest.Mock).mockReturnValue(true);

    const req = new NextRequest('http://localhost:3000/api/verify/SIN-SINUEPX3B?sig=legacysig');
    const res = await getVerify(req, { params: Promise.resolve({ memberId: 'SIN-SINUEPX3B' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.valid).toBe(true);
    expect(body.member.memberId).toBe('SIN-UEPX3B');
    expect(body.member.fullName).toBe('Legacy Member');
    expect(body.signatureValid).toBe(true);
  });

  it('resolves lowercase member ID and verifies successfully', async () => {
    (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue({
      fullMemberId: 'SIN-FULOKOJA-24-0001',
      userId: 'user-1',
      fullName: 'Ada Lovelace',
      campusCode: 'FULOKOJA',
      universityName: 'Federal University Lokoja',
      chapterName: 'FULOKOJA Chapter',
      division: 'student_finance',
      programme: 'Economics',
      level: '300',
      status: 'active',
      issuedAt: new Date('2024-01-15'),
    });
    (memberIdModule.verifyMemberSignature as jest.Mock).mockReturnValue(true);

    const req = new NextRequest('http://localhost:3000/api/verify/sin-fulokoja-24-0001?sig=abc');
    const res = await getVerify(req, { params: Promise.resolve({ memberId: 'sin-fulokoja-24-0001' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.valid).toBe(true);
    expect(body.member.memberId).toBe('SIN-FULOKOJA-24-0001');
  });

  it('rejects tampered signature with signatureValid: false', async () => {
    (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue({
      fullMemberId: 'SIN-FULOKOJA-24-0001',
      userId: 'user-1',
      fullName: 'Ada Lovelace',
      campusCode: 'FULOKOJA',
      universityName: 'Federal University Lokoja',
      chapterName: 'FULOKOJA Chapter',
      division: 'student_finance',
      programme: 'Economics',
      level: '300',
      status: 'active',
      issuedAt: new Date('2024-01-15'),
    });
    (memberIdModule.verifyMemberSignature as jest.Mock).mockReturnValue(false);

    const req = new NextRequest('http://localhost:3000/api/verify/SIN-FULOKOJA-24-0001?sig=tampered_signature_hex_value_here');
    const res = await getVerify(req, { params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.signatureValid).toBe(false);
  });

  it('missing signature sets signatureValid to null', async () => {
    (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue({
      fullMemberId: 'SIN-FULOKOJA-24-0001',
      userId: 'user-1',
      fullName: 'Ada Lovelace',
      campusCode: 'FULOKOJA',
      universityName: 'Federal University Lokoja',
      chapterName: 'FULOKOJA Chapter',
      division: 'student_finance',
      programme: 'Economics',
      level: '300',
      status: 'active',
      issuedAt: new Date('2024-01-15'),
    });

    const req = new NextRequest('http://localhost:3000/api/verify/SIN-FULOKOJA-24-0001');
    const res = await getVerify(req, { params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.signatureValid).toBeNull();
  });

  it('returns 404 for unknown Member ID (never 500)', async () => {
    (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/verify/SIN-UNKNOWN-99-9999');
    const res = await getVerify(req, { params: Promise.resolve({ memberId: 'SIN-UNKNOWN-99-9999' }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.valid).toBe(false);
    expect(body.error).toContain('Member ID not found');
  });

  it('renders a friendly user-facing page message when rate limit is exceeded, not a raw error', async () => {
    (rateLimit.enforceRateLimit as jest.Mock).mockResolvedValue({
      ok: false,
      retryAfterSec: 60,
      headers: { 'Retry-After': '60' },
    });

    const jsx = await MemberVerificationPage({
      params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }),
      searchParams: Promise.resolve({}),
    });

    const text = extractText(jsx);
    expect(text).toContain('Too Many Verification Requests');
    expect(text).toContain('Request Limit Exceeded');
    expect(text).toContain('Retry Verification');
    expect(text).not.toContain('ECONNREFUSED');
    expect(text).not.toContain('stack');
  });

  describe('/verify/[memberId] page rendering with Next HeadersAdapter and signature gating (Hotfix)', () => {
    const mockMember = {
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
    };

    it('renders with Next HeadersAdapter with x-real-ip set without throwing', async () => {
      (headers as jest.Mock).mockReturnValue(
        HeadersAdapter.seal(HeadersAdapter.from({ 'x-real-ip': '203.0.113.50' }))
      );
      (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue(mockMember);

      const jsx = await MemberVerificationPage({
        params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }),
        searchParams: Promise.resolve({}),
      });

      expect(jsx).toBeDefined();
      const text = extractText(jsx);
      expect(text).toContain('SIN-FULOKOJA-24-0001');
      expect(text).toContain('Valid');
    });

    it('without sig: shows status and member ID only, omitting name, chapter, institution, programme, and trust seal', async () => {
      (headers as jest.Mock).mockReturnValue(
        HeadersAdapter.seal(HeadersAdapter.from({ 'x-real-ip': '203.0.113.50' }))
      );
      (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue(mockMember);
      (memberIdModule.verifyMemberSignature as jest.Mock).mockReturnValue(false);

      const jsx = await MemberVerificationPage({
        params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }),
        searchParams: Promise.resolve({}),
      });

      const text = extractText(jsx);
      expect(text).toContain('SIN-FULOKOJA-24-0001');
      expect(text).toContain('Valid');
      expect(text).toContain("Status only. Scan the member's QR code for full details.");
      // Initials are allowed in the avatar: "AD"
      expect(text).toContain('AD');
      // Full name, chapter, institution, programme, trust seal MUST NOT appear
      expect(text).not.toContain('Ada Lovelace');
      expect(text).not.toContain('FULOKOJA Chapter');
      expect(text).not.toContain('Federal University Lokoja');
      expect(text).not.toContain('Economics');
      expect(text).not.toContain('Authentic Digital Credential Verified');
    });

    it('with invalid sig: shows status and member ID only, omitting name, chapter, institution, programme, and trust seal', async () => {
      (headers as jest.Mock).mockReturnValue(
        HeadersAdapter.seal(HeadersAdapter.from({ 'x-real-ip': '203.0.113.50' }))
      );
      (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue(mockMember);
      (memberIdModule.verifyMemberSignature as jest.Mock).mockReturnValue(false);

      const jsx = await MemberVerificationPage({
        params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }),
        searchParams: Promise.resolve({ sig: 'invalid_signature_hex' }),
      });

      const text = extractText(jsx);
      expect(text).toContain('SIN-FULOKOJA-24-0001');
      expect(text).toContain('Valid');
      expect(text).toContain("Status only. Scan the member's QR code for full details.");
      expect(text).not.toContain('Ada Lovelace');
      expect(text).not.toContain('FULOKOJA Chapter');
      expect(text).not.toContain('Federal University Lokoja');
      expect(text).not.toContain('Economics');
      expect(text).not.toContain('Authentic Digital Credential Verified');
    });

    it('with valid sig: shows all details (full name, chapter, institution, programme, and trust seal)', async () => {
      (headers as jest.Mock).mockReturnValue(
        HeadersAdapter.seal(HeadersAdapter.from({ 'x-real-ip': '203.0.113.50' }))
      );
      (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue(mockMember);
      (memberIdModule.verifyMemberSignature as jest.Mock).mockReturnValue(true);

      const jsx = await MemberVerificationPage({
        params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }),
        searchParams: Promise.resolve({ sig: 'valid_signature_hex' }),
      });

      const text = extractText(jsx);
      expect(text).toContain('Ada Lovelace');
      expect(text).toContain('FULOKOJA Chapter');
      expect(text).toContain('Federal University Lokoja');
      expect(text).toContain('Economics');
      expect(text).toContain('Authentic Digital Credential Verified');
      expect(text).toContain('SIN-FULOKOJA-24-0001');
      expect(text).toContain('Valid');
      expect(text).not.toContain("Status only. Scan the member's QR code for full details.");
    });

    it('generateMetadata omits fullName when sig is missing or invalid', async () => {
      (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue(mockMember);
      (memberIdModule.verifyMemberSignature as jest.Mock).mockReturnValue(false);

      const metaNoSig = await generateMetadata({
        params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }),
        searchParams: Promise.resolve({}),
      });
      expect(metaNoSig.title).toBe('Credential Verification — SINet');
      expect(metaNoSig.description).not.toContain('Ada Lovelace');
      expect(metaNoSig.description).toContain('SIN-FULOKOJA-24-0001');

      const metaInvalidSig = await generateMetadata({
        params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }),
        searchParams: Promise.resolve({ sig: 'wrong_sig' }),
      });
      expect(metaInvalidSig.title).toBe('Credential Verification — SINet');
      expect(metaInvalidSig.description).not.toContain('Ada Lovelace');
      expect(metaInvalidSig.description).toContain('SIN-FULOKOJA-24-0001');

      (memberIdModule.verifyMemberSignature as jest.Mock).mockReturnValue(true);
      const metaValidSig = await generateMetadata({
        params: Promise.resolve({ memberId: 'SIN-FULOKOJA-24-0001' }),
        searchParams: Promise.resolve({ sig: 'correct_sig' }),
      });
      expect(metaValidSig.title).toContain('Ada Lovelace');
      expect(metaValidSig.description).toContain('Ada Lovelace');
    });

    it('redirects (308) legacy doubled-prefix URL to canonical URL when signature is valid', async () => {
      (headers as jest.Mock).mockReturnValue(
        HeadersAdapter.seal(HeadersAdapter.from({ 'x-real-ip': '203.0.113.50' }))
      );
      (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue({
        ...mockMember,
        fullMemberId: 'SIN-UEPX3B',
      });
      (memberIdModule.verifyMemberSignature as jest.Mock).mockReturnValue(true);

      await MemberVerificationPage({
        params: Promise.resolve({ memberId: 'SIN-SINUEPX3B' }),
        searchParams: Promise.resolve({ sig: 'valid_sig_32_chars_hex_value' }),
      });

      expect(mockPermanentRedirect).toHaveBeenCalledWith(
        '/verify/SIN-UEPX3B?sig=valid_sig_32_chars_hex_value'
      );
    });

    it('returns graceful 200 Member ID Not Found page for unknown ID without throwing 500', async () => {
      (headers as jest.Mock).mockReturnValue(
        HeadersAdapter.seal(HeadersAdapter.from({ 'x-real-ip': '203.0.113.50' }))
      );
      (memberIdModule.getVerifiedMemberRecord as jest.Mock).mockResolvedValue(null);

      const jsx = await MemberVerificationPage({
        params: Promise.resolve({ memberId: 'SIN-TEST' }),
        searchParams: Promise.resolve({}),
      });

      expect(jsx).toBeDefined();
      const text = extractText(jsx);
      expect(text).toContain('Member ID Not Found');
      expect(text).toContain('SIN-TEST');
      expect(text).toContain('Invalid Credential');
    });
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
