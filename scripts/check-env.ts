/**
 * Validates environment configuration for local development.
 * Run: npm run check:env
 */
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');

// Mirror Next.js env loading: .env first, then .env.local overrides.
for (const file of ['.env', '.env.local']) {
  const path = resolve(root, file);
  if (existsSync(path)) {
    config({ path, override: true });
  }
}

type Tier = 'pages' | 'contact' | 'waitlist' | 'admin';

const tiers: Record<Tier, { label: string; vars: string[]; anyOf?: string[][] }> = {
  pages: {
    label: 'Browse pages (static site)',
    vars: ['NEXT_PUBLIC_SITE_URL'],
  },
  contact: {
    label: 'Contact + Academy APIs',
    vars: ['MONGODB_URI', 'MONGODB_DB', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'AUTH_FROM_EMAIL'],
  },
  waitlist: {
    label: 'Full stack (waitlist form)',
    vars: [
      'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
      'RECAPTCHA_SECRET_KEY',
      'EMAIL_SERVICE',
      'RESEND_AUDIENCE_ID',
    ],
  },
  admin: {
    label: 'Admin dashboard + CMS',
    vars: ['ADMIN_EMAIL', 'ADMIN_SESSION_SECRET', 'MONGODB_URI', 'MONGODB_DB'],
    anyOf: [['ADMIN_PASSWORD', 'ADMIN_PASSWORD_HASH']],
  },
};

const optional = [
  'CSRF_SECRET',
  'ADMIN_TOTP_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'MONGODB_URI_DIRECT',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'NEXT_PUBLIC_FACEBOOK_PIXEL_ID',
  'ADMIN_PASSWORD_HASH',
  'ADMIN_NOTIFY_EMAIL',
];

function isSet(key: string): boolean {
  const value = process.env[key];
  return Boolean(value && String(value).trim() && !value.includes('<'));
}

function checkTier(tier: Tier) {
  const { label, vars, anyOf } = tiers[tier];
  const missing = vars.filter((v) => !isSet(v));
  const missingAnyOf = anyOf?.filter((group) => !group.some(isSet)).map((group) => group.join(' or ')) ?? [];
  const ready = missing.length === 0 && missingAnyOf.length === 0;
  return { tier, label, missing, missingAnyOf, ready };
}

console.log('\nSINet environment check\n');
console.log(`NODE_ENV: ${process.env.NODE_ENV ?? '(not set)'}`);
const envFiles = ['.env', '.env.local'].filter((f) => existsSync(resolve(root, f)));
console.log(`Env files: ${envFiles.length ? envFiles.join(', ') : '(none found)'}\n`);

const results = (Object.keys(tiers) as Tier[]).map(checkTier);

for (const { label, missing, missingAnyOf, ready } of results) {
  const status = ready ? '✓' : '✗';
  console.log(`${status} ${label}`);
  if (!ready) {
    if (missing.length) console.log(`    Missing: ${missing.join(', ')}`);
    if (missingAnyOf.length) console.log(`    Missing (one required): ${missingAnyOf.join('; ')}`);
  }
}

const optionalSet = optional.filter(isSet);
const optionalUnset = optional.filter((v) => !isSet(v));
console.log('\nOptional:');
console.log(`  Set:    ${optionalSet.length ? optionalSet.join(', ') : '(none)'}`);
console.log(`  Unset:  ${optionalUnset.join(', ')}`);

const maxTier = results.filter((r) => r.ready).pop();
console.log('\n---');
if (maxTier?.tier === 'admin') {
  console.log('Ready for admin CMS + full local development.');
} else if (maxTier?.tier === 'waitlist') {
  console.log('Ready for full local development (all forms). Admin needs ADMIN_EMAIL + password hash/plain.');
} else if (maxTier?.tier === 'contact') {
  console.log('Ready for contact/academy APIs. Waitlist needs reCAPTCHA + CSRF + Resend audience.');
} else if (maxTier?.tier === 'pages') {
  console.log('Ready to browse pages. Configure MongoDB and email for form APIs.');
} else {
  console.log('Copy .env.example to .env.local and fill in values.');
  console.log('  cp .env.example .env.local');
}

console.log('');
process.exit(maxTier ? 0 : 1);
