import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@admin/lib/auth';
import { getCmsContentForAdmin, saveCmsDraft } from '@admin/lib/cms/repository';
import { getCmsPreviewPath, isCmsKey } from '@admin/lib/cms/keys';
import { writeAuditLog } from '@/lib/audit/log';
import { csrfProtect } from '@/lib/csrf';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import type { CmsKey } from '@admin/types/content';

type RouteContext = { params: { key: string } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const key = params.key;
  if (!isCmsKey(key)) {
    return NextResponse.json({ error: 'Invalid content key' }, { status: 400 });
  }

  const { data, meta } = await getCmsContentForAdmin(key as CmsKey);
  const response = NextResponse.json({
    key,
    data,
    meta,
    previewPath: getCmsPreviewPath(key as CmsKey),
  });
  await csrfProtect(request, response);
  return response;
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;
  const limited = await enforceRateLimit(`${session.email}:${getClientIp(request)}`, 'admin-draft-save', 30, 60);
  if (!limited.ok) return NextResponse.json({ error: 'Too many save attempts. Try again later.' }, { status: 429, headers: limited.headers });

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

    if (key === 'adverts' && data && Array.isArray((data as any).items)) {
      const { checkAdvertRisk, computeAdvertContentHash } = await import('@/lib/compliance/risk-check');
      const { data: storedContent } = await getCmsContentForAdmin('adverts');
      const storedMap = new Map((storedContent?.items ?? []).map((i: any) => [i.id, i]));

      for (const item of (data as any).items) {
        // Strip client-supplied approval fields. Approvals can only be granted via the legal-approval endpoint.
        item.legalApproval = false;
        item.legalApprovalHash = undefined;
        item.legalApprovedBy = undefined;
        item.legalApprovedAt = undefined;

        // Check if server-stored draft was approved by the legal-approval endpoint
        const stored = storedMap.get(item.id);
        if (stored && stored.legalApproval && stored.legalApprovalHash) {
          const currentHash = computeAdvertContentHash(item);
          if (currentHash === stored.legalApprovalHash) {
            // Content matches server-stored approved state
            item.legalApproval = true;
            item.legalApprovalHash = stored.legalApprovalHash;
            item.legalApprovedBy = stored.legalApprovedBy;
            item.legalApprovedAt = stored.legalApprovedAt;
          } else {
            // Content (text, CTA, or image) modified after approval: revoke and re-lock
            item.legalApproval = false;
            item.legalApprovalHash = undefined;
            item.legalApprovedBy = undefined;
            item.legalApprovedAt = undefined;
            item.enabled = false;

            await writeAuditLog({
              action: 'cms.advert_legal_approval_revoked',
              actor: session.email,
              resource: `adverts/${item.id}`,
              metadata: {
                advertId: item.id,
                title: item.title,
                reason: 'Content modified after legal approval',
                previousHash: stored.legalApprovalHash,
                newHash: currentHash,
              },
            });
          }
        }

        const risk = checkAdvertRisk(item);
        // Only enabling without approval returns 400. Saving a draft with risk terms while disabled is allowed.
        if (item.enabled && risk.hasRisk && !item.legalApproval) {
          const errorMsg = risk.imageRisk
            ? "Advert contains an image or modal that can't be auto-checked and cannot be enabled without legal approval."
            : `Advert "${item.title || item.id}" contains financial/return terms and cannot be enabled without legal approval.`;
          return NextResponse.json(
            { error: errorMsg },
            { status: 400 }
          );
        }
      }
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
