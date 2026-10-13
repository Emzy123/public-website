import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedMemberRecord, verifyMemberSignature } from '@/lib/members/member-id';

export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const record = await getVerifiedMemberRecord(params.memberId);
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
