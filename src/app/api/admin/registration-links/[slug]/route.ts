import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getSession } from '@admin/lib/auth';
import { getMongoDb } from '@/lib/db/mongodb';
import { csrfProtect } from '@/lib/csrf';
import {
  LINK_WAITLIST_COLLECTION,
  REGISTRATION_LINKS_COLLECTION,
  isLinkAcceptingApplications,
  maybeAutoCloseLink,
  serialiseRegistrationLink,
} from '@/lib/registration-links';

function serialiseApplication(doc: Record<string, unknown>) {
  return {
    ...doc,
    _id: String(doc._id),
    submittedAt: doc.submittedAt instanceof Date ? doc.submittedAt.toISOString() : doc.submittedAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const slug = params.slug;
  try {
    const db = await getMongoDb();
    const link = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug });
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

    if (link.isOpen) await maybeAutoCloseLink(db, link as typeof link & { _id: ObjectId });
    const refreshed = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug });

    const [applications, waitlist] = await Promise.all([
      db.collection('applications').find({ sourceLinkId: refreshed!._id }).sort({ submittedAt: -1 }).limit(200).toArray(),
      db.collection(LINK_WAITLIST_COLLECTION).find({ linkId: refreshed!._id }).sort({ capturedAt: -1 }).toArray(),
    ]);

    const response = NextResponse.json({
      link: serialiseRegistrationLink(refreshed!),
      applications: applications.map((doc) => serialiseApplication(doc as Record<string, unknown>)),
      waitlist: waitlist.map((entry) => ({
        _id: String(entry._id),
        email: entry.email,
        capturedAt: entry.capturedAt instanceof Date ? entry.capturedAt.toISOString() : entry.capturedAt,
      })),
    });
    await csrfProtect(request, response);
    return response;
  } catch (error) {
    console.error('Registration link detail error:', error);
    return NextResponse.json({ error: 'Unable to load link details' }, { status: 503 });
  }
}
