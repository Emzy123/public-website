import { NextRequest, NextResponse } from 'next/server';
import { RequestOtpSchema } from '@/lib/schemas/auth.schema';
import { createEmailOtp, createMagicLink, sendOtpEmail, sendMagicLinkEmail } from '@/lib/auth/otp';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { validateOrigin } from '@/lib/security/origin';
import { writeAuditLog } from '@/lib/audit/log';
import { writeAdminAudit } from '@/lib/auth/guards';

export const CLIENT_AUTH_ERROR_MESSAGE =
  "We couldn't send your code right now. Please try again shortly or contact hello@sinet.africa.";

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const body = await request.json().catch(() => ({}));
  const parsed = RequestOtpSchema.safeParse(body);

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Invalid input';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  const { email, mode } = parsed.data;

  // Rate limit: 3 requests per 10 minutes per IP and email
  const limit = await enforceRateLimit(`${ip}:${email}`, 'member-auth-otp', 3, 600);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many sign-in requests. Please wait a few minutes before trying again.' },
      { status: 429, headers: limit.headers }
    );
  }

  try {
    if (mode === 'magic_link') {
      const { url } = await createMagicLink(email);
      await sendMagicLinkEmail(email, url);
      return NextResponse.json({
        success: true,
        mode: 'magic_link',
        message: 'A magic sign-in link has been sent to your email address.',
      });
    } else {
      const { otp } = await createEmailOtp(email);
      await sendOtpEmail(email, otp);
      return NextResponse.json({
        success: true,
        mode: 'otp',
        message: 'A 6-digit verification code has been sent to your email address.',
      });
    }
  } catch (error) {
    const rawError = error instanceof Error ? error.message : String(error);
    console.error('Request OTP/Magic Link provider error:', error);

    await writeAuditLog({
      action: 'auth.otp_failed',
      actor: email,
      ip,
      metadata: { mode, error: rawError },
    });
    await writeAdminAudit({
      actorEmail: email,
      action: 'auth.otp_failed',
      resource: 'auth',
      ipAddress: ip,
      metadata: { mode, error: rawError },
    });

    return NextResponse.json(
      { error: CLIENT_AUTH_ERROR_MESSAGE },
      { status: 503 }
    );
  }
}
