import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSession } from '@admin/lib/auth';
import { getMongoDb } from '@/lib/db/mongodb';
import { csrfProtect } from '@/lib/csrf';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { writeAuditLog } from '@/lib/audit/log';
import { sendApplicationStatusEmail } from '@/lib/email/application-mail';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';

const STATUSES = ['pending', 'under_review', 'approved', 'declined', 'active'] as const;
type ApplicationStatus = (typeof STATUSES)[number];

function serialise(doc: Record<string, unknown>) {
  return { ...doc, _id: String(doc._id), submittedAt: doc.submittedAt instanceof Date ? doc.submittedAt.toISOString() : doc.submittedAt, updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pathway = request.nextUrl.searchParams.get('pathway');
  const status = request.nextUrl.searchParams.get('status');
  const filter: Record<string, unknown> = {};
  if (pathway === 'investment' || pathway === 'get-involved') filter.pathway = pathway;
  if (status && STATUSES.includes(status as ApplicationStatus)) filter.status = status;

  try {
    const db = await getMongoDb();
    const [applications, total, investmentPending, involvementPending] = await Promise.all([
      db.collection('applications').find(filter).sort({ submittedAt: -1 }).limit(200).toArray(),
      db.collection('applications').countDocuments(filter),
      db.collection('applications').countDocuments({ pathway: 'investment', status: 'pending' }),
      db.collection('applications').countDocuments({ pathway: 'get-involved', status: 'pending' }),
    ]);
    const response = NextResponse.json({ applications: applications.map((doc) => serialise(doc as Record<string, unknown>)), total, counts: { investmentPending, involvementPending } });
    await csrfProtect(request, response);
    return response;
  } catch (error) {
    console.error('Application list error:', error);
    return NextResponse.json({ error: 'Unable to load applications' }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;
  const limited = await enforceRateLimit(`${session.email}:${getClientIp(request)}`, 'admin-application-update', 20, 60);
  if (!limited.ok) return NextResponse.json({ error: 'Too many application updates. Try again later.' }, { status: 429, headers: limited.headers });

  try {
    const body = await request.json();
    const id = String(body?.id ?? '');
    const status = String(body?.status ?? '') as ApplicationStatus;
    const reviewNote = String(body?.reviewNote ?? '').trim().slice(0, 1_000);
    if (!ObjectId.isValid(id) || !STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid update' }, { status: 400 });

    const db = await getMongoDb();
    const application = await db.collection('applications').findOne({ _id: new ObjectId(id) });
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const updatedAt = new Date();
    await db.collection('applications').updateOne({ _id: application._id }, { $set: { status, reviewNote, reviewedBy: session.email, updatedAt } });

    if (status === 'approved' && application.data && typeof application.data === 'object') {
      const data = application.data as Record<string, unknown>;
      const email = typeof data.email === 'string' ? data.email.toLowerCase() : '';
      if (email) {
        const memberUpdate: Record<string, unknown> = { status: 'approved', updatedAt };
        if (application.pathway === 'investment') {
          memberUpdate.investor = { applicationId: id, tier: data.tier, plan: data.plan, amount: data.amount, paymentAcknowledgement: 'pending' };
        } else {
          memberUpdate.role = data.role;
          memberUpdate.location = data.location;
        }
        await db.collection('members').updateOne({ email }, { $set: memberUpdate });
      }
    }

    await writeAuditLog({ action: 'application.status_update', actor: session.email, resource: `application:${id}`, metadata: { newStatus: status, pathway: application.pathway, reviewNote: reviewNote || undefined }, previousValue: { status: application.status as string } });

    const appData = (application.data || {}) as Record<string, unknown>;
    sendApplicationStatusEmail({
      email: typeof appData.email === 'string' ? appData.email : '',
      name: typeof appData.fullName === 'string' ? appData.fullName : '',
      pathway: application.pathway as 'investment' | 'get-involved',
      status,
      tier: typeof appData.tier === 'string' ? appData.tier : undefined,
      plan: typeof appData.plan === 'string' ? appData.plan : undefined,
      role: typeof appData.role === 'string' ? appData.role : undefined,
      reviewNote: reviewNote || undefined,
    }).catch((err) => console.warn('Application status email failed:', err));

    return NextResponse.json({ success: true, status, reviewNote });
  } catch (error) {
    console.error('Application update error:', error);
    return NextResponse.json({ error: 'Unable to update application' }, { status: 503 });
  }
}
