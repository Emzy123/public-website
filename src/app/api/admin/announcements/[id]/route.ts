/**
 * PATCH /api/admin/announcements/[id]
 *
 * Updates an existing pulse announcement in the Postgres `announcements` table.
 * Calls updatePulseAnnouncement(), which internally runs checkAnnouncementRisk()
 * and logs a compliance warning (warning only — does not gate editing).
 *
 * Auth: env-based admin session (sinet_admin_session cookie), same as all other
 * /api/admin/* routes. A dashboard member holding a user_roles 'admin' or 'super_admin'
 * value does NOT satisfy this guard — only the env-configured admin console session does.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@admin/lib/auth';
import { validateOrigin } from '@/lib/security/origin';
import { updatePulseAnnouncement } from '@/lib/pulse/pulse';
import { z } from 'zod';

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(2000).optional(),
  imageUrl: z.string().url().nullable().optional(),
  isApproved: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = updateAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid announcement payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { announcement, complianceRisk } = await updatePulseAnnouncement(id, parsed.data);

    return NextResponse.json({
      success: true,
      announcement,
      complianceRisk: {
        hasRisk: complianceRisk.hasRisk,
        matchedTerms: complianceRisk.matchedTerms,
        matchedFields: complianceRisk.matchedFields,
      },
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 500;
    const message = (err as { message?: string })?.message || 'Failed to update announcement';
    return NextResponse.json({ error: message }, { status });
  }
}
