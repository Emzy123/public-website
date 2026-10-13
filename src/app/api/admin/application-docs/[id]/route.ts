import { NextRequest, NextResponse } from 'next/server';
import { getSession as getAdminSession } from '@admin/lib/auth';
import { getSession as getMemberSession } from '@/lib/auth/session';
import { getApplicationDocument } from '@/lib/applications/document-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminSession = await getAdminSession().catch(() => null);
  let isAuthorized = Boolean(adminSession?.email);

  if (!isAuthorized) {
    const memberSession = await getMemberSession().catch(() => null);
    if (memberSession) {
      isAuthorized =
        memberSession.roles.includes('super_admin') ||
        memberSession.roles.includes('admin') ||
        memberSession.roles.includes('chapter_lead');
    }
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized to view application documents' }, { status: 401 });
  }

  const file = await getApplicationDocument(params.id);
  if (!file) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const safeFilename = file.filename.replace(/"/g, '');
  const isViewable =
    file.contentType.startsWith('image/') ||
    file.contentType === 'application/pdf' ||
    file.contentType.startsWith('text/');

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      'Content-Disposition': isViewable
        ? `inline; filename="${safeFilename}"`
        : `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
