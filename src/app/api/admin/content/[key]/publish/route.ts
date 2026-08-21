import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@admin/lib/auth';
import { getCmsContentForAdmin, publishCmsContent } from '@admin/lib/cms/repository';
import { getCmsPreviewPath, isCmsKey } from '@admin/lib/cms/keys';
import { writeAuditLog } from '@/lib/audit/log';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import type { CmsKey } from '@admin/types/content';

type RouteContext = { params: { key: string } };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const csrf = await verifyCsrfToken(_request);
  if (!csrf.ok) return csrf.response;
  const limited = await enforceRateLimit(`${session.email}:${getClientIp(_request)}`, 'admin-publish', 5, 5 * 60);
  if (!limited.ok) return NextResponse.json({ error: 'Too many publish attempts. Try again later.' }, { status: 429, headers: limited.headers });

  const key = params.key;
  if (!isCmsKey(key)) {
    return NextResponse.json({ error: 'Invalid content key' }, { status: 400 });
  }

  try {
    const result = await publishCmsContent(key as CmsKey, session.email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await writeAuditLog({
      action: 'cms.publish',
      actor: session.email,
      resource: key,
    });

    const { data, meta } = await getCmsContentForAdmin(key as CmsKey);
    return NextResponse.json({
      success: true,
      key,
      data,
      meta,
      previewPath: getCmsPreviewPath(key as CmsKey),
    });
  } catch (error) {
    console.error('CMS publish error:', error);
    return NextResponse.json({ error: 'Failed to publish content' }, { status: 500 });
  }
}
