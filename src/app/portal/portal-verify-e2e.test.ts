/**
 * @jest-environment node
 *
 * End-to-end integration tests: PortalPage -> signed verification URL -> /verify page & /api/verify route.
 * ZERO test signing helpers: every verification link is generated solely by rendering PortalPage().
 */
import { NextRequest } from 'next/server';
import { renderToStaticMarkup } from 'react-dom/server';
import { headers } from 'next/headers';
import { HeadersAdapter } from 'next/dist/server/web/spec-extension/adapters/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, memberProfiles, memberIds, chapters } from '@/lib/db/schema';
import { mintMemberId } from '@/lib/members/member-id';
import * as sessionModule from '@/lib/auth/session';
import * as rateLimitModule from '@/lib/security/rate-limit-unified';
import PortalPage from './page';
import { GET as getVerifyApi } from '@/app/api/verify/[memberId]/route';
import MemberVerificationPage from '@/app/verify/[memberId]/page';

const mockPermanentRedirect = jest.fn((url: string) => {
  const err = new Error(`NEXT_REDIRECT:${url}`) as Error & { redirectTo: string };
  err.redirectTo = url;
  throw err;
});

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  permanentRedirect: (url: string) => mockPermanentRedirect(url),
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('@/lib/security/rate-limit-unified', () => {
  const actual = jest.requireActual('@/lib/security/rate-limit-unified');
  return {
    ...actual,
    enforceRateLimit: jest.fn().mockResolvedValue({ ok: true, headers: {} }),
  };
});

const isPostgresUp = process.env.POSTGRES_TEST_DB_AVAILABLE !== '0';

function extractVerifyLinkFromHtml(html: string): string | null {
  const match = html.match(/href="(\/verify\/[^"]+)"/);
  return match ? match[1].replace(/&amp;/g, '&') : null;
}

