# SINet Public Website

Marketing and waitlist website for SINet, built with Next.js 14, TypeScript, Tailwind CSS, Zod, and secure API controls.

## Quick Start

```bash
npm run setup    # install deps, create .env.local, check config
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

For the full development guide (architecture, testing, adding features), see [docs/development.md](docs/development.md).

## Security Features

- Security headers configured in `next.config.mjs`
- CSRF validation via `@edge-csrf/nextjs`
- Rate limiting (5 requests/minute/IP) via Upstash
- reCAPTCHA v3 verification on waitlist submissions
- Origin allowlist validation for waitlist API
- Zod validation on client and server
- Honeypot field for bot filtering

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm test` | Run unit tests |
| `npm run check:env` | Validate environment setup |
| `npm run smoke` | Smoke-test API routes (server must be running) |
| `make help` | List all Makefile shortcuts |

## Required Environment Variables

See `.env.example` for all keys. Run `npm run check:env` to see what's configured.

Key variables:

- `MONGODB_URI` / `MONGODB_DB` — contact and academy forms
- `RESEND_API_KEY` / `RESEND_AUDIENCE_ID` — waitlist email
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` — waitlist bot protection
- `CSRF_SECRET` — waitlist CSRF tokens
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — waitlist rate limiting (optional locally)
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
