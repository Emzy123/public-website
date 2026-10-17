import { NextRequest, NextResponse } from 'next/server';
import { performCapacityAudit } from '@/lib/applications/capacity-audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function isAuthorized(request: NextRequest): Promise<boolean> {
  // Never accept token via query string
  if (request.nextUrl.searchParams.has('token')) {
    return false;
  }

  const token = request.headers.get('x-health-token')?.trim();
  const expected = process.env.HEALTH_CHECK_TOKEN?.trim();
  if (expected && token && token === expected) {
    return true;
  }

  // Also support admin session cookie (same as /api/health)
  const adminCookie = request.cookies.get('sinet_admin_session')?.value;
  if (adminCookie) {
    try {
      const { verifySession } = await import('@admin/lib/auth');
      const session = await verifySession(adminCookie);
      if (session?.email) {
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        if (adminEmail && session.email.toLowerCase() === adminEmail) {
          return true;
        }
      }
    } catch {
      /* ignore */
    }
  }

  return false;
}

/**
 * GET /api/admin/capacity-audit
 *
 * Read-only diagnostic endpoint for production deployment audit.
 * Audits count drift and 0-limit configurations without modifying data.
 *
 * Security:
 * - Requires x-health-token header (or valid sinet_admin_session cookie)
 * - Returns 401 Unauthorized if missing, incorrect, or passed via query string
 * - Returns IDs, slugs, and count metadata only; contains zero personal data
 */
export async function GET(request: NextRequest) {
  const authorized = await isAuthorized(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const audit = await performCapacityAudit({ apply: false });
    return NextResponse.json(
      {
        countDrift: audit.countDrift,
        zeroLimits: audit.zeroLimits,
        summary: audit.summary,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('[CapacityAuditRoute] Unexpected audit failure:', err);
    return NextResponse.json(
      { error: 'Internal capacity audit failure' },
      { status: 500 }
    );
  }
}
