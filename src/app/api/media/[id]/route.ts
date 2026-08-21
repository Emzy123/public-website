import { NextRequest, NextResponse } from 'next/server';
import { getMediaFile } from '@/lib/media/gridfs';
import { verifyMediaSignature } from '@/lib/media/signed-url';
import { verifySession } from '@admin/lib/auth';

export const runtime = 'nodejs';

const COOKIE_NAME = 'sinet_admin_session';

type RouteContext = { params: { id: string } };

async function isAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return Boolean(await verifySession(token));
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = params;

  const expires = request.nextUrl.searchParams.get('expires') ?? '';
  const sig = request.nextUrl.searchParams.get('sig') ?? '';
  const hasValidSignature = expires && sig && verifyMediaSignature(id, expires, sig);
  const hasAdminSession = await isAdminSession(request);

  if (!hasValidSignature && !hasAdminSession) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const file = await getMediaFile(id);
    if (!file) {
      return new NextResponse('Not found', { status: 404 });
    }

    const safeFilename = file.filename.replace(/[^\w.\-()+ ]/g, '_').replace(/"/g, '');

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Media serve error:', error);
    return new NextResponse('Failed to load media', { status: 500 });
  }
}
