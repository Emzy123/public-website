import crypto from 'crypto';
import { db } from '@/lib/db';
import { verificationTokens } from '@/lib/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site-config';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function generateNumericOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function generateMagicToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createEmailOtp(
  email: string
): Promise<{ otp: string; expiresAt: Date }> {
  const normalized = email.trim().toLowerCase();
  const otp = generateNumericOtp();
  const tokenHash = hashToken(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Invalidate any active previous OTPs for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, normalized));

  await db.insert(verificationTokens).values({
    identifier: normalized,
    tokenHash,
    channel: 'email_otp',
    expiresAt,
    attempts: 0,
  });

  return { otp, expiresAt };
}

export async function createMagicLink(
  email: string
): Promise<{ token: string; url: string; expiresAt: Date }> {
  const normalized = email.trim().toLowerCase();
  const token = generateMagicToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, normalized));

  await db.insert(verificationTokens).values({
    identifier: normalized,
    tokenHash,
    channel: 'email_magic_link',
    expiresAt,
    attempts: 0,
  });

  const url = `${SITE_URL}/api/auth/verify-magic?token=${token}&email=${encodeURIComponent(normalized)}`;
  return { token, url, expiresAt };
}

export async function verifyOtpOrMagicToken(
  identifier: string,
  rawToken: string
): Promise<{ success: boolean; error?: string }> {
  const normalized = identifier.trim().toLowerCase();
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  // Find latest valid token
  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, normalized),
        gt(verificationTokens.expiresAt, now)
      )
    )
    .orderBy(desc(verificationTokens.createdAt))
    .limit(1);

  if (!record) {
    return { success: false, error: 'Verification code expired or not found. Please request a new one.' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));
    return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
  }

  // Safe timing comparison
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(record.tokenHash),
    Buffer.from(tokenHash)
  );

  if (!isMatch) {
    await db
      .update(verificationTokens)
      .set({ attempts: record.attempts + 1 })
      .where(eq(verificationTokens.id, record.id));

    const remaining = MAX_ATTEMPTS - (record.attempts + 1);
    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
    };
  }

  // Token matched: clean it up
  await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));
  return { success: true };
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'SINet <noreply@sinet.africa>';

  if (!apiKey || apiKey.includes('placeholder')) {
    console.log(`[DEV EMAIL MOCK] To: ${email} | Verification Code: ${otp}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: fromEmail,
    to: [email],
    subject: `Your SINet sign-in code: ${otp}`,
    html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f2e8; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #0d1a4a20; padding: 32px; border-radius: 8px;">
    <h2 style="color: #0d1a4a; margin-top: 0;">Student Investment Network</h2>
    <p style="color: #464238; font-size: 15px; line-height: 1.5;">Here is your single-use verification code to sign in to your SINet member account:</p>
    <div style="background: #0d1a4a; color: #eccb7c; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 18px; border-radius: 6px; margin: 24px 0;">
      ${otp}
    </div>
    <p style="color: #60594d; font-size: 13px;">This code will expire in 10 minutes. If you did not request this sign-in code, you can safely ignore this email.</p>
  </div>
</body>
</html>`,
  });
}

export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'SINet <noreply@sinet.africa>';

  if (!apiKey || apiKey.includes('placeholder')) {
    console.log(`[DEV EMAIL MOCK] To: ${email} | Magic Link: ${url}`);
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: fromEmail,
    to: [email],
    subject: `Sign in to Student Investment Network`,
    html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f2e8; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #0d1a4a20; padding: 32px; border-radius: 8px;">
    <h2 style="color: #0d1a4a; margin-top: 0;">Student Investment Network</h2>
    <p style="color: #464238; font-size: 15px; line-height: 1.5;">Click the button below to sign in directly to your SINet member account on this device:</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${url}" style="background: #0d1a4a; color: #ffffff; text-decoration: none; font-weight: bold; padding: 14px 28px; border-radius: 6px; display: inline-block;">
        Sign In to SINet →
      </a>
    </div>
    <p style="color: #60594d; font-size: 13px;">This link will expire in 10 minutes and can only be used once.</p>
  </div>
</body>
</html>`,
  });
}
