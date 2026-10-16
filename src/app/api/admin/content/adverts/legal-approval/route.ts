import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@admin/lib/auth';
import { writeAuditLog } from '@/lib/audit/log';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { computeAdvertContentHash } from '@/lib/compliance/risk-check';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;

  const limited = await enforceRateLimit(
    `${session.email}:${getClientIp(request)}`,
    'admin-legal-approval',
    30,
    60
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before updating approval state again.' },
      { status: 429, headers: limited.headers }
    );
  }

  try {
    const body = await request.json();
    const advertId = String(body?.advertId || '').trim();
    const title = String(body?.title || '').trim();
    const approved = Boolean(body?.approved);

    if (!advertId) {
      return NextResponse.json({ error: 'advertId is required' }, { status: 400 });
    }

    // Always determine actor and timestamp server-side. Ignore any client-supplied values.
    const serverTimestamp = new Date().toISOString();
    const serverActor = session.email;

    const { getCmsContentForAdmin, saveCmsDraft } = await import('@admin/lib/cms/repository');
    const { data: currentContent } = await getCmsContentForAdmin('adverts');
    const existingItems = Array.isArray((currentContent as any)?.items) ? [...(currentContent as any).items] : [];

    let targetAdvert = existingItems.find((i: any) => i.id === advertId);
    if (!targetAdvert) {
      targetAdvert = {
        id: advertId,
        title,
        body: body?.body || '',
        ctaLabel: body?.ctaLabel || 'Learn more',
        ctaHref: body?.ctaHref || '/contact',
        imageUrl: body?.imageUrl || '',
        flyerImage: body?.flyerImage || '',
        imageAlt: body?.imageAlt || '',
        enabled: false,
        showModal: Boolean(body?.showModal),
        eyebrow: body?.eyebrow || 'Special event',
        startsAt: body?.startsAt || '',
        endsAt: body?.endsAt || '',
        sortOrder: existingItems.length,
      };
      existingItems.push(targetAdvert);
    } else {
      if (body?.title !== undefined) targetAdvert.title = body.title;
      if (body?.body !== undefined) targetAdvert.body = body.body;
      if (body?.ctaLabel !== undefined) targetAdvert.ctaLabel = body.ctaLabel;
      if (body?.ctaHref !== undefined) targetAdvert.ctaHref = body.ctaHref;
      if (body?.imageUrl !== undefined) targetAdvert.imageUrl = body.imageUrl;
      if (body?.flyerImage !== undefined) targetAdvert.flyerImage = body.flyerImage;
      if (body?.imageAlt !== undefined) targetAdvert.imageAlt = body.imageAlt;
    }

    const hash = approved ? computeAdvertContentHash(targetAdvert) : undefined;

    targetAdvert.legalApproval = approved;
    targetAdvert.legalApprovedAt = approved ? serverTimestamp : undefined;
    targetAdvert.legalApprovedBy = approved ? serverActor : undefined;
    targetAdvert.legalApprovalHash = hash;
    if (!approved) {
      targetAdvert.enabled = false;
    }

    await saveCmsDraft('adverts', { ...currentContent, items: existingItems }, serverActor);

    if (approved) {
      await writeAuditLog({
        action: 'cms.advert_legal_approval',
        actor: serverActor,
        resource: `adverts/${advertId}`,
        metadata: {
          advertId,
          title: targetAdvert.title,
          legalApproval: true,
          timestamp: serverTimestamp,
          approvedBy: serverActor,
          contentHash: hash,
        },
      });
    } else {
      await writeAuditLog({
        action: 'cms.advert_legal_approval_revoked',
        actor: serverActor,
        resource: `adverts/${advertId}`,
        metadata: {
          advertId,
          title: targetAdvert.title,
          reason: 'Approval revoked by admin',
          timestamp: serverTimestamp,
          revokedBy: serverActor,
        },
      });
    }

    return NextResponse.json({
      success: true,
      advertId,
      legalApproval: approved,
      legalApprovedAt: approved ? serverTimestamp : undefined,
      legalApprovedBy: approved ? serverActor : undefined,
      legalApprovalHash: hash,
    });
  } catch (error) {
    console.error('Failed to record legal approval audit log:', error);
    return NextResponse.json({ error: 'Failed to record legal approval' }, { status: 500 });
  }
}
