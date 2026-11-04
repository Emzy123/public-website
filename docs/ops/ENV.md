# Production environment variables

Names and purpose only. Never commit values.

## Required (fatal or hard-fail without these in production)

| Name | Purpose |
|------|---------|
| `AUTH_SECRET` | Signs/verifies member session JWTs. Fatal at boot if missing in production. |
| `DATABASE_URL` | Pooled Postgres connection string. Fatal at boot if missing in production. Use verified TLS. |
| `ADMIN_EMAIL` | Sole env admin login identity (expected `admin@sinet.africa`). |
| `ADMIN_PASSWORD_HASH` | Scrypt `salt:hash` for admin password. |
| `ADMIN_SESSION_SECRET` | Signs admin session JWT cookie. |
| `ADMIN_TOTP_SECRET` | Base32 TOTP secret for admin 2FA (fails closed without it in production). |
| `AUTH_FROM_EMAIL` | Resend From header, e.g. `SINet <no-reply@sinet.africa>`. Required when sending email. |
| `RESEND_API_KEY` | Resend API key for OTP / transactional mail. |
| `MONGODB_URI` | MongoDB Atlas URI (CMS, legacy applications/members). |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin (`https://sinet.africa` or `https://www.sinet.africa`). |

## Strongly recommended

| Name | Purpose |
|------|---------|
| `DATABASE_CA_CERT` | Optional PEM CA for Postgres certificate verification. |
| `HEALTH_CHECK_TOKEN` | Bearer for detailed `/api/health` dependency checks. |
| `MONGODB_DB` | Mongo database name (default `sinet`). |
| `UPSTASH_REDIS_REST_URL` | Rate limiting backend. |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting auth. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | reCAPTCHA v3 site key. |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA v3 secret. |
| `CSRF_SECRET` | CSRF token signing. |
| `MEDIA_SIGNING_SECRET` | Signed media/preview URLs. |
| `ADMIN_NOTIFY_EMAIL` | Ops notification recipient. |
| `RESEND_FROM_EMAIL` | Alternate From if distinct from `AUTH_FROM_EMAIL`. |
| `RESEND_AUDIENCE_ID` | Waitlist audience. |
| `RESEND_CONTACT_TO_EMAIL` | Contact form destination (defaults to `hello@sinet.africa`). |

## Development-only

| Name | Purpose |
|------|---------|
| `DEV_LOG_OTP` | Set to `1` with `NODE_ENV=development` to print OTP/magic-link codes. Never in production. |
| `ADMIN_PASSWORD` | Local plaintext admin password fallback. Never in production. |

## Resend domain verification (sinet.africa)

Use Resend’s own DNS records from the Resend dashboard → Domains → `sinet.africa`. Typical records:

1. **DKIM** — Resend-provided CNAME(s) (or TXT) for the domain’s DKIM selectors.
2. **SPF for the sending subdomain / Resend include** — add Resend’s SPF/include as instructed for the mail From domain. **Do not rewrite or remove the existing root domain SPF** used for other mail; add Resend’s record on the hostname Resend specifies (often a subdomain or an include alongside existing mechanisms only when Resend’s UI says so).
3. **Optional DMARC** — if Resend shows a DMARC TXT, add it at `_dmarc` only if it does not conflict with an existing org DMARC policy (confirm with whoever owns DNS).

After DNS propagates, click Verify in Resend. OTP sign-in stays broken until the domain is verified and `AUTH_FROM_EMAIL` uses that domain.
