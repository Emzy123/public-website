import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';
import { getSession } from '@admin/lib/auth';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const csrf = await verifyCsrfToken(req);
  if (!csrf.ok) return csrf.response;

  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const dryRun = searchParams.get('dryRun') === 'true' || body?.dryRun === true;

    const db = await getMongoDb();

    // Match only when email is test@example.com OR message contains "production smoke test"
    const contactTestQuery = {
      $or: [
        { email: { $regex: '^test@example\\.com$', $options: 'i' } },
        { message: { $regex: 'production smoke test', $options: 'i' } },
      ],
    };

    const academyTestQuery = {
      $or: [
        { email: { $regex: '^test@example\\.com$', $options: 'i' } },
      ],
    };

    if (dryRun) {
      const [contactCount, academyCount] = await Promise.all([
        db.collection('contactMessages').countDocuments(contactTestQuery),
        db.collection('academyInterests').countDocuments(academyTestQuery),
      ]);

      return NextResponse.json({
        dryRun: true,
        matchedCount: contactCount + academyCount,
        contactMatched: contactCount,
        academyMatched: academyCount,
      });
    }

    const [contactResult, academyResult] = await Promise.all([
      db.collection('contactMessages').updateMany(contactTestQuery, { $set: { isTest: true } }),
      db.collection('academyInterests').updateMany(academyTestQuery, { $set: { isTest: true } }),
    ]);

    const modifiedCount = contactResult.modifiedCount + academyResult.modifiedCount;
    const matchedCount = contactResult.matchedCount + academyResult.matchedCount;

    await writeAuditLog({
      action: 'submissions.mark_test',
      actor: session.email,
      resource: 'submissions',
      metadata: {
        contactMatched: contactResult.matchedCount,
        contactModified: contactResult.modifiedCount,
        academyMatched: academyResult.matchedCount,
        academyModified: academyResult.modifiedCount,
        totalModified: modifiedCount,
      },
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      matchedCount,
      modifiedCount,
      contact: { matched: contactResult.matchedCount, modified: contactResult.modifiedCount },
      academy: { matched: academyResult.matchedCount, modified: academyResult.modifiedCount },
    });
  } catch (error) {
    console.error('Failed to mark test submissions:', error);
    return NextResponse.json({ error: 'Failed to mark test submissions' }, { status: 500 });
  }
}
