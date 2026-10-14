import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMongoDb } from '@/lib/db/mongodb';
import { validateOrigin } from '@/lib/security/origin';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { isHoneypotTriggered } from '@/lib/security/public-form';

const notifySchema = z.object({
  email: z.string().trim().email('Valid email address required'),
  fullName: z.string().trim().max(120).optional(),
  source: z.string().trim().max(64).optional().default('apply-notify'),
  website: z.string().max(0).optional(),
});

function isTestSubmission(input: { email: string; fullName: string }): boolean {
  const emailLower = input.email.toLowerCase();
  const nameLower = input.fullName.toLowerCase();
  return emailLower === 'test@example.com' || emailLower.endsWith('@example.com') || nameLower.includes('test');
}

export async function POST(request: NextRequest) {
  // 1. Origin verification
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 });
  }

  // 2. Rate limiting (max 5 requests per 15-minute window per IP)
  const ip = getClientIp(request);
  const rateLimit = await enforceRateLimit(ip, 'apply-notify', 5, 15 * 60);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  try {
    const rawBody = await request.json();

    // 3. Spam protection (Honeypot verification)
    if (isHoneypotTriggered(rawBody) || (rawBody.website && String(rawBody.website).length > 0)) {
      // Return 200 silently to prevent bots from discovering the trap
      return NextResponse.json({
        success: true,
        message: "You're on the priority notification list! We'll alert you as soon as the next cohort opens.",
      });
    }

    // 4. Input validation (Zod schema)
    const validation = notifySchema.safeParse(rawBody);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path.join('.');
        if (path) fieldErrors[path] = issue.message;
      }
      return NextResponse.json(
        {
          error: validation.error.issues[0]?.message || 'Invalid input data',
          fieldErrors,
        },
        { status: 400 }
      );
    }
    const parsed = validation.data;
    const email = parsed.email.toLowerCase().trim();
    const fullName = parsed.fullName?.trim() || 'Applicant';
    const isTest = isTestSubmission({ email, fullName });

    const db = await getMongoDb();
    const collection = db.collection('academyInterests');

    // Ensure index on email for quick lookup and deduplication
    try {
      await collection.createIndex({ email: 1 });
    } catch {
      // Index creation safe fallback
    }

    // 5. Duplicate-email handling
    const existing = await collection.findOne({ email });
    if (existing) {
      await collection.updateOne(
        { _id: existing._id },
        {
          $set: {
            updatedAt: new Date(),
            source: parsed.source || existing.source || 'apply-notify',
            ...(parsed.fullName ? { fullName } : {}),
          },
        }
      );
      return NextResponse.json({
        success: true,
        message: "You're already on our priority list! We'll alert you as soon as the next cohort opens.",
        isExisting: true,
      });
    }

    // Fresh record insertion
    await collection.insertOne({
      fullName,
      email,
      source: parsed.source || 'apply-notify',
      isTest,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "You're on the priority notification list! We'll alert you as soon as the next cohort opens.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }
    console.error('[ApplyNotify] Error recording notification preference:', err);
    return NextResponse.json(
      { error: 'Failed to record notification preference. Please try again.' },
      { status: 500 }
    );
  }
}
