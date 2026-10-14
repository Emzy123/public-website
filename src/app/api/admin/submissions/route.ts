import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import type { SubmissionType } from '@admin/lib/submissions';
import { getSession } from '@admin/lib/auth';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { writeAuditLog } from '@/lib/audit/log';
import { csrfProtect } from '@/lib/csrf';

function serializeDoc(doc: Record<string, unknown>) {
  return {
    ...doc,
    _id: String(doc._id),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    readAt: doc.readAt instanceof Date ? doc.readAt.toISOString() : doc.readAt,
    isTest: Boolean(doc.isTest),
  };
}

function buildTextFilter(q: string | null, fields: string[]) {
  if (!q?.trim()) return {};
  const regex = { $regex: q.trim(), $options: 'i' };
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

function buildStatusFilter(status: string | null) {
  if (status === 'unread') return { readAt: { $exists: false } };
  if (status === 'read') return { readAt: { $exists: true } };
  return {};
}

import { CONTACT_TOPICS, normalizeContactTopic } from '@/lib/schemas/contact.schema';

async function getCounts(db: Awaited<ReturnType<typeof getMongoDb>>, showTest: boolean = false) {
  const baseFilter = showTest ? {} : { isTest: { $ne: true } };
  const [contactTotal, contactUnread, academyTotal, academyUnread] = await Promise.all([
    db.collection('contactMessages').countDocuments(baseFilter),
    db.collection('contactMessages').countDocuments({ ...baseFilter, readAt: { $exists: false } }),
    db.collection('academyInterests').countDocuments(baseFilter),
    db.collection('academyInterests').countDocuments({ ...baseFilter, readAt: { $exists: false } }),
  ]);

  // Aggregate unread and total counts grouped by topic
  const topicStats: Record<string, { total: number; unread: number }> = {};
  for (const t of CONTACT_TOPICS) {
    topicStats[t] = { total: 0, unread: 0 };
  }
  topicStats['Academy Interest'] = { total: academyTotal, unread: academyUnread };

  const [contactAggTotal, contactAggUnread] = await Promise.all([
    db
      .collection('contactMessages')
      .aggregate([{ $match: baseFilter }, { $group: { _id: '$topic', count: { $sum: 1 } } }])
      .toArray(),
    db
      .collection('contactMessages')
      .aggregate([
        { $match: { ...baseFilter, readAt: { $exists: false } } },
        { $group: { _id: '$topic', count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  for (const row of contactAggTotal) {
    const topic = normalizeContactTopic(typeof row._id === 'string' ? row._id : null);
    if (!topicStats[topic]) topicStats[topic] = { total: 0, unread: 0 };
    topicStats[topic].total += row.count;
  }
  for (const row of contactAggUnread) {
    const topic = normalizeContactTopic(typeof row._id === 'string' ? row._id : null);
    if (!topicStats[topic]) topicStats[topic] = { total: 0, unread: 0 };
    topicStats[topic].unread += row.count;
  }

  return {
    contacts: { total: contactTotal, unread: contactUnread },
    academy: { total: academyTotal, unread: academyUnread },
    byTopic: topicStats,
  };
}

function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(contacts: Record<string, unknown>[], academy: Record<string, unknown>[]): string {
  const rows = [
    ['Type', 'Name', 'Email', 'Topic / Interest', 'Subject', 'Message', 'Created at'],
    ...contacts.map((item) => ['Contact', item.name, item.email, item.topic || 'General', item.subject, item.message, item.createdAt]),
    ...academy.map((item) => ['Academy interest', item.fullName, item.email, item.interest ?? 'Academy', '', '', item.createdAt]),
  ];
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') ?? 'all';
    const status = searchParams.get('status') ?? 'all';
    const topic = searchParams.get('topic');
    const q = searchParams.get('q');
    const showTest = searchParams.get('showTest') === 'true';
    const limit = Math.min(Number(searchParams.get('limit') ?? 100), 200);

    const db = await getMongoDb();
    const counts = await getCounts(db, showTest);
    const testFilter = showTest ? {} : { isTest: { $ne: true } };

    const contactFilter: Record<string, unknown> = {
      ...testFilter,
      ...buildStatusFilter(status),
      ...buildTextFilter(q, ['name', 'email', 'subject', 'message', 'topic']),
    };
    if (topic && topic !== 'all' && topic !== 'Academy Interest') {
      contactFilter.topic = topic;
    }

    const academyFilter: Record<string, unknown> = {
      ...testFilter,
      ...buildStatusFilter(status),
      ...buildTextFilter(q, ['fullName', 'email']),
    };

    let fetchContacts = type === 'all' || type === 'contact';
    let fetchAcademy = type === 'all' || type === 'academy';

    if (topic && topic !== 'all') {
      if (topic === 'Academy Interest') {
        fetchContacts = false;
        fetchAcademy = true;
      } else {
        fetchAcademy = false;
      }
    }

    const [contacts, academy] = await Promise.all([
      fetchContacts
        ? db.collection('contactMessages').find(contactFilter).sort({ createdAt: -1 }).limit(limit).toArray()
        : Promise.resolve([]),
      fetchAcademy
        ? db.collection('academyInterests').find(academyFilter).sort({ createdAt: -1 }).limit(limit).toArray()
        : Promise.resolve([]),
    ]);

    const response = NextResponse.json({
      contacts: contacts.map((d) => serializeDoc(d as Record<string, unknown>)),
      academy: academy.map((d) => serializeDoc(d as Record<string, unknown>)),
      counts,
    });
    await csrfProtect(req, response);
    return response;
  } catch (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const csrf = await verifyCsrfToken(req);
  if (!csrf.ok) return csrf.response;
  try {
    const body = await req.json();
    const type = body?.type as SubmissionType | undefined;
    const id = body?.id as string | undefined;
    const read = body?.read as boolean | undefined;

    if (!type || !id || typeof read !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid submission id' }, { status: 400 });
    }

    const collection = type === 'contact' ? 'contactMessages' : 'academyInterests';
    const db = await getMongoDb();

    const result = await db.collection(collection).updateOne(
      { _id: new ObjectId(id) },
      read ? { $set: { readAt: new Date() } } : { $unset: { readAt: '' } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    await writeAuditLog({ action: 'submissions.read_status_update', actor: session.email, resource: `${type}:${id}`, metadata: { read } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submission update error:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const csrf = await verifyCsrfToken(req);
  if (!csrf.ok) return csrf.response;

  try {
    const body = await req.json();
    const type = body?.type === 'contact' || body?.type === 'academy' ? body.type : 'all';
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && ObjectId.isValid(id)).slice(0, 200) : [];
    const objectIds = ids.map((id: string) => new ObjectId(id));
    const filter = objectIds.length ? { _id: { $in: objectIds } } : {};
    const db = await getMongoDb();
    const [contacts, academy] = await Promise.all([
      type === 'all' || type === 'contact' ? db.collection('contactMessages').find(filter).sort({ createdAt: -1 }).limit(200).toArray() : Promise.resolve([]),
      type === 'all' || type === 'academy' ? db.collection('academyInterests').find(filter).sort({ createdAt: -1 }).limit(200).toArray() : Promise.resolve([]),
    ]);
    const csv = toCsv(contacts as Record<string, unknown>[], academy as Record<string, unknown>[]);
    const count = contacts.length + academy.length;
    await writeAuditLog({ action: 'submissions.export', actor: session.email, metadata: { type, count, singleRecord: ids.length === 1 } });
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sinet-submissions-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Submission export error:', error);
    return NextResponse.json({ error: 'Failed to export submissions' }, { status: 500 });
  }
}
