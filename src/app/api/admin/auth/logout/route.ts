import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@admin/lib/auth';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { writeAuditLog } from '@/lib/audit/log';
import { getClientIp } from '@/lib/security/rate-limit-unified';

export async function POST(request: NextRequest) {
  const session = await getSession();
  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;
  if (session) await writeAuditLog({ action: 'admin.logout', actor: session.email, ip: getClientIp(request) });
  const response = NextResponse.json({ success: true });
  response.cookies.set(clearSessionCookie());
  return response;
}
