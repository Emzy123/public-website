import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMongoDb } from '@/lib/db/mongodb';
import { validateOrigin } from '@/lib/security/origin';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';

const notifySchema = z.object({
  email: z.string().email('Valid email address required'),
  fullName: z.string().optional(),
  source: z.string().optional().default('apply-notify'),
});

function isTestSubmission(input: { email: string; fullName: string }): boolean {
  const emailLower = input.email.toLowerCase();
  const nameLower = input.fullName.toLowerCase();
  return emailLower === 'test@example.com' || emailLower.endsWith('@example.com') || nameLower.includes('test');
}

export async function POST(request: NextRequest) {
  // Origin check
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 });
  }

  // Rate limiting
  const ip = getClientIp(request);
  const rateLimit = await enforceRateLimit(ip, 'apply-notify', 10, 15 * 60);
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  try {
    const body = await request.json();
    const parsed = notifySchema.parse(body);

    const db = await getMongoDb();
    const email = parsed.email.toLowerCase().trim();
    const fullName = parsed.fullName?.trim() || 'Applicant';
    const isTest = isTestSubmission({ email, fullName });

    await db.collection('academyInterests').insertOne({
      fullName,
      email,
      source: parsed.source || 'apply-notify',
      isTest,
      createdAt: new Date(),
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
    console.error('[ApplyNotify] Error saving notification interest:', err);
    return NextResponse.json(
      { error: 'Failed to record notification preference. Please try again.' },
      { status: 500 }
    );
  }
}
