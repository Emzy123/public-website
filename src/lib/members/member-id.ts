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
import { eq, and, sql } from 'drizzle-orm';
import { SITE_URL } from '@/lib/site-config';

import { isProductionMode } from '@/lib/runtime/envMode';

function getSigningSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret) return secret;
  if (isProductionMode()) {
    throw new Error(
      'Fatal: AUTH_SECRET or ADMIN_SESSION_SECRET must be configured in production for cryptographic credential signatures.'
    );
  }
  return 'sinet-development-verification-hmac-secret-32-chars';
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
 */
export function verifyMemberSignature(
  fullMemberId: string,
  userId: string,
  issuedAt: Date,
  signature: string
): boolean {
  if (!signature || signature.length !== 32) return false;
  const expected = createMemberVerificationSignature(fullMemberId, userId, issuedAt);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature.toLowerCase()),
      Buffer.from(expected.toLowerCase())
    );
  } catch {
    return false;
  }
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
  const fullMemberId = `SIN-${normalizedCampus}-${yearPrefix}-${seqStr}`;

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
 */
export async function getVerifiedMemberRecord(fullMemberId: string) {
  const normalizedId = fullMemberId.trim().toUpperCase();

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
    .where(eq(memberIds.memberId, normalizedId));

  if (!record) {
    return null;
  }

  const signature = createMemberVerificationSignature(
    record.fullMemberId,
    record.userId,
    record.issuedAt
  );

  return {
    ...record,
    signature,
    verificationUrl: `${SITE_URL}/verify/${record.fullMemberId}?sig=${signature}`,
  };
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
