/**
 * POST /api/admin/announcements
 *
 * Creates a new pulse announcement in the Postgres `announcements` table.
 * Calls createPulseAnnouncement(), which internally runs checkAnnouncementRisk()
 * and logs a compliance warning (warning only — does not gate creation).
 *
 * Requires super_admin or admin role.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { validateOrigin } from '@/lib/security/origin';
import { createPulseAnnouncement } from '@/lib/pulse/pulse';
import { z } from 'zod';

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  chapterId: z.string().uuid().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isApproved: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  try {
    const session = await requireRole(['super_admin', 'admin'], request);

    const body = await request.json().catch(() => ({}));
    const parsed = createAnnouncementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid announcement payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { announcement, complianceRisk } = await createPulseAnnouncement({
      ...parsed.data,
      authorId: session.userId,
    });

    return NextResponse.json(
      {
        success: true,
        announcement,
        complianceRisk: {
          hasRisk: complianceRisk.hasRisk,
          matchedTerms: complianceRisk.matchedTerms,
          matchedFields: complianceRisk.matchedFields,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status || 401;
    const message = (err as { message?: string })?.message || 'Unauthorized';
    return NextResponse.json({ error: message }, { status });
  }
}
