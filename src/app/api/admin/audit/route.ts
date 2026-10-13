import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError, ForbiddenError } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const actionFilter = searchParams.get('action');
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 50;

    const parsedOffset = parseInt(searchParams.get('offset') || '0', 10);
    const offset = Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset) : 0;

    let query = db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    const logs = await (actionFilter
      ? db
          .select()
          .from(auditLog)
          .where(eq(auditLog.action, actionFilter))
          .orderBy(desc(auditLog.createdAt))
          .limit(limit)
          .offset(offset)
      : query);

    return NextResponse.json({
      success: true,
      logs,
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
    console.error('Failed to retrieve audit log:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve institutional audit log.' },
      { status: 500 }
    );
  }
}