function parseVerifyHref(href: string): { rawMemberId: string; sig: string } {
  const parsed = new URL(`http://localhost:3000${href}`);
  const rawMemberId = decodeURIComponent(parsed.pathname.replace(/^\/verify\//, ''));
  const sig = parsed.searchParams.get('sig') || '';
  return { rawMemberId, sig };
}

(isPostgresUp ? describe : describe.skip)(
  'Portal -> Verify end-to-end flow (single source of truth, no test signing helper)',
  () => {
    const createdUserIds: string[] = [];
    let chapterId: string | null = null;
    let unknownApiBody = '';

    beforeAll(async () => {
      const [chap] = await db.select({ id: chapters.id }).from(chapters).limit(1);
      chapterId = chap?.id || null;

      (headers as jest.Mock).mockReturnValue(
        HeadersAdapter.seal(HeadersAdapter.from({ 'x-real-ip': '203.0.113.42' }))
      );
      (rateLimitModule.enforceRateLimit as jest.Mock).mockResolvedValue({ ok: true, headers: {} });

      // Unknown ID 404 baseline
      const unknownRes = await getVerifyApi(
        new NextRequest('http://localhost:3000/api/verify/SIN-E2E-UNKNOWN99'),
        { params: Promise.resolve({ memberId: 'SIN-E2E-UNKNOWN99' }) }
      );
      expect(unknownRes.status).toBe(404);
      unknownApiBody = await unknownRes.text();
    });

    afterEach(() => {
      mockPermanentRedirect.mockClear();
    });

    afterAll(async () => {
      for (const uid of createdUserIds) {
        await db.delete(memberIds).where(eq(memberIds.userId, uid));
        await db.delete(memberProfiles).where(eq(memberProfiles.userId, uid));
        await db.delete(users).where(eq(users.id, uid));
      }
    });

    it('(a) minted active member: Portal link verifies on both /api/verify and /verify page', async () => {
      const tag = Date.now().toString(36).toUpperCase().slice(-5);
      const email = `e2e-minted-${Date.now()}@uni.edu.ng`;
      const [user] = await db
        .insert(users)
        .values({ email, phone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}` })
        .returning();
      createdUserIds.push(user.id);

      await db.insert(memberProfiles).values({
        userId: user.id,
        chapterId,
        fullName: 'Minted E2E Member',
        division: 'student_finance',
        status: 'active',
        referralCode: `SINM${tag}`,
        profileCompletenessPct: 90,
      });

      const minted = await mintMemberId({
        userId: user.id,
        campusCode: `E2E${tag.slice(0, 3)}`,
      });

      jest.spyOn(sessionModule, 'getSession').mockResolvedValueOnce({
        userId: user.id,
        email,
        roles: ['member'],
        chapterIds: [],
        is2faAuthenticated: true,
        lastActive: Math.floor(Date.now() / 1000),
      });

      const portalJsx = await PortalPage();
      const portalHtml = renderToStaticMarkup(portalJsx);
      expect(portalHtml).toContain(`alt="QR Code for ${minted.memberId}"`);

      const href = extractVerifyLinkFromHtml(portalHtml);
      expect(href).not.toBeNull();
      const { rawMemberId, sig } = parseVerifyHref(href!);
      expect(rawMemberId).toBe(minted.memberId);

      // Feed Portal-generated URL into API
      const apiRes = await getVerifyApi(
        new NextRequest(`http://localhost:3000${href}`),
        { params: Promise.resolve({ memberId: rawMemberId }) }
      );
      expect(apiRes.status).toBe(200);
      const apiBody = await apiRes.json();
      expect(apiBody.valid).toBe(true);
      expect(apiBody.signatureValid).toBe(true);
      expect(apiBody.member.fullName).toBe('Minted E2E Member');
      expect(apiBody.member.memberId).toBe(minted.memberId);

      // Feed Portal-generated URL into /verify page
      const pageJsx = await MemberVerificationPage({
        params: Promise.resolve({ memberId: rawMemberId }),
        searchParams: Promise.resolve({ sig }),
      });
      const pageHtml = renderToStaticMarkup(pageJsx);
      expect(pageHtml).toContain('Minted E2E Member');
      expect(pageHtml).toContain('Authentic Digital Credential Verified');
    });

    it('(b) unminted active member (referral-derived e.g. SIN0LH73M): Portal link verifies on both /api/verify and /verify page, while unsigned/tampered match unknown 404', async () => {
      const tag = `0L${Math.floor(1000 + Math.random() * 8999).toString().slice(0, 4)}`;
      const referralCode = `SIN${tag}`; // e.g. SIN0L1234
      const expectedCanonicalId = `SIN-${tag}`;
      const email = `e2e-ref-${Date.now()}@uni.edu.ng`;

      const [user] = await db
        .insert(users)
        .values({ email, phone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}` })
        .returning();
      createdUserIds.push(user.id);

      // Backdate created_at by 1 hour so render-time new Date() could never accidentally pass!
      const backdatedCreatedAt = new Date(Date.now() - 3600 * 1000);
      await db.insert(memberProfiles).values({
        userId: user.id,
        chapterId,
        fullName: 'Referral Derived E2E',
        division: 'student_enterprise',
        status: 'active',
        referralCode,
        createdAt: backdatedCreatedAt,
        profileCompletenessPct: 75,
      });

      jest.spyOn(sessionModule, 'getSession').mockResolvedValueOnce({
        userId: user.id,
        email,
        roles: ['member'],
        chapterIds: [],
        is2faAuthenticated: true,
        lastActive: Math.floor(Date.now() / 1000),
      });

      const portalJsx = await PortalPage();
      const portalHtml = renderToStaticMarkup(portalJsx);
      expect(portalHtml).toContain('Verify Online');
      expect(portalHtml).toContain(`alt="QR Code for ${expectedCanonicalId}"`);

      const href = extractVerifyLinkFromHtml(portalHtml);
      expect(href).not.toBeNull();
      const { rawMemberId, sig } = parseVerifyHref(href!);
      expect(rawMemberId).toBe(expectedCanonicalId);

      // Signed Portal URL -> API returns 200 valid
      const apiRes = await getVerifyApi(
        new NextRequest(`http://localhost:3000${href}`),
        { params: Promise.resolve({ memberId: rawMemberId }) }
      );
      expect(apiRes.status).toBe(200);
      const apiBody = await apiRes.json();
      expect(apiBody.valid).toBe(true);
      expect(apiBody.signatureValid).toBe(true);
      expect(apiBody.member.fullName).toBe('Referral Derived E2E');
      expect(apiBody.member.memberId).toBe(expectedCanonicalId);

      // Signed Portal URL -> Page verifies
      const pageJsx = await MemberVerificationPage({
        params: Promise.resolve({ memberId: rawMemberId }),
        searchParams: Promise.resolve({ sig }),
      });
      const pageHtml = renderToStaticMarkup(pageJsx);
      expect(pageHtml).toContain('Referral Derived E2E');
      expect(pageHtml).toContain('Authentic Digital Credential Verified');

      // Oracle invariants preserved: unsigned and tampered remain byte-identical 404
      const unsignedRes = await getVerifyApi(
        new NextRequest(`http://localhost:3000/api/verify/${rawMemberId}`),
        { params: Promise.resolve({ memberId: rawMemberId }) }
      );
      expect(unsignedRes.status).toBe(404);
      expect(await unsignedRes.text()).toBe(unknownApiBody);

      const tamperedSig = sig.slice(0, 31) + (sig[31] === 'a' ? 'b' : 'a');
      const tamperedRes = await getVerifyApi(
        new NextRequest(`http://localhost:3000/api/verify/${rawMemberId}?sig=${tamperedSig}`),
        { params: Promise.resolve({ memberId: rawMemberId }) }
      );
      expect(tamperedRes.status).toBe(404);
      expect(await tamperedRes.text()).toBe(unknownApiBody);
    });

    it('(c) legacy doubled-prefix printed QR verifies via /api/verify and 308-redirects on /verify page', async () => {
      const code = `LEG${Math.floor(100 + Math.random() * 899)}`;
      const doubledId = `SIN-SIN${code}`;
      const canonicalId = `SIN-${code}`;
      const email = `e2e-legacy-${Date.now()}@uni.edu.ng`;

      const [user] = await db
        .insert(users)
        .values({ email, phone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}` })
        .returning();
      createdUserIds.push(user.id);

      await db.insert(memberProfiles).values({
        userId: user.id,
        chapterId,
        fullName: 'Legacy Doubled Prefix E2E',
        division: 'governance_records',
        status: 'active',
        referralCode: `SIN${code}`,
        createdAt: new Date(Date.now() - 7200 * 1000),
        profileCompletenessPct: 70,
      });

      jest.spyOn(sessionModule, 'getSession').mockResolvedValueOnce({
        userId: user.id,
        email,
        roles: ['member'],
        chapterIds: [],
        is2faAuthenticated: true,
        lastActive: Math.floor(Date.now() / 1000),
      });

      const portalJsx = await PortalPage();
      const portalHtml = renderToStaticMarkup(portalJsx);
      const href = extractVerifyLinkFromHtml(portalHtml);
      expect(href).not.toBeNull();
      const { sig } = parseVerifyHref(href!);

      // Simulate printed doubled-prefix QR carrying Portal signature
      const apiRes = await getVerifyApi(
        new NextRequest(`http://localhost:3000/api/verify/${doubledId}?sig=${sig}`),
        { params: Promise.resolve({ memberId: doubledId }) }
      );
      expect(apiRes.status).toBe(200);
      const apiBody = await apiRes.json();
      expect(apiBody.valid).toBe(true);
      expect(apiBody.signatureValid).toBe(true);
      expect(apiBody.member.memberId).toBe(canonicalId);
      expect(apiBody.member.fullName).toBe('Legacy Doubled Prefix E2E');

      // Visiting legacy URL triggers 308 permanentRedirect to canonical /verify/SIN-<code>?sig=...
      await expect(
        MemberVerificationPage({
          params: Promise.resolve({ memberId: doubledId }),
          searchParams: Promise.resolve({ sig }),
        })
      ).rejects.toThrow(`NEXT_REDIRECT:/verify/${canonicalId}?sig=${sig}`);

      // Following redirect renders verified page
      const redirectedPage = await MemberVerificationPage({
        params: Promise.resolve({ memberId: canonicalId }),
        searchParams: Promise.resolve({ sig }),
      });
      expect(renderToStaticMarkup(redirectedPage)).toContain('Legacy Doubled Prefix E2E');
    });

    it('(d) pending member receives NO signed link and NO QR on /portal (status shown instead)', async () => {
      const code = `PND${Math.floor(100 + Math.random() * 899)}`;
      const email = `e2e-pending-${Date.now()}@uni.edu.ng`;

      const [user] = await db
        .insert(users)
        .values({ email, phone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}` })
        .returning();
      createdUserIds.push(user.id);

      await db.insert(memberProfiles).values({
        userId: user.id,
        chapterId,
        fullName: 'Pending E2E Applicant',
        division: 'student_finance',
        status: 'pending',
        referralCode: `SIN${code}`,
        profileCompletenessPct: 40,
      });

      jest.spyOn(sessionModule, 'getSession').mockResolvedValueOnce({
        userId: user.id,
        email,
        roles: ['member'],
        chapterIds: [],
        is2faAuthenticated: true,
        lastActive: Math.floor(Date.now() / 1000),
      });

      const portalJsx = await PortalPage();
      const portalHtml = renderToStaticMarkup(portalJsx);

      expect(extractVerifyLinkFromHtml(portalHtml)).toBeNull();
      expect(portalHtml).not.toContain('Verify Online');
      expect(portalHtml).not.toContain('alt="QR Code');
      expect(portalHtml).toContain('Status: Pending');
    });
  }
);
