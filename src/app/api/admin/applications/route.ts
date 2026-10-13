import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError, ForbiddenError } from '@/lib/auth/guards';
import { listApplications } from '@/lib/applications/campaigns';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as
      | 'submitted'
      | 'under_review'
      | 'approved'
      | 'rejected'
      | null;
    const universityId = searchParams.get('universityId') || undefined;
    const division = searchParams.get('division') as
      | 'student_finance'
      | 'student_enterprise'
      | 'governance_records'
      | null;

    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    const apps = await listApplications({
      status: status || undefined,
      universityId,
      division: division || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      applications: apps,
      admin: {
        id: session.userId,
        email: session.email,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Admin applications listing error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve applications list' },
      { status: 500 }
    );
  }
}
