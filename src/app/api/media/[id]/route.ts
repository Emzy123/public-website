import { NextResponse } from 'next/server';
import { getMediaFile } from '@/lib/media/gridfs';

export const runtime = 'nodejs';

type RouteContext = { params: { id: string } };

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const file = await getMediaFile(params.id);
    if (!file) {
      return new NextResponse('Not found', { status: 404 });
    }

    const safeFilename = file.filename.replace(/[^\w.\-()+ ]/g, '_').replace(/"/g, '');

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Media serve error:', error);
    return new NextResponse('Failed to load media', { status: 500 });
  }
}
