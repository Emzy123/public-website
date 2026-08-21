import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';
import { applicationSchema } from '@/lib/schemas/application.schema';
import { issueCsrfToken, verifyCsrfToken } from '@/lib/security/csrf-handler';
import { validateOrigin } from '@/lib/security/origin';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { isDevelopmentMode } from '@/lib/runtime/envMode';
import { createHash } from 'node:crypto';
import { sendApplicationReceivedEmail } from '@/lib/email/application-mail';
import { validateRouteSecurityConfig } from '@/lib/runtime/securityConfig';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return issueCsrfToken(request);
}

export async function POST(request: NextRequest) {
  const configCheck = validateRouteSecurityConfig('applications');
  if (!configCheck.ok) return NextResponse.json({ error: configCheck.message }, { status: configCheck.status });

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }

  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;

  const limited = await enforceRateLimit(getClientIp(request), 'applications', 5, 15 * 60);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: limited.headers });
  }

  try {
    const parsed = applicationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please review the highlighted application details.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const db = await getMongoDb();
    const submittedAt = new Date();
    const agreementVersion = data.pathway === 'investment' ? 'investment-participation-v1' : 'community-code-of-conduct-v1';
    const agreementText = data.pathway === 'investment'
      ? 'I have read and agree to the SINet Participation Agreement. Returns are targets based on business performance, are not guaranteed, and are subject to SINet’s investment policy.'
      : 'I confirm that my details are accurate and agree to represent SINet’s community values. This registration is subject to review before role assignment is confirmed.';
    const agreementMeta = {
      acceptedAt: submittedAt.toISOString(),
      version: agreementVersion,
      textHash: createHash('sha256').update(agreementText).digest('hex'),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    };
    const application = {
      pathway: data.pathway,
      status: 'pending',
      data,
      agreementMeta,
      submittedAt,
      updatedAt: submittedAt,
    };
    const insert = await db.collection('applications').insertOne(application);

    await db.collection('members').updateOne(
      { email: data.email.toLowerCase() },
      {
        $set: { fullName: data.fullName, email: data.email.toLowerCase(), phone: data.phone, updatedAt: submittedAt },
        $setOnInsert: { createdAt: submittedAt, status: 'pending' },
        $addToSet: { pathways: data.pathway },
      },
      { upsert: true }
    );

    sendApplicationReceivedEmail({
      email: data.email,
      name: data.fullName,
      pathway: data.pathway as 'investment' | 'get-involved',
      tier: 'tier' in data ? String(data.tier) : undefined,
      plan: 'plan' in data ? String(data.plan) : undefined,
      role: 'role' in data ? String(data.role) : undefined,
    }).catch((err) => console.warn('Application received email failed:', err));

    return NextResponse.json({ success: true, applicationId: String(insert.insertedId) }, { status: 201 });
  } catch (error) {
    console.error('Application submission error:', error);
    const details = isDevelopmentMode() && error instanceof Error ? error.message : undefined;
    return NextResponse.json({ error: 'We could not save your application. Please try again.', ...(details ? { details } : {}) }, { status: 503 });
  }
}
