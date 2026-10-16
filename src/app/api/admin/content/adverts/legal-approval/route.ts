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

    const hash = approved
      ? computeAdvertContentHash({
          title,
          body: body?.body,
          ctaLabel: body?.ctaLabel,
          ctaHref: body?.ctaHref,
          imageAlt: body?.imageAlt,
        })
      : undefined;

    if (approved) {
      await writeAuditLog({
        action: 'cms.advert_legal_approval',
        actor: serverActor,
        resource: `adverts/${advertId}`,
        metadata: {
          advertId,
          title,
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
          title,
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
