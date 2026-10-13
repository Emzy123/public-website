import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpOrMagicToken } from '@/lib/auth/otp';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';
import { UserRole } from '@/lib/auth/roles';
import { db } from '@/lib/db';
import { users, userRoles, memberProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SITE_URL } from '@/lib/site-config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email')?.trim().toLowerCase();

  if (!token || !email) {
    return NextResponse.redirect(`${SITE_URL}/sign-in?error=missing_token`);
  }

  const verification = await verifyOtpOrMagicToken(email, token);
  if (!verification.success) {
    return NextResponse.redirect(
      `${SITE_URL}/sign-in?error=${encodeURIComponent(verification.error || 'Invalid or expired link')}`
    );
  }

  try {
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

      const initialRole: UserRole = isConfiguredAdmin ? 'super_admin' : 'member';
      await db.insert(userRoles).values({ userId: user.id, role: initialRole });

      const randomReferralCode = `SIN${Date.now().toString(36).toUpperCase().slice(-6)}`;
      await db.insert(memberProfiles).values({
        userId: user.id,
        fullName: email.split('@')[0],
        referralCode: randomReferralCode,
      });
    }

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

    const isAdmin = roles.includes('super_admin') || roles.includes('admin');
    const requires2fa = isAdmin && (user.totpEnabled || Boolean(process.env.ADMIN_TOTP_SECRET));
    const is2faAuthenticated = !requires2fa;

    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      roles,
      chapterIds,
      is2faAuthenticated,
    });

    const destination = requires2fa ? '/2fa' : isAdmin ? '/admin' : '/dashboard';
    const response = NextResponse.redirect(`${SITE_URL}${destination}`);
    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.redirect(`${SITE_URL}/sign-in?error=server_error`);
  }
}
