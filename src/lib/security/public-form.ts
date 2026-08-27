import { NextRequest, NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { verifyCsrfToken } from '@/lib/security/csrf-handler';
import { validateOrigin } from '@/lib/security/origin';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit-unified';
import { isDevelopmentMode } from '@/lib/runtime/envMode';
import {
  validateRouteSecurityConfig,
  type ApiRouteName,
} from '@/lib/runtime/securityConfig';

export function publicFormError(message: string, details?: string) {
  if (isDevelopmentMode() && details) {
    return { error: message, details };
  }
  return { error: message };
}

export function mapZodFieldErrors(error: ZodError): Record<string, string> {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const key = issue.path.join('.') || 'form';
    if (!acc[key]) acc[key] = issue.message;
    return acc;
  }, {});
}

export type PublicFormGuardOptions = {
  routeKey: ApiRouteName;
  rateLimitPrefix: string;
  maxRequests: number;
  windowSeconds: number;
};

/**
 * Shared public form guards: security config → origin → CSRF → rate limit.
 * Returns null when all checks pass.
 */
export async function enforcePublicFormGuards(
  request: NextRequest,
  options: PublicFormGuardOptions
): Promise<NextResponse | null> {
  const configCheck = validateRouteSecurityConfig(options.routeKey);
  if (!configCheck.ok) {
    return NextResponse.json(
      publicFormError(configCheck.message, configCheck.details),
      { status: configCheck.status }
    );
  }

  if (!validateOrigin(request)) {
    return NextResponse.json(
      publicFormError(
        'Forbidden origin.',
        'Request origin or referer is not in the allowed origins list.'
      ),
      { status: 403 }
    );
  }

  const csrf = await verifyCsrfToken(request);
  if (!csrf.ok) return csrf.response;

  const limited = await enforceRateLimit(
    getClientIp(request),
    options.rateLimitPrefix,
    options.maxRequests,
    options.windowSeconds
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: limited.headers }
    );
  }

  return null;
}

/** Soft honeypot: if `website` is filled, treat as success without processing. */
export function isHoneypotTriggered(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const website = (body as Record<string, unknown>).website;
  return typeof website === 'string' && website.length > 0;
}

export function parseWithZod<T>(
  schema: ZodType<T>,
  body: unknown
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Please review the highlighted fields.',
          errors: mapZodFieldErrors(parsed.error),
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
