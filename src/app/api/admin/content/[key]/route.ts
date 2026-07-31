import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@admin/lib/auth';
import { getCmsContentForAdmin, saveCmsDraft } from '@admin/lib/cms/repository';
import { getCmsPreviewPath, isCmsKey } from '@admin/lib/cms/keys';
import { writeAuditLog } from '@/lib/audit/log';
import type { CmsKey } from '@admin/types/content';

type RouteContext = { params: { key: string } };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const key = params.key;
  if (!isCmsKey(key)) {
    return NextResponse.json({ error: 'Invalid content key' }, { status: 400 });
  }

  const { data, meta } = await getCmsContentForAdmin(key as CmsKey);
  return NextResponse.json({
    key,
    data,
    meta,
    previewPath: getCmsPreviewPath(key as CmsKey),
  });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = params.key;
  if (!isCmsKey(key)) {
    return NextResponse.json({ error: 'Invalid content key' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const data = body?.data;
    if (data === undefined) {
      return NextResponse.json({ error: 'Missing data field' }, { status: 400 });
    }

    await saveCmsDraft(key as CmsKey, data, session.email);
    await writeAuditLog({
      action: 'cms.draft_save',
      actor: session.email,
      resource: key,
    });
    const { data: draftData, meta } = await getCmsContentForAdmin(key as CmsKey);

    return NextResponse.json({
      success: true,
      key,
      data: draftData,
      meta,
      previewPath: getCmsPreviewPath(key as CmsKey),
    });
  } catch (error) {
    console.error('CMS draft save error:', error);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}
