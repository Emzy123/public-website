/**
 * PATCH /api/admin/announcements/[id]
 *
 * Updates an existing pulse announcement in the Postgres `announcements` table.
 * Calls updatePulseAnnouncement(), which internally runs checkAnnouncementRisk()
 * and logs a compliance warning (warning only — does not gate editing).
 *
 * Requires super_admin or admin role.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
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
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  try {
    await requireRole(['super_admin', 'admin'], request);

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
    const status = (err as { status?: number })?.status || 401;
    const message = (err as { message?: string })?.message || 'Unauthorized';
    return NextResponse.json({ error: message }, { status });
  }
}
