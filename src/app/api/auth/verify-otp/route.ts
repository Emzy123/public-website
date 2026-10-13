import { NextRequest, NextResponse } from 'next/server';
import { VerifyOtpSchema } from '@/lib/schemas/auth.schema';
import { verifyOtpOrMagicToken } from '@/lib/auth/otp';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';
import { UserRole } from '@/lib/auth/roles';
import { writeAdminAudit } from '@/lib/auth/guards';
import { db } from '@/lib/db';
import { users, userRoles, memberProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { validateOrigin } from '@/lib/security/origin';

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const ip = getClientIp(request);
  const body = await request.json().catch(() => ({}));
  const parsed = VerifyOtpSchema.safeParse(body);

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Invalid input';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }

  const { email, code } = parsed.data;

  // Rate limit: 5 attempts per 5 minutes
  const limit = await enforceRateLimit(`${ip}:${email}`, 'member-verify-otp', 5, 300);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please wait a few minutes.' },
      { status: 429, headers: limit.headers }
    );
  }

  // Verify the OTP in the database
  const verification = await verifyOtpOrMagicToken(email, code);
  if (!verification.success) {
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  try {
    // Look up or create user record
    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const isConfiguredAdmin = Boolean(adminEmail && email === adminEmail);

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          emailVerifiedAt: new Date(),
        })
        .returning();
      user = newUser;

      // Assign role: super_admin if matching ADMIN_EMAIL, otherwise member
      const initialRole: UserRole = isConfiguredAdmin ? 'super_admin' : 'member';
      await db.insert(userRoles).values({
        userId: user.id,
        role: initialRole,
      });

      // Initialize base member profile
      const randomReferralCode = `SIN${Date.now().toString(36).toUpperCase().slice(-6)}`;
      await db.insert(memberProfiles).values({
        userId: user.id,
        fullName: email.split('@')[0],
        referralCode: randomReferralCode,
      });
    } else {
      // Update email verified timestamp if not set
      if (!user.emailVerifiedAt) {
        await db
          .update(users)
          .set({ emailVerifiedAt: new Date() })
          .where(eq(users.id, user.id));
      }
    }

    // Fetch user's active roles and chapter scopes
    const roleRecords = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, user.id));

    let roles = roleRecords.map((r) => r.role as UserRole);
    if (roles.length === 0) {
      const defaultRole: UserRole = isConfiguredAdmin ? 'super_admin' : 'member';
      await db.insert(userRoles).values({ userId: user.id, role: defaultRole });
      roles = [defaultRole];
    }

    const chapterIds = roleRecords
      .map((r) => r.chapterId)
      .filter((id): id is string => Boolean(id));

    // Determine 2FA status
    const isAdmin = roles.includes('super_admin') || roles.includes('admin');
    const requires2fa = isAdmin && (user.totpEnabled || Boolean(process.env.ADMIN_TOTP_SECRET));
    const is2faAuthenticated = !requires2fa;

    // Create session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      roles,
      chapterIds,
      is2faAuthenticated,
    });

    if (isAdmin && is2faAuthenticated) {
      await writeAdminAudit({
        actorId: user.id,
        actorEmail: user.email,
        action: 'admin.login',
        resource: 'auth',
        ipAddress: ip,
      });
    }

    const response = NextResponse.json({
      success: true,
      requires2fa,
      user: {
        id: user.id,
        email: user.email,
        roles,
      },
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification. Please try again.' },
      { status: 500 }
    );
  }
}
