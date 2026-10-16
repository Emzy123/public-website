/**
 * POST /api/admin/announcements
 *
 * Creates a new pulse announcement in the Postgres `announcements` table.
 * Calls createPulseAnnouncement(), which internally runs checkAnnouncementRisk()
 * and logs a compliance warning (warning only — does not gate creation).
 *
 * Auth: env-based admin session (sinet_admin_session cookie), same as all other
 * /api/admin/* routes. A dashboard member holding a user_roles 'admin' or 'super_admin'
 * value does NOT satisfy this guard — only the env-configured admin console session does.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@admin/lib/auth';
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  try {
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
      authorId: 'admin-' + session.email,
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
    const status = (err as { status?: number })?.status || 500;
    const message = (err as { message?: string })?.message || 'Failed to create announcement';
    return NextResponse.json({ error: message }, { status });
  }
}
