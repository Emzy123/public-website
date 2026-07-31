import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@admin/lib/auth';
import { listMedia, uploadMedia } from '@/lib/media/gridfs';
import { buildMediaUrl } from '@/lib/media/url';
import { validateMediaUpload } from '@/lib/media/validation';
import { getMongoDb } from '@/lib/db/mongodb';
import { writeAuditLog } from '@/lib/audit/log';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await getMongoDb();
  } catch {
    return NextResponse.json(
      { error: 'Media library requires MongoDB. Set MONGODB_URI and MONGODB_DB.' },
      { status: 503 }
    );
  }

  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit') ?? 50)));
  const skip = Math.max(0, Number(req.nextUrl.searchParams.get('skip') ?? 0));

  try {
    const { items, total } = await listMedia(limit, skip);
    return NextResponse.json({ items, total, limit, skip });
  } catch (error) {
    console.error('Media list error:', error);
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await getMongoDb();
  } catch {
    return NextResponse.json(
      { error: 'Media upload requires MongoDB. Set MONGODB_URI and MONGODB_DB in your environment.' },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateMediaUpload(file.type, buffer.length, file.name);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const safeName = file.name.replace(/[^\w.\-()+ ]/g, '_').slice(0, 200) || 'upload';
    const id = await uploadMedia(buffer, safeName, file.type, {
      uploadedBy: session.email,
      uploadedAt: new Date().toISOString(),
    });

    await writeAuditLog({
      action: 'media.upload',
      actor: session.email,
      resource: id,
      metadata: { filename: safeName, contentType: file.type },
    });

    return NextResponse.json({
      id,
      url: buildMediaUrl(id),
      filename: safeName,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
