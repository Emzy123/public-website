import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError, ForbiddenError } from '@/lib/auth/guards';
import { db, sanitizeDatabaseError } from '@/lib/db';
import { auditLog } from '@/lib/db/schema';
import { and, desc, eq, gte, lte, SQL } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const actionFilter = searchParams.get('action');
    const actorFilter = searchParams.get('actor')?.trim().toLowerCase() || null;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 50;

    const parsedOffset = parseInt(searchParams.get('offset') || '0', 10);
    const offset = Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset) : 0;

    const conditions: SQL[] = [];
    if (actionFilter) conditions.push(eq(auditLog.action, actionFilter));
    if (actorFilter) conditions.push(eq(auditLog.actorEmail, actorFilter));
    if (fromParam) {
      const fromDate = new Date(fromParam);
      if (!Number.isNaN(fromDate.getTime())) conditions.push(gte(auditLog.createdAt, fromDate));
    }
    if (toParam) {
      const toDate = new Date(toParam);
      if (!Number.isNaN(toDate.getTime())) {
        // Inclusive end-of-day when date-only
        if (/^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
          toDate.setUTCHours(23, 59, 59, 999);
        }
        conditions.push(lte(auditLog.createdAt, toDate));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db
      .select()
      .from(auditLog)
      .where(whereClause)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      logs,
      pagination: { limit, offset, count: logs.length },
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
    console.error('Failed to retrieve audit log:', sanitizeDatabaseError(error));
    return NextResponse.json(
      {
        error: 'Institutional audit log is temporarily unavailable. Please retry shortly.',
      },
      { status: 503 }
    );
  }
}
