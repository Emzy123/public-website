# SINet Public Website

Marketing and waitlist website for SINet, built with Next.js 14, TypeScript, Tailwind CSS, Zod, and secure API controls.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Security Features

- Security headers configured in `next.config.mjs`
- CSRF validation via `@edge-csrf/nextjs`
- Rate limiting (5 requests/minute/IP) via Upstash
- reCAPTCHA v3 verification on waitlist submissions
- Origin allowlist validation for waitlist API
- Zod validation on client and server
- Honeypot field for bot filtering

## Required Environment Variables

See `.env.example` for all keys:

- `EMAIL_SERVICE_API`
- `EMAIL_SERVICE_KEY`
- `EMAIL_LIST_ID`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- `RECAPTCHA_SECRET_KEY`
- `CSRF_SECRET`
- `NEXT_PUBLIC_SITE_URL`

## Deployment (Vercel + Namecheap)

1. Push to GitHub and import into Vercel
2. Add all environment variables in Vercel
3. Deploy and attach `sinet.africa`
4. Configure Namecheap DNS:
   - `A @ -> 76.76.21.21`
   - `CNAME www -> cname.vercel-dns.com`
5. Enable DNSSEC in Namecheap:
   - Domain dashboard -> Advanced DNS -> DNSSEC -> Enable
6. Verify headers:
   - `curl -I https://sinet.africa`
