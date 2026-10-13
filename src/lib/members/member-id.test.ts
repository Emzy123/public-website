/**
 * @jest-environment node
 */
import {
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

describe('Digital Member ID & QR Code Engine', () => {
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

    // Valid check
    expect(verifyMemberSignature(fullMemberId, userId, issuedAt, signature)).toBe(true);

    // Tampered member ID
    expect(
      verifyMemberSignature('SIN-FULOKOJA-26-0002', userId, issuedAt, signature)
    ).toBe(false);

    // Tampered timestamp
    expect(
      verifyMemberSignature(fullMemberId, userId, new Date('2026-01-15T11:00:00Z'), signature)
    ).toBe(false);

    // Malformed signature
    expect(verifyMemberSignature(fullMemberId, userId, issuedAt, 'invalid_sig')).toBe(false);
  });

  it('generates QR code SVG and data URL correctly', async () => {
    const testUrl = 'https://www.sinet.africa/verify/SIN-FULOKOJA-26-0001?sig=abcdef123456';
    const svg = await generateMemberQrSvg(testUrl);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');

    const dataUrl = await generateMemberQrDataUrl(testUrl);
    expect(dataUrl).toContain('data:image/png;base64,');
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

    // Format check: SIN-[CAMPUS]-[YY]-[SEQ:4]
    const yy = getCurrentYearPrefix();
    expect(record1.memberId).toMatch(new RegExp(`^SIN-${testCampus}-${yy}-\\d{4}$`));
    expect(record2.memberId).toMatch(new RegExp(`^SIN-${testCampus}-${yy}-\\d{4}$`));

    // Sequence check: second record has sequence exactly 1 greater than first record
    expect(record2.sequenceNumber).toBe(record1.sequenceNumber + 1);

    // Deduplication check: re-minting for user1 returns the same existing record
    const record1Again = await mintMemberId({ userId: user1.id, campusCode: testCampus });
    expect(record1Again.memberId).toBe(record1.memberId);
  });

  it('retrieves complete verified record for public verification page', async () => {
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

    const minted = await mintMemberId({
      userId: user.id,
      campusCode: uni.campusCode,
    });

    const verified = await getVerifiedMemberRecord(minted.memberId);
    expect(verified).not.toBeNull();
    expect(verified?.fullName).toBe('Amina Test Ibrahim');
    expect(verified?.fullMemberId).toBe(minted.memberId);
    expect(verified?.division).toBe('student_finance');
    expect(verified?.signature).toBeDefined();
    expect(verified?.verificationUrl).toContain(minted.memberId);
  });
});
