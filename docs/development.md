# Development Guide

Guide for local setup, testing, and adding features to the SINet public website.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Validation | Zod |
| Database | MongoDB (Atlas in prod; local Docker optional) |
| Email | Resend |
| Rate limiting | Upstash Redis (waitlist) + in-memory (contact/academy) |
| Security | CSRF, reCAPTCHA v3, origin allowlist, honeypot fields |

## Project layout

```
src/
├── app/                  # Pages and API routes (App Router)
│   ├── api/
│   │   ├── waitlist/     # Waitlist signup (CSRF + reCAPTCHA + Resend)
│   │   ├── contact/      # Contact form (MongoDB + email)
│   │   └── academy/      # Academy interest (MongoDB)
│   └── [pages]/          # Marketing pages
├── components/           # React components (ui, forms, layout, home, …)
├── lib/
│   ├── data/             # Static seed data (empires, reps, team)
│   ├── db/               # MongoDB client and queries
│   ├── email/            # Resend adapters
│   ├── runtime/          # env mode + security config guards
│   └── schemas/          # Zod schemas for API payloads
└── types/                # Shared TypeScript types

scripts/
├── setup.sh              # First-time project bootstrap
├── check-env.ts          # Validate environment variables
└── smoke-test.sh         # HTTP smoke tests against a running server
```

## Quick start

### 1. Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm 10+
- Optional: Docker (for local MongoDB)

### 2. Bootstrap

```bash
npm run setup
```

This installs dependencies, copies `.env.example` → `.env.local` if missing, and runs an environment check.

### 3. Configure environment

Edit `.env.local`. Three tiers of configuration:

**Tier A — Browse pages only** (no forms/API):

```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Tier B — Contact + Academy APIs** (needs MongoDB):

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=sinet
RESEND_API_KEY=<key>          # optional for email notifications
RESEND_FROM_EMAIL="SINet <noreply@sinet.africa>"
```

**Tier C — Full stack including waitlist**:

All of Tier B, plus:

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<site_key>
RECAPTCHA_SECRET_KEY=<secret_key>
CSRF_SECRET=<random_32+_chars>
EMAIL_SERVICE=resend
RESEND_AUDIENCE_ID=<audience_id>
UPSTASH_REDIS_REST_URL=<url>   # optional locally; rate limit skipped if unset
UPSTASH_REDIS_REST_TOKEN=<token>
```

Run `npm run check:env` anytime to see what's configured and what's missing.

### 4. Local MongoDB (optional)

```bash
docker compose up -d
```

Then set in `.env.local`:

```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=sinet
```

Seed static content (empires, reps, team, how-it-works steps):

```bash
npm run seed:db
```

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Common commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check (no emit) |
| `npm test` | Run Jest unit tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:ci` | Jest with coverage (CI) |
| `npm run check:env` | Validate env configuration |
| `npm run smoke` | Smoke-test API routes (server must be running) |
| `npm run seed:db` | Seed MongoDB with static content |
| `make help` | List all Makefile shortcuts |

Or use the Makefile:

```bash
make setup    # bootstrap
make dev      # start dev server
make check    # lint + typecheck + test
make ci       # full CI pipeline locally
```

## Testing

### Unit tests

Tests live next to source files as `*.test.ts`. Current coverage focuses on:

- Zod schemas (`src/lib/schemas/`, `src/lib/validation.ts`)
- Security config guards (`src/lib/runtime/securityConfig.ts`)
- Rate limiting (`src/lib/rate-limit.ts`)

```bash
npm test                  # run once
npm run test:watch        # watch mode
npm run test:ci           # with coverage report
```

### Smoke tests

With the dev or prod server running on port 3000 (or `SMOKE_BASE_URL`):

```bash
npm run smoke
# or against a custom port:
SMOKE_BASE_URL=http://localhost:3010 npm run smoke
```

### Manual form testing

1. **Waitlist** — requires reCAPTCHA keys + Resend + CSRF. Visit `/waitlist`, submit the form.
2. **Contact** — requires MongoDB. Visit `/contact`, submit the form. Check `contactMessages` collection.
3. **Academy** — requires MongoDB. Visit `/academy`, submit interest form. Check `academyInterests` collection.

In development, API errors include a `details` field with actionable hints. In production, errors are generic.

## Adding features

### New page

1. Create `src/app/<route>/page.tsx`
2. Add navigation link in `src/components/layout/Header.tsx` if needed
3. Update `src/app/sitemap.ts` if the page should be indexed

### New API route

1. Create `src/app/api/<name>/route.ts`
2. Add a Zod schema in `src/lib/schemas/`
3. Register required env vars in `src/lib/runtime/securityConfig.ts`
4. Add unit tests for the schema and any pure logic
5. Add a smoke check in `scripts/smoke-test.sh`

### New form

1. Schema in `src/lib/schemas/`
2. Form component in `src/components/forms/`
3. API route handler
4. Honeypot field (`website`) for bot filtering — follow existing forms

### Static content from code

Marketing data (empires, reps, team) lives in `src/lib/data/`. After editing, re-run `npm run seed:db` to sync MongoDB.

## CI

GitHub Actions runs on push/PR to `master`:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test:ci`
5. `npm run build`

Run the same locally with `make ci`.

## Admin dashboard

Content management lives in the `/admin` folder at project root. Routes are at `/admin` (login required).

```bash
# Set in .env.local
ADMIN_EMAIL=admin@sinet.africa
ADMIN_PASSWORD_HASH=<output of npx tsx scripts/hash-admin-password.ts "your-secure-password">
ADMIN_SESSION_SECRET=random-32-char-secret

# Seed CMS content to MongoDB
npm run seed:cms
```

Then visit [http://localhost:3000/admin](http://localhost:3000/admin).

See [admin/README.md](../admin/README.md) for full documentation.

## Deployment

Production runs on Vercel with MongoDB Atlas. See:

- [deployment-vercel-namecheap.md](./deployment-vercel-namecheap.md)
- [launch-runbook.md](./launch-runbook.md)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `querySrv ECONNREFUSED` connecting to Atlas | Set `MONGODB_URI_DIRECT` in `.env.local` with a non-SRV connection string |
| Waitlist returns 403 CSRF | `GET /api/waitlist` first to obtain a token before POST |
| Waitlist returns 403 origin | Ensure `NEXT_PUBLIC_SITE_URL` matches your local URL |
| Rate limit skipped locally | Normal — Upstash vars are optional; waitlist rate limit is disabled without them |
| `npm run seed:db` fails | Check `MONGODB_URI` and `MONGODB_DB`; try local Docker MongoDB |
