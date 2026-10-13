import crypto from 'crypto';
import { db } from '@/lib/db';
import { verificationTokens } from '@/lib/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { Resend } from 'resend';
import { SITE_URL } from '@/lib/site-config';
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const MONGO_TOKENS_COLLECTION = 'verification_tokens';

async function getMongoFallback() {
  try {
    const { getMongoDb } = await import('@/lib/db/mongodb');
    return await getMongoDb();
  } catch (err) {
    console.warn('[Auth] MongoDB fallback unavailable:', err);
    return null;
  }
}

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

  let storedInPostgres = false;
  try {
    // Invalidate any active previous OTPs in Postgres
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
    storedInPostgres = true;
  } catch (err) {
    console.warn('[Auth] Postgres token storage failed, falling back to MongoDB:', err);
  }

  if (!storedInPostgres) {
    try {
      const mongodb = await getMongoFallback();
      if (!mongodb) throw new Error('MongoDB client not configured');
      await mongodb.collection(MONGO_TOKENS_COLLECTION).deleteMany({ identifier: normalized });
      await mongodb.collection(MONGO_TOKENS_COLLECTION).insertOne({
        identifier: normalized,
        tokenHash,
        channel: 'email_otp',
        expiresAt,
        attempts: 0,
        createdAt: new Date(),
      });
    } catch (mongoErr) {
      console.error('[Auth] Both Postgres and MongoDB token stores failed:', mongoErr);
      throw new Error('Database unavailable to store verification token. Please verify DATABASE_URL or MONGODB_URI.');
    }
  }

  return { otp, expiresAt };
}

export async function createMagicLink(
  email: string
): Promise<{ token: string; url: string; expiresAt: Date }> {
  const normalized = email.trim().toLowerCase();
  const token = generateMagicToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  let storedInPostgres = false;
  try {
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
    storedInPostgres = true;
  } catch (err) {
    console.warn('[Auth] Postgres magic link token insert failed, falling back to MongoDB:', err);
  }

  if (!storedInPostgres) {
    try {
      const mongodb = await getMongoFallback();
      if (!mongodb) throw new Error('MongoDB client not configured');
      await mongodb.collection(MONGO_TOKENS_COLLECTION).deleteMany({ identifier: normalized });
      await mongodb.collection(MONGO_TOKENS_COLLECTION).insertOne({
        identifier: normalized,
        tokenHash,
        channel: 'email_magic_link',
        expiresAt,
        attempts: 0,
        createdAt: new Date(),
      });
    } catch (mongoErr) {
      console.error('[Auth] Both Postgres and MongoDB token stores failed:', mongoErr);
      throw new Error('Database unavailable to store verification token. Please verify DATABASE_URL or MONGODB_URI.');
    }
  }

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

  // 1. Try finding in PostgreSQL first
  try {
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

    if (record) {
      if (record.attempts >= MAX_ATTEMPTS) {
        await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));
        return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
      }

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

      await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));
      return { success: true };
    }
  } catch (err) {
    console.warn('[Auth] Postgres token lookup failed, checking MongoDB fallback:', err);
  }

  // 2. Try MongoDB fallback
  try {
    const mongodb = await getMongoFallback();
    if (mongodb) {
      const doc = await mongodb.collection(MONGO_TOKENS_COLLECTION).findOne({
        identifier: normalized,
        expiresAt: { $gt: now },
      });

    if (doc) {
      const attempts = (doc.attempts as number) || 0;
      if (attempts >= MAX_ATTEMPTS) {
        await mongodb.collection(MONGO_TOKENS_COLLECTION).deleteOne({ _id: doc._id });
        return { success: false, error: 'Too many incorrect attempts. Please request a new code.' };
      }

      const isMatch = crypto.timingSafeEqual(
        Buffer.from(String(doc.tokenHash)),
        Buffer.from(tokenHash)
      );

      if (!isMatch) {
        await mongodb.collection(MONGO_TOKENS_COLLECTION).updateOne(
          { _id: doc._id },
          { $inc: { attempts: 1 } }
        );
        const remaining = MAX_ATTEMPTS - (attempts + 1);
        return {
          success: false,
          error: `Invalid verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
        };
      }

      await mongodb.collection(MONGO_TOKENS_COLLECTION).deleteOne({ _id: doc._id });
      return { success: true };
    }
    }
  } catch (mongoErr) {
    console.warn('[Auth] MongoDB token check failed:', mongoErr);
  }

  return { success: false, error: 'Verification code expired or not found. Please request a new one.' };
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim() || 'SINet <noreply@sinet.africa>';

  if (!apiKey || apiKey.includes('placeholder')) {
    console.log(`[DEV EMAIL MOCK] To: ${email} | Verification Code: ${otp}`);
    return;
  }

  const resend = new Resend(apiKey);
  const emailPayload = {
    to: [email],
    subject: `Your SINet sign-in code: ${otp}`,
    html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f2e8; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(13,26,74,0.15); padding: 32px; border-radius: 8px;">
    <h2 style="color: #0d1a4a; margin-top: 0;">Student Investment Network</h2>
    <p style="color: #464238; font-size: 15px; line-height: 1.5;">Here is your single-use verification code to sign in to your SINet member account:</p>
    <div style="background: #0d1a4a; color: #eccb7c; font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 18px; border-radius: 6px; margin: 24px 0;">
      ${otp}
    </div>
    <p style="color: #60594d; font-size: 13px;">This code will expire in 10 minutes. If you did not request this sign-in code, you can safely ignore this email.</p>
  </div>
</body>
</html>`,
  };

  try {
    const res = await resend.emails.send({
      from: configuredFrom,
      ...emailPayload,
    });
    if (res.error) {
      throw new Error(res.error.message);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Resend] Primary send failed (${msg}), attempting fallback to onboarding@resend.dev`);
    // Fallback to Resend default verified sender
    const fallbackRes = await resend.emails.send({
      from: 'SINet <onboarding@resend.dev>',
      ...emailPayload,
    });
    if (fallbackRes.error) {
      throw new Error(`Email delivery failed: ${fallbackRes.error.message}`);
    }
  }
}

export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim() || 'SINet <noreply@sinet.africa>';

  if (!apiKey || apiKey.includes('placeholder')) {
    console.log(`[DEV EMAIL MOCK] To: ${email} | Magic Link: ${url}`);
    return;
  }

  const resend = new Resend(apiKey);
  const emailPayload = {
    to: [email],
    subject: `Sign in to Student Investment Network`,
    html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f2e8; margin: 0; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(13,26,74,0.15); padding: 32px; border-radius: 8px;">
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
  };

  try {
    const res = await resend.emails.send({
      from: configuredFrom,
      ...emailPayload,
    });
    if (res.error) {
      throw new Error(res.error.message);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Resend] Primary magic link send failed (${msg}), attempting fallback to onboarding@resend.dev`);
    const fallbackRes = await resend.emails.send({
      from: 'SINet <onboarding@resend.dev>',
      ...emailPayload,
    });
    if (fallbackRes.error) {
      throw new Error(`Email delivery failed: ${fallbackRes.error.message}`);
    }
  }
}
