import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedMemberRecord, verifyMemberSignature } from '@/lib/members/member-id';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  const ip = getClientIp(request);

  // Rate limit: 60 checks per minute per IP to mitigate automated enumeration/scraping
  const limit = await enforceRateLimit(ip, 'verify-member-credential', 60, 60);
  if (!limit.ok) {
    return NextResponse.json(
      { valid: false, error: 'Too many verification requests. Please slow down.' },
      { status: 429, headers: limit.headers }
    );
  }

  const rawMemberId = params.memberId?.trim();
  if (!rawMemberId || rawMemberId.length > 50) {
    return NextResponse.json(
      { valid: false, error: 'Invalid Member ID parameter format.' },
      { status: 400 }
    );
  }

  try {
    const record = await getVerifiedMemberRecord(rawMemberId);
    if (!record) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Member ID not found. This credential may be invalid or unissued.',
        },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sig = searchParams.get('sig');
    const signatureValid = sig
      ? verifyMemberSignature(record.fullMemberId, record.userId, record.issuedAt, sig)
      : null;

    return NextResponse.json({
      valid: true,
      signatureValid,
      member: {
        memberId: record.fullMemberId,
        fullName: record.fullName,
        avatarUrl: record.avatarUrl,
        campusCode: record.campusCode,
        universityName: record.universityName,
        chapterName: record.chapterName,
        division: record.division,
        programme: record.programme,
        level: record.level,
        status: record.status,
        issuedAt: record.issuedAt,
      },
    });
  } catch (error) {
    console.error('Member verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Verification service temporarily unavailable.' },
      { status: 500 }
    );
  }
}
