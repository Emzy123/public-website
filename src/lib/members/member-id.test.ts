/**
 * @jest-environment node
 */
import {
  normalizeMemberId,
  formatMemberId,
  getMemberTierSummary,
  getCurrentYearPrefix,
  createMemberVerificationSignature,
  verifyMemberSignature,
  mintMemberId,
  getVerifiedMemberRecord,
  generateMemberQrSvg,
  generateMemberQrDataUrl,
} from './member-id';
import { db } from '@/lib/db';
import { users, memberProfiles, chapters, universities } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

describe('Digital Member ID, Normalization & QR Code Engine', () => {
  describe('normalizeMemberId', () => {
    it('normalizes canonical member IDs', () => {
      expect(normalizeMemberId('SIN-FULOKOJA-26-0001')).toBe('SIN-FULOKOJA-26-0001');
      expect(normalizeMemberId('SIN-UEPX3B')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('SIN-MBR-123456')).toBe('SIN-MBR-123456');
    });

    it('normalizes doubled-prefix legacy IDs (strips at most one duplicated SIN prefix)', () => {
      expect(normalizeMemberId('SIN-SINUEPX3B')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('SIN-SIN-UEPX3B')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('SINSINUEPX3B')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('SIN-SINFULOKOJA-26-0001')).toBe('SIN-FULOKOJA-26-0001');
      expect(normalizeMemberId('SIN-SIN-FULOKOJA-26-0001')).toBe('SIN-FULOKOJA-26-0001');
    });

    it('preserves SIN when nanoid part starts with SIN (strips at most one duplicated prefix)', () => {
      expect(normalizeMemberId('SINSINAB')).toBe('SIN-SINAB');
      expect(normalizeMemberId('SIN-SINAB')).toBe('SIN-SINAB');
      expect(normalizeMemberId('SIN-SINSINAB')).toBe('SIN-SINAB');
      expect(normalizeMemberId('SIN-SIN-SINAB')).toBe('SIN-SINAB');
      expect(normalizeMemberId('SINSIN123')).toBe('SIN-SIN123');
      expect(normalizeMemberId('SIN-SIN123')).toBe('SIN-SIN123');
    });

    it('normalizes unhyphenated SIN prefix', () => {
      expect(normalizeMemberId('SINUEPX3B')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('SINFULOKOJA-26-0001')).toBe('SIN-FULOKOJA-26-0001');
    });

    it('normalizes lowercase and mixed-case variants', () => {
      expect(normalizeMemberId('sin-fulokoja-26-0001')).toBe('SIN-FULOKOJA-26-0001');
      expect(normalizeMemberId('sin-sinuepx3b')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('sin-sin-uepx3b')).toBe('SIN-UEPX3B');
      expect(normalizeMemberId('sinuepx3b')).toBe('SIN-UEPX3B');
    });

    it('rejects garbage and malformed input', () => {
      expect(normalizeMemberId('')).toBeNull();
      expect(normalizeMemberId('   ')).toBeNull();
      expect(normalizeMemberId(null)).toBeNull();
      expect(normalizeMemberId(undefined)).toBeNull();
      expect(normalizeMemberId('garbage-no-prefix')).toBeNull();
      expect(normalizeMemberId('<script>alert(1)</script>')).toBeNull();
      expect(normalizeMemberId('SIN-')).toBeNull();
      expect(normalizeMemberId('SIN--TEST')).toBeNull();
      expect(normalizeMemberId('SIN-!@#$')).toBeNull();
    });
  });

  describe('formatMemberId', () => {
    it('formats raw codes with and without SIN prefix', () => {
      expect(formatMemberId('SIN-SINUEPX3B')).toBe('SIN-UEPX3B');
      expect(formatMemberId('SINUEPX3B')).toBe('SIN-UEPX3B');
      expect(formatMemberId('UEPX3B')).toBe('SIN-UEPX3B');
      expect(formatMemberId('sin-uepx3b')).toBe('SIN-UEPX3B');
      expect(formatMemberId('MBR-123456')).toBe('SIN-MBR-123456');
      expect(formatMemberId('SIN-FULOKOJA-26-0001')).toBe('SIN-FULOKOJA-26-0001');
      expect(formatMemberId('SINSINAB')).toBe('SIN-SINAB');
      expect(formatMemberId('')).toBe('');
      expect(formatMemberId(null)).toBe('');
    });
  });

  describe('getMemberTierSummary', () => {
    it('returns Division • Chapter and excludes programme from tier line', () => {
      const summary = getMemberTierSummary({
        roles: ['member'],
        programme: 'Undergraduate',
        division: 'student_finance',
        universityShortName: 'FULOKOJA',
      });
      expect(summary.tier).toBe('Member');
      expect(summary.division).toBe('Student Finance');
      expect(summary.chapter).toBe('FULOKOJA');
      expect(summary.summaryLine).toBe('Student Finance • FULOKOJA');
    });

    it('excludes staff roles (admin, super_admin, staff) completely', () => {
      const staffSummary = getMemberTierSummary({
        roles: ['super_admin', 'admin', 'staff', 'member'],
        division: 'student_finance',
        universityShortName: 'FULOKOJA',
      });
      expect(staffSummary.tier).toBe('Member');
      expect(staffSummary.summaryLine).toBe('Student Finance • FULOKOJA');
      expect(staffSummary.summaryLine).not.toContain('Admin');
      expect(staffSummary.summaryLine).not.toContain('Staff');
    });

    it('includes Chapter Lead as credential and falls back gracefully', () => {
      const general = getMemberTierSummary({
        roles: ['member'],
      });
      expect(general.summaryLine).toBe('Community Member');

      const lead = getMemberTierSummary({
        roles: ['chapter_lead', 'admin'],
        chapterName: 'Kogi State Chapter',
      });
      expect(lead.tier).toBe('Chapter Lead');
      expect(lead.summaryLine).toBe('Chapter Lead • Kogi State Chapter');
    });
  });

  it('computes 2-digit year prefix matching current year', () => {
    const prefix = getCurrentYearPrefix();
    expect(prefix).toHaveLength(2);
    expect(/^\d{2}$/.test(prefix)).toBe(true);
  });

  it('signs and verifies member HMAC credentials correctly', () => {
    const fullMemberId = 'SIN-FULOKOJA-26-0001';
    const userId = 'usr_test_123';
    const issuedAt = new Date('2026-01-15T10:00:00Z');

    const signature = createMemberVerificationSignature(fullMemberId, userId, issuedAt);
    expect(signature).toHaveLength(32);

    expect(verifyMemberSignature(fullMemberId, userId, issuedAt, signature)).toBe(true);
    expect(verifyMemberSignature('SIN-FULOKOJA-26-0002', userId, issuedAt, signature)).toBe(false);
    expect(verifyMemberSignature(fullMemberId, userId, new Date('2026-01-15T11:00:00Z'), signature)).toBe(false);
    expect(verifyMemberSignature(fullMemberId, userId, issuedAt, 'invalid_sig')).toBe(false);
  });

  it('verifies both canonical and legacy doubled-prefix signatures for printed QRs', () => {
    const canonicalId = 'SIN-UEPX3B';
    const legacyDoubledId = 'SIN-SINUEPX3B';
    const userId = 'usr_legacy_456';
    const issuedAt = new Date('2026-01-15T10:00:00Z');

    const legacySig = createMemberVerificationSignature(legacyDoubledId, userId, issuedAt);
    expect(verifyMemberSignature(canonicalId, userId, issuedAt, legacySig)).toBe(true);
    expect(verifyMemberSignature(legacyDoubledId, userId, issuedAt, legacySig)).toBe(true);

    const canonicalSig = createMemberVerificationSignature(canonicalId, userId, issuedAt);
    expect(verifyMemberSignature(canonicalId, userId, issuedAt, canonicalSig)).toBe(true);
    expect(verifyMemberSignature(legacyDoubledId, userId, issuedAt, canonicalSig)).toBe(true);

    expect(verifyMemberSignature('sin-uepx3b', userId, issuedAt, canonicalSig)).toBe(true);
    expect(verifyMemberSignature('sin-sinuepx3b', userId, issuedAt, legacySig)).toBe(true);

    const tamperedSig = legacySig.slice(0, 31) + (legacySig[31] === '0' ? '1' : '0');
    expect(verifyMemberSignature(canonicalId, userId, issuedAt, tamperedSig)).toBe(false);
  });

  it('generates QR code SVG and data URL correctly', async () => {
    const testUrl = 'https://www.sinet.africa/verify/SIN-FULOKOJA-26-0001?sig=abcdef123456';
    const svg = await generateMemberQrSvg(testUrl);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');

    const dataUrl = await generateMemberQrDataUrl(testUrl);
    expect(dataUrl).toContain('data:image/png;base64,');
  });

  (process.env.POSTGRES_TEST_DB_AVAILABLE !== '0' ? describe : describe.skip)(
    'PostgreSQL Database Dependent Operations',
    () => {
      beforeAll(() => {
        if (process.env.POSTGRES_TEST_DB_AVAILABLE === '0') {
          console.warn('[SKIP] member-id.test.ts: Skipped DB operations because PostgreSQL is absent.');
        }
      });

      it('atomically mints unique sequential Member IDs for a campus chapter', async () => {
        const uniquePhone1 = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
        const uniquePhone2 = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;

        const [user1] = await db
          .insert(users)
          .values({ email: `mint-test-1-${Date.now()}@fulokoja.edu.ng`, phone: uniquePhone1 })
          .returning();

        const [user2] = await db
          .insert(users)
          .values({ email: `mint-test-2-${Date.now()}@fulokoja.edu.ng`, phone: uniquePhone2 })
          .returning();

        const testCampus = 'TESTCAMPUS';
        const record1 = await mintMemberId({ userId: user1.id, campusCode: testCampus });
        const record2 = await mintMemberId({ userId: user2.id, campusCode: testCampus });

        expect(record1.campusCode).toBe(testCampus);
        expect(record2.campusCode).toBe(testCampus);

        const yy = getCurrentYearPrefix();
        expect(record1.memberId).toMatch(new RegExp(`^SIN-${testCampus}-${yy}-\\d{4}$`));
        expect(record2.memberId).toMatch(new RegExp(`^SIN-${testCampus}-${yy}-\\d{4}$`));
        expect(record2.sequenceNumber).toBe(record1.sequenceNumber + 1);

        const record1Again = await mintMemberId({ userId: user1.id, campusCode: testCampus });
        expect(record1Again.memberId).toBe(record1.memberId);
      });

      it('retrieves complete verified record with isMinted: true for minted IDs', async () => {
        const [uni] = await db.select().from(universities).limit(1);
        const [chapter] = await db
          .select()
          .from(chapters)
          .where(eq(chapters.universityId, uni.id))
          .limit(1);

        const testEmail = `verified-record-${Date.now()}@uni.edu.ng`;
        const testPhone = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
        const [user] = await db.insert(users).values({ email: testEmail, phone: testPhone }).returning();

        await db.insert(memberProfiles).values({
          userId: user.id,
          fullName: 'Amina Test Ibrahim',
          chapterId: chapter?.id || null,
          division: 'student_finance',
          programme: 'B.Sc Economics',
          level: '300',
          status: 'active',
          referralCode: `SIN${Date.now().toString().slice(-6)}`,
          profileCompletenessPct: 80,
        });

        const uniqueVerifyCampus = `VER${Date.now().toString(36).toUpperCase().slice(-5)}`;
        const minted = await mintMemberId({
          userId: user.id,
          campusCode: uniqueVerifyCampus,
        });

        const verified = await getVerifiedMemberRecord(minted.memberId);
        expect(verified).not.toBeNull();
        expect(verified?.isMinted).toBe(true);
        expect(verified?.fullName).toBe('Amina Test Ibrahim');
        expect(verified?.fullMemberId).toBe(minted.memberId);
        expect(verified?.division).toBe('student_finance');
        expect(verified?.signature).toBeDefined();
        expect(verified?.verificationUrl).toContain(minted.memberId);
      });

      it('resolves referral code whose nanoid starts with SIN (e.g. SINSINAB) to the right member and not another', async () => {
        const randLetters = () =>
          Array.from({ length: 4 }, () =>
            'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.charAt(Math.floor(Math.random() * 32))
          ).join('');
        const tag = `${randLetters()}Q`; // 5 chars (< 6), unique per run
        const shortReferral = `SIN${tag}`; // nanoid part = tag
        const sinPrefixedNanoidReferral = `SINSIN${tag}`; // nanoid part = SIN + tag

        const phone1 = `+23481${Math.floor(10000000 + Math.random() * 90000000)}`;
        const phone2 = `+23482${Math.floor(10000000 + Math.random() * 90000000)}`;

        const [userOther] = await db
          .insert(users)
          .values({ email: `sin-other-${Date.now()}-${Math.random()}@uni.edu.ng`, phone: phone1 })
          .returning();

        const [userTarget] = await db
          .insert(users)
          .values({ email: `sin-target-${Date.now()}-${Math.random()}@uni.edu.ng`, phone: phone2 })
          .returning();

        await db.insert(memberProfiles).values({
          userId: userOther.id,
          fullName: 'Other Member Not Target',
          division: 'student_finance',
          status: 'active',
          referralCode: shortReferral,
          profileCompletenessPct: 60,
        });

        await db.insert(memberProfiles).values({
          userId: userTarget.id,
          fullName: 'Right Member Target',
          division: 'student_enterprise',
          status: 'active',
          referralCode: sinPrefixedNanoidReferral,
          profileCompletenessPct: 80,
        });

        // Querying SINSIN<tag> or SIN-SIN<tag> must resolve to Right Member Target, NOT Other Member
        const resolvedRaw = await getVerifiedMemberRecord(sinPrefixedNanoidReferral);
        expect(resolvedRaw).not.toBeNull();
        expect(resolvedRaw?.userId).toBe(userTarget.id);
        expect(resolvedRaw?.fullName).toBe('Right Member Target');
        expect(resolvedRaw?.isMinted).toBe(false);
        expect(resolvedRaw?.fullMemberId).toBe(`SIN-SIN${tag}`);

        const resolvedCanonical = await getVerifiedMemberRecord(`SIN-SIN${tag}`);
        expect(resolvedCanonical?.userId).toBe(userTarget.id);

        // Querying SIN<tag> must still resolve to Other Member
        const resolvedOther = await getVerifiedMemberRecord(shortReferral);
        expect(resolvedOther?.userId).toBe(userOther.id);
      });
    }
  );
});
