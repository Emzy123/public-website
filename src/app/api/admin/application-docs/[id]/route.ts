import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@admin/lib/auth';
import { getApplicationDocument } from '@/lib/applications/document-storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const file = await getApplicationDocument(params.id);
  if (!file) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${file.filename.replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
