import crypto from 'crypto';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import {
  memberIds,
  campusIdSequences,
  universities,
  chapters,
  users,
  memberProfiles,
  type MemberIdRecord,
} from '@/lib/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { SITE_URL } from '@/lib/site-config';
import { normalizeMemberId, formatMemberId } from './memberId';

export { normalizeMemberId, formatMemberId };

import { isProductionMode } from '@/lib/runtime/envMode';

function getSigningSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  if (isProductionMode()) {
    throw new Error(
      'Fatal: AUTH_SECRET must be configured in production for cryptographic credential signatures.'
    );
  }
  return process.env.ADMIN_SESSION_SECRET?.trim() || 'sinet-development-verification-hmac-secret-32-chars';
}

/**
 * Returns 2-digit year prefix (e.g., '26' for 2026).
 */
export function getCurrentYearPrefix(): string {
  return new Date().getFullYear().toString().slice(-2);
}

/**
 * Generates an HMAC-SHA256 verification signature for a Member ID.
 */
export function createMemberVerificationSignature(
  fullMemberId: string,
  userId: string,
  issuedAt: Date
): string {
  const secret = getSigningSecret();
  const payload = `${fullMemberId.trim().toUpperCase()}:${userId}:${Math.floor(issuedAt.getTime() / 1000)}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32);
}

/**
 * Verifies the cryptographic HMAC signature for a member record.
 * Supports direct match, canonical normalized ID, and legacy doubled-prefix forms.
 */
export function verifyMemberSignature(
  fullMemberId: string,
  userId: string,
  issuedAt: Date,
  signature: string
): boolean {
  if (!signature || signature.length !== 32) return false;

  function safeHmacMatch(id: string): boolean {
    const expected = createMemberVerificationSignature(id, userId, issuedAt);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature.toLowerCase()),
        Buffer.from(expected.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  // 1. Direct match with passed ID
  if (safeHmacMatch(fullMemberId)) return true;

  // 2. Canonical normalized form
  const canonical = normalizeMemberId(fullMemberId);
  if (canonical && canonical !== fullMemberId.trim().toUpperCase()) {
    if (safeHmacMatch(canonical)) return true;
  }

  // 3. Legacy doubled-prefix form (e.g. SIN-SIN...)
  if (canonical) {
    const suffix = canonical.startsWith('SIN-') ? canonical.slice(4) : canonical;
    const legacyVariants = [
      `SIN-SIN${suffix}`,
      `SIN-SIN-${suffix}`,
      `SINSIN${suffix}`,
      `SIN${suffix}`,
      `SIN-${canonical}`,
      `SIN${canonical}`,
    ];
    for (const variant of legacyVariants) {
      if (variant !== fullMemberId.trim().toUpperCase() && variant !== canonical) {
        if (safeHmacMatch(variant)) return true;
      }
    }
  }

  return false;
}

/**
 * Atomically reserves the next sequence number for a campus and issues a unique Member ID.
 * Format: SIN-[CAMPUS_CODE]-[YY]-[SEQ:4] (e.g. SIN-FULOKOJA-26-0001)
 */
export async function mintMemberId(opts: {
  userId: string;
  campusCode: string;
  yearPrefix?: string;
  issuedById?: string;
}): Promise<MemberIdRecord> {
  const normalizedCampus = opts.campusCode.trim().toUpperCase();
  const yearPrefix = opts.yearPrefix || getCurrentYearPrefix();

  // Check if member ID already exists for this user
  const [existing] = await db
    .select()
    .from(memberIds)
    .where(eq(memberIds.userId, opts.userId));

  if (existing) {
    return existing;
  }

  // Atomically increment the sequence counter in campus_id_sequences
  const result = await db.execute<{ last_seq: number }>(sql`
    INSERT INTO campus_id_sequences (campus_code, year_prefix, last_seq)
    VALUES (${normalizedCampus}, ${yearPrefix}, 1)
    ON CONFLICT (campus_code, year_prefix)
    DO UPDATE SET last_seq = campus_id_sequences.last_seq + 1
    RETURNING last_seq;
  `);

  const nextSeq = result[0]?.last_seq || 1;
  const seqStr = String(nextSeq).padStart(4, '0');
  const fullMemberId = formatMemberId(`SIN-${normalizedCampus}-${yearPrefix}-${seqStr}`);

  const [inserted] = await db
    .insert(memberIds)
    .values({
      userId: opts.userId,
      memberId: fullMemberId,
      campusCode: normalizedCampus,
      yearPrefix,
      sequenceNumber: nextSeq,
      issuedBy: opts.issuedById || null,
    })
    .returning();

  return inserted;
}

/**
 * Retrieves the full verified member profile for public ID verification.
 * Normalizes member ID and supports canonical, legacy doubled-prefix, and profile referral codes.
 */
export async function getVerifiedMemberRecord(fullMemberId: string) {
  const canonicalId = normalizeMemberId(fullMemberId);
  if (!canonicalId) {
    return null;
  }

  const rawNormalized = fullMemberId.trim().toUpperCase();
  const suffix = canonicalId.startsWith('SIN-') ? canonicalId.slice(4) : canonicalId;

  const memberIdCandidates = Array.from(
    new Set([
      canonicalId,
      rawNormalized,
      `SIN-${canonicalId}`,
      `SIN-SIN${suffix}`,
      `SIN-SIN-${suffix}`,
      `SINSIN${suffix}`,
      `SIN${suffix}`,
    ])
  );

  // 1. Query member_ids table (matching canonical or raw stored value)
  const [record] = await db
    .select({
      id: memberIds.id,
      userId: memberIds.userId,
      fullMemberId: memberIds.memberId,
      campusCode: memberIds.campusCode,
      yearPrefix: memberIds.yearPrefix,
      sequenceNumber: memberIds.sequenceNumber,
      issuedAt: memberIds.issuedAt,
      // User
      userEmail: users.email,
      userPhone: users.phone,
      // Profile
      fullName: memberProfiles.fullName,
      avatarUrl: memberProfiles.avatarUrl,
      programme: memberProfiles.programme,
      level: memberProfiles.level,
      division: memberProfiles.division,
      status: memberProfiles.status,
      // Chapter & University
      chapterId: memberProfiles.chapterId,
      chapterName: chapters.name,
      chapterSlug: chapters.slug,
      universityName: universities.name,
      universityShortName: universities.shortName,
    })
    .from(memberIds)
    .innerJoin(users, eq(memberIds.userId, users.id))
    .innerJoin(memberProfiles, eq(memberIds.userId, memberProfiles.userId))
    .leftJoin(chapters, eq(memberProfiles.chapterId, chapters.id))
    .leftJoin(universities, eq(chapters.universityId, universities.id))
    .where(or(...memberIdCandidates.map((c) => eq(memberIds.memberId, c))));

  if (record) {
    const formattedId = formatMemberId(record.fullMemberId) || canonicalId;
    const signature = createMemberVerificationSignature(
      formattedId,
      record.userId,
      record.issuedAt
    );

    return {
      ...record,
      fullMemberId: formattedId,
      signature,
      verificationUrl: `${SITE_URL}/verify/${formattedId}?sig=${signature}`,
    };
  }

  // 2. Fallback: Query member_profiles by referralCode for members without a minted campus ID
  const referralCandidates = Array.from(
    new Set([
      suffix,
      `SIN${suffix}`,
      `SIN-${suffix}`,
      `SIN-SIN${suffix}`,
      canonicalId,
      rawNormalized,
    ])
  );

  const [profileRecord] = await db
    .select({
      id: memberProfiles.id,
      userId: memberProfiles.userId,
      fullName: memberProfiles.fullName,
      avatarUrl: memberProfiles.avatarUrl,
      programme: memberProfiles.programme,
      level: memberProfiles.level,
      division: memberProfiles.division,
      status: memberProfiles.status,
      referralCode: memberProfiles.referralCode,
      issuedAt: memberProfiles.createdAt,
      // User
      userEmail: users.email,
      userPhone: users.phone,
      // Chapter & University
      chapterId: memberProfiles.chapterId,
      chapterName: chapters.name,
      chapterSlug: chapters.slug,
      campusCode: universities.campusCode,
      universityName: universities.name,
      universityShortName: universities.shortName,
    })
    .from(memberProfiles)
    .innerJoin(users, eq(memberProfiles.userId, users.id))
    .leftJoin(chapters, eq(memberProfiles.chapterId, chapters.id))
    .leftJoin(universities, eq(chapters.universityId, universities.id))
    .where(or(...referralCandidates.map((rc) => eq(memberProfiles.referralCode, rc))))
    .limit(1);

  if (profileRecord) {
    const signature = createMemberVerificationSignature(
      canonicalId,
      profileRecord.userId,
      profileRecord.issuedAt
    );

    return {
      id: profileRecord.id,
      userId: profileRecord.userId,
      fullMemberId: canonicalId,
      campusCode: profileRecord.campusCode || 'KOGI',
      yearPrefix: getCurrentYearPrefix(),
      sequenceNumber: 0,
      issuedAt: profileRecord.issuedAt,
      userEmail: profileRecord.userEmail,
      userPhone: profileRecord.userPhone,
      fullName: profileRecord.fullName,
      avatarUrl: profileRecord.avatarUrl,
      programme: profileRecord.programme,
      level: profileRecord.level,
      division: profileRecord.division,
      status: profileRecord.status,
      chapterId: profileRecord.chapterId,
      chapterName: profileRecord.chapterName,
      chapterSlug: profileRecord.chapterSlug,
      universityName: profileRecord.universityName,
      universityShortName: profileRecord.universityShortName,
      signature,
      verificationUrl: `${SITE_URL}/verify/${canonicalId}?sig=${signature}`,
    };
  }

  return null;
}

/**
 * Generates an SVG string representation of the Member Verification QR Code.
 */
export async function generateMemberQrSvg(verificationUrl: string): Promise<string> {
  return QRCode.toString(verificationUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#071026',
      light: '#ffffff',
    },
  });
}

/**
 * Generates a base64 Data URL for the Member Verification QR Code.
 */
export async function generateMemberQrDataUrl(verificationUrl: string): Promise<string> {
  return QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
    color: {
      dark: '#071026',
      light: '#ffffff',
    },
  });
}
