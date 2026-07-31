import { isDevelopmentMode, isProductionMode } from './envMode';

export type ApiRouteName = 'waitlist' | 'contact' | 'academy';

type CheckResult = {
  ok: boolean;
  status: number;
  message: string;
  details?: string;
};

function missingEnvVars(keys: string[]): string[] {
  return keys.filter((key) => !process.env[key] || !String(process.env[key]).trim());
}

function devOrProdMessage(missing: string[], route: ApiRouteName): CheckResult {
  if (missing.length === 0) {
    return { ok: true, status: 200, message: 'ok' };
  }

  if (isDevelopmentMode()) {
    return {
      ok: false,
      status: 500,
      message: 'Security configuration is incomplete for local development.',
      details: `Missing env vars for ${route}: ${missing.join(', ')}`,
    };
  }

  const isUpstashMissing = missing.includes('UPSTASH_REDIS_REST_URL') || missing.includes('UPSTASH_REDIS_REST_TOKEN');
  return {
    ok: false,
    status: isUpstashMissing ? 503 : 500,
    message: 'Service is not configured correctly.',
  };
}

export function validateRouteSecurityConfig(route: ApiRouteName): CheckResult {
  // In development we still validate so failures are explicit and actionable.
  // In production this becomes a strict guard.
  const routeRequired: Record<ApiRouteName, string[]> = {
    waitlist: [
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
      'RECAPTCHA_SECRET_KEY',
      'EMAIL_SERVICE',
      'RESEND_API_KEY',
      'RESEND_AUDIENCE_ID',
    ],
    contact: ['MONGODB_URI', 'MONGODB_DB', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
    academy: ['MONGODB_URI', 'MONGODB_DB'],
  };

  const required = [...routeRequired[route]];
  if (isProductionMode()) {
    required.push('UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN');
  }

  const missing = missingEnvVars(required);
  return devOrProdMessage(missing, route);
}

