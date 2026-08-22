import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';
import {
  REGISTRATION_LINKS_COLLECTION,
  isLinkAcceptingApplications,
  maybeAutoCloseLink,
  serialiseRegistrationLink,
} from '@/lib/registration-links';
import { csrfProtect } from '@/lib/csrf';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const db = await getMongoDb();
    const link = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug: params.slug });
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

    if (link.isOpen) await maybeAutoCloseLink(db, link as typeof link & { _id: ObjectId });
    const refreshed = await db.collection(REGISTRATION_LINKS_COLLECTION).findOne({ slug: params.slug });
    const accepting = isLinkAcceptingApplications(refreshed!);

    const response = NextResponse.json({
      link: {
        name: refreshed!.name,
        slug: refreshed!.slug,
        roles: refreshed!.roles,
        accepting,
        status: serialiseRegistrationLink(refreshed!).status,
      },
    });
    await csrfProtect(request, response);
    return response;
  } catch (error) {
    console.error('Public link lookup error:', error);
    return NextResponse.json({ error: 'Unable to load registration link' }, { status: 503 });
  }
}
