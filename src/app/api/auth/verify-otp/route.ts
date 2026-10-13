import { NextRequest, NextResponse } from 'next/server';
import { VerifyOtpSchema } from '@/lib/schemas/auth.schema';
import { verifyOtpOrMagicToken } from '@/lib/auth/otp';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';
import { UserRole } from '@/lib/auth/roles';
import { writeAdminAudit } from '@/lib/auth/guards';
import crypto from 'crypto';
import { getMongoDb } from '@/lib/db/mongodb';
import { db, isPostgresConfigured } from '@/lib/db';
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
  const normalizedEmail = email.trim().toLowerCase();

  // Rate limit: 5 attempts per 5 minutes
  const limit = await enforceRateLimit(`${ip}:${normalizedEmail}`, 'member-verify-otp', 5, 300);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please wait a few minutes.' },
      { status: 429, headers: limit.headers }
    );
  }

  // Verify the OTP in the database
  const verification = await verifyOtpOrMagicToken(normalizedEmail, code);
  if (!verification.success) {
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const isConfiguredAdmin = Boolean(adminEmail && normalizedEmail === adminEmail);

    // 1. Check MongoDB for accepted member or approved application
    let mongoMember: {
      _id?: unknown;
      fullName?: string;
      email?: string;
      phone?: string | null;
      status?: string;
      pathway?: string;
    } | null = null;

    try {
      const mongo = await getMongoDb();
      if (mongo) {
        const doc = await mongo.collection('members').findOne({ email: normalizedEmail });
        if (doc) {
          mongoMember = {
            _id: doc._id,
            fullName: doc.fullName as string,
            email: doc.email as string,
            phone: (doc.phone as string) || null,
            status: (doc.status as string) || 'active',
            pathway: (doc.pathway as string) || 'member',
          };
        } else {
          // Check if user has an approved application
          const app = await mongo.collection('applications').findOne({
            $or: [{ 'data.email': normalizedEmail }, { email: normalizedEmail }],
            status: { $in: ['approved', 'active'] },
          });
          if (app) {
            const appData = (app.data as Record<string, unknown>) || {};
            mongoMember = {
              _id: app._id,
              fullName: (appData.fullName as string) || (app.fullName as string) || normalizedEmail.split('@')[0],
              email: normalizedEmail,
              phone: (appData.phone as string) || (app.phone as string) || null,
              status: 'active',
              pathway: (app.pathway as string) || (app.role as string) || 'member',
            };
          }
        }
      }
    } catch (mongoErr) {
      console.warn('[VerifyOtp] Mongo member lookup warning:', mongoErr);
    }

    let userRecord: {
      id: string;
      email: string;
      phone: string | null;
      totpEnabled: boolean;
    } | null = null;
    let roles: UserRole[] = [];
    let chapterIds: string[] = [];

    // 2. Try PostgreSQL users table if configured
    if (isPostgresConfigured()) {
      try {
        let [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

        if (!user) {
          const [newUser] = await db
            .insert(users)
            .values({
              email: normalizedEmail,
              phone: mongoMember?.phone || null,
              emailVerifiedAt: new Date(),
            })
            .returning();
          user = newUser;

          const initialRole: UserRole = isConfiguredAdmin ? 'super_admin' : 'member';
          await db.insert(userRoles).values({
            userId: user.id,
            role: initialRole,
          });

          // Initialize member profile
          const randomReferralCode = `SIN${Date.now().toString(36).toUpperCase().slice(-6)}`;
          await db.insert(memberProfiles).values({
            userId: user.id,
            fullName: mongoMember?.fullName || normalizedEmail.split('@')[0],
            referralCode: randomReferralCode,
            status: mongoMember?.status === 'active' ? 'active' : 'pending',
          });
        } else {
          if (!user.emailVerifiedAt) {
            await db
              .update(users)
              .set({ emailVerifiedAt: new Date() })
              .where(eq(users.id, user.id));
          }
        }

        const roleRecords = await db
          .select()
          .from(userRoles)
          .where(eq(userRoles.userId, user.id));

        roles = roleRecords.map((r) => r.role as UserRole);
        if (roles.length === 0) {
          const defaultRole: UserRole = isConfiguredAdmin ? 'super_admin' : 'member';
          await db.insert(userRoles).values({ userId: user.id, role: defaultRole });
          roles = [defaultRole];
        }

        chapterIds = roleRecords
          .map((r) => r.chapterId)
          .filter((id): id is string => Boolean(id));

        userRecord = {
          id: user.id,
          email: user.email,
          phone: user.phone || null,
          totpEnabled: user.totpEnabled,
        };
      } catch (pgErr) {
        console.warn('[VerifyOtp] PostgreSQL user lookup failed, using resilient fallback:', pgErr);
      }
    }

    // 3. Fallback when PostgreSQL is offline or user exists in MongoDB
    if (!userRecord) {
      const generatedId = mongoMember?._id
        ? String(mongoMember._id)
        : `00000000-0000-0000-0000-${crypto.createHash('md5').update(normalizedEmail).digest('hex').slice(0, 12)}`;

      const assignedRole: UserRole = isConfiguredAdmin ? 'super_admin' : 'member';
      roles = [assignedRole];
      chapterIds = [];

      userRecord = {
        id: generatedId,
        email: normalizedEmail,
        phone: mongoMember?.phone || null,
        totpEnabled: false,
      };

      // Ensure MongoDB members record is active & verified
      try {
        const mongo = await getMongoDb();
        if (mongo) {
          await mongo.collection('members').updateOne(
            { email: normalizedEmail },
            {
              $set: {
                emailVerifiedAt: new Date(),
                lastLoginAt: new Date(),
                status: 'active',
              },
              $setOnInsert: {
                createdAt: new Date(),
                fullName: mongoMember?.fullName || normalizedEmail.split('@')[0],
                pathway: mongoMember?.pathway || 'member',
              },
            },
            { upsert: true }
          );
        }
      } catch {
        /* Mongo upsert skipped */
      }
    }

    // 4. Determine 2FA requirements
    const isAdmin = roles.includes('super_admin') || roles.includes('admin');
    const requires2fa = isAdmin && (userRecord.totpEnabled || Boolean(process.env.ADMIN_TOTP_SECRET));
    const is2faAuthenticated = !requires2fa;

    // 5. Create session token & cookie
    const token = await createSessionToken({
      userId: userRecord.id,
      email: userRecord.email,
      phone: userRecord.phone,
      roles,
      chapterIds,
      is2faAuthenticated,
    });

    if (isAdmin && is2faAuthenticated) {
      await writeAdminAudit({
        actorId: userRecord.id,
        actorEmail: userRecord.email,
        action: 'admin.login',
        resource: 'auth',
        ipAddress: ip,
      }).catch(() => null);
    }

    const response = NextResponse.json({
      success: true,
      requires2fa,
      user: {
        id: userRecord.id,
        email: userRecord.email,
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
