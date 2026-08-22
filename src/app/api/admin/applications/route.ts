import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSession } from '@admin/lib/auth';
import { getMongoDb } from '@/lib/db/mongodb';
import { csrfProtect } from '@/lib/csrf';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { writeAuditLog } from '@/lib/audit/log';
import { sendApplicationStatusEmail, sendCustomApplicantEmail } from '@/lib/email/application-mail';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { ROLE_LABELS } from '@/lib/types/membership';
import type { ApplicationRole } from '@/lib/types/membership';
import { REGISTRATION_LINKS_COLLECTION, serialiseRegistrationLink } from '@/lib/registration-links';

const STATUSES = ['pending', 'under_review', 'approved', 'declined', 'active'] as const;
type ApplicationStatus = (typeof STATUSES)[number];

function serialise(doc: Record<string, unknown>) {
  return {
    ...doc,
    _id: String(doc._id),
    submittedAt: doc.submittedAt instanceof Date ? doc.submittedAt.toISOString() : doc.submittedAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

function pathwayLabel(pathway: string): string {
  if (pathway in ROLE_LABELS) return ROLE_LABELS[pathway as ApplicationRole];
  if (pathway === 'investment') return 'Investment (legacy)';
  if (pathway === 'get-involved') return 'Get Involved (legacy)';
  if (pathway === 'student') return 'Student';
  return pathway;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pathway = request.nextUrl.searchParams.get('pathway');
  const status = request.nextUrl.searchParams.get('status');
  const linkId = request.nextUrl.searchParams.get('linkId');
  const filter: Record<string, unknown> = {};
  if (pathway) filter.pathway = pathway;
  if (status && STATUSES.includes(status as ApplicationStatus)) filter.status = status;
  if (linkId && ObjectId.isValid(linkId)) filter.sourceLinkId = new ObjectId(linkId);

  try {
    const db = await getMongoDb();
    const [applications, total, pendingCount, links] = await Promise.all([
      db.collection('applications').find(filter).sort({ submittedAt: -1 }).limit(200).toArray(),
      db.collection('applications').countDocuments(filter),
      db.collection('applications').countDocuments({ status: 'pending' }),
      db.collection(REGISTRATION_LINKS_COLLECTION).find({}).sort({ createdAt: -1 }).toArray(),
    ]);

    const response = NextResponse.json({
      applications: applications.map((doc) => {
        const raw = doc as Record<string, unknown>;
        const s = serialise(raw);
        return { ...s, pathwayLabel: pathwayLabel(String(raw.pathway || '')) };
      }),
      total,
      counts: { pending: pendingCount },
      links: links.map((doc) => serialiseRegistrationLink(doc)),
    });
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

    if (body?.action === 'custom_email') {
      const subject = String(body?.subject ?? '').trim().slice(0, 200);
      const message = String(body?.message ?? '').trim().slice(0, 5_000);
      if (!ObjectId.isValid(id) || !subject || !message) {
        return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
      }

      const db = await getMongoDb();
      const application = await db.collection('applications').findOne({ _id: new ObjectId(id) });
      if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

      const appData = (application.data || {}) as Record<string, unknown>;
      const email = typeof appData.email === 'string' ? appData.email : '';
      if (!email) return NextResponse.json({ error: 'Applicant has no email on record' }, { status: 400 });

      await sendCustomApplicantEmail({
        to: email,
        subject,
        message,
        applicantName: typeof appData.fullName === 'string' ? appData.fullName : 'Applicant',
      });

      await writeAuditLog({
        action: 'application.custom_email',
        actor: session.email,
        resource: `application:${id}`,
        metadata: { to: email, subject, messagePreview: message.slice(0, 200) },
      });

      return NextResponse.json({ success: true });
    }

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
        const memberUpdate: Record<string, unknown> = {
          status: 'approved',
          updatedAt,
          pathway: application.pathway || application.role,
          sourceLink: application.sourceLinkName || 'Student Onboarding — evergreen',
        };
        if (application.pathway === 'investment') {
          memberUpdate.investor = { applicationId: id, tier: data.tier, plan: data.plan, amount: data.amount, paymentAcknowledgement: 'pending' };
        } else {
          memberUpdate.role = data.role || application.role || application.pathway;
          if (data.location) memberUpdate.location = data.location;
        }
        await db.collection('members').updateOne({ email }, { $set: memberUpdate });
      }
    }

    await writeAuditLog({
      action: 'application.status_update',
      actor: session.email,
      resource: `application:${id}`,
      metadata: { newStatus: status, pathway: application.pathway, reviewNote: reviewNote || undefined },
      previousValue: { status: application.status as string },
    });

    const appData = (application.data || {}) as Record<string, unknown>;
    const role = typeof appData.role === 'string' ? appData.role : undefined;
    sendApplicationStatusEmail({
      email: typeof appData.email === 'string' ? appData.email : '',
      name: typeof appData.fullName === 'string' ? appData.fullName : '',
      pathway: String(application.pathway || role || ''),
      status,
      role: role ? (ROLE_LABELS[role as ApplicationRole] || role) : undefined,
      reviewNote: reviewNote || undefined,
    }).catch((err) => console.warn('Application status email failed:', err));

    return NextResponse.json({ success: true, status, reviewNote });
  } catch (error) {
    console.error('Application update error:', error);
    return NextResponse.json({ error: 'Unable to update application' }, { status: 503 });
  }
}
