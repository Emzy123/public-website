# SINet Deployment Guide (Vercel + Namecheap)

## 1. Prerequisites

- Vercel account with access to the `sinet` project.
- Namecheap access for `sinet.africa`.
- Production MongoDB Atlas cluster and credentials.
- Resend domain verified and API key available.
- GA4 property and measurement ID.

## 2. Environment Variables (Vercel)

Set these in Vercel Project Settings -> Environment Variables:

- `NODE_ENV=production` (Vercel sets this automatically for production)
- `NEXT_PUBLIC_SITE_URL=https://sinet.africa`
- Admin dashboard (required for `/admin`):
- `ADMIN_EMAIL=admin@sinet.africa`
- `ADMIN_PASSWORD_HASH=...` (generate with `npx tsx scripts/hash-admin-password.ts "your-password"`)
- `ADMIN_SESSION_SECRET=...` (generate with `openssl rand -base64 32`)
- `ADMIN_TOTP_SECRET=...` (**required in production** — authenticator app TOTP secret)
- MongoDB (required by `POST /api/contact` and `POST /api/academy`):
- `MONGODB_URI=...`
- `MONGODB_DB=sinet`
- Waitlist security (required by `POST /api/waitlist`):
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...` (reCAPTCHA **v3**)
- `RECAPTCHA_SECRET_KEY=...`
- `EMAIL_SERVICE=resend`
- `RESEND_API_KEY=...`
- `RESEND_AUDIENCE_ID=...`
- `RESEND_FROM_EMAIL=...`
- `RESEND_CONTACT_TO_EMAIL=contact@sinet.africa`
- Rate limiting (**required in production** — Upstash Redis; forms fail closed without it):
- `UPSTASH_REDIS_REST_URL=...`
- `UPSTASH_REDIS_REST_TOKEN=...`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`
- Optional:
  - `CSRF_SECRET` (not used by `@edge-csrf`; optional preview signing fallback)
  - `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`
  - `NEXT_PUBLIC_SOCIAL_X_URL`
  - `NEXT_PUBLIC_SOCIAL_LINKEDIN_URL`
  - `NEXT_PUBLIC_SOCIAL_FACEBOOK_URL`

## 3. Vercel Project Setup

1. Import repo into Vercel.
2. Framework: Next.js.
3. Build command: `npm run build`.
4. Output: default Next.js output.
5. Deploy main branch to production.

## 4. Namecheap DNS -> Vercel

In Namecheap Advanced DNS:

- `A` record:
  - Host: `@`
  - Value: `76.76.21.21`
  - TTL: Automatic
- `CNAME` record:
  - Host: `www`
  - Value: `cname.vercel-dns.com`
  - TTL: Automatic

Then in Vercel Domains:

1. Add `sinet.africa`.
2. Add `www.sinet.africa`.
3. Wait for verification.
4. Set `sinet.africa` as primary and enforce redirect from `www`.

## 5. SSL Verification

- Confirm certificate status is "Valid" in Vercel.
- Verify `https://sinet.africa` and `https://www.sinet.africa` load with no warnings.

## 6. Post-Deploy Smoke Tests

- Home/About/Sectors/Academy/Waitlist/Contact load.
- Waitlist submit stores data and redirects to success page.
- Contact submit stores data and sends notification email.
- Academy submit stores interest.
- `/robots.txt` and `/sitemap.xml` are reachable.
- Sign in at `/admin` with the configured admin account.
