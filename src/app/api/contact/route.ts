import { NextResponse } from 'next/server';
import { ContactSchema } from '@/lib/schemas/contact.schema';
import { getMongoDb } from '@/lib/db/mongodb';
import { sendContactNotification } from '@/lib/email/contact-mail';
import { checkRateLimit, getClientKey, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const key = `contact:${getClientKey(req)}`;
  const limited = checkRateLimit(key, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { success: false, message: 'Too many requests' },
      { status: 429, headers: getRateLimitHeaders(limited) }
    );
  }

  try {
    const body = await req.json();
    if (body?.website) {
      return NextResponse.json({ success: true });
    }
    const validated = ContactSchema.parse(body);
    const db = await getMongoDb();

    await db.collection('contactMessages').insertOne({
      ...validated,
      createdAt: new Date(),
    });

    try {
      await sendContactNotification(validated);
    } catch (error) {
      console.warn('Contact email send failed:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ success: false, errors: error.issues }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Upstream error' }, { status: 502 });
  }
}

export function GET() {
  return NextResponse.json({ success: false, message: 'Method not allowed' }, { status: 405 });
}
