# SINet Public Website

Production web platform and public marketing website for SINet (Student Investment Network / Sustainable Impact Network), built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **MongoDB**, **Zod**, and robust security controls. Deployed on **Vercel** at [https://www.sinet.africa](https://www.sinet.africa).

---

## 1. Prerequisites

- **Node.js**: `v20.x` or higher (verified with Node 20 / 22; `.nvmrc` targets `20`)
- **Package Manager**: `npm` (uses `package-lock.json`)
- **Docker & Docker Compose** (Optional): For running local MongoDB (`docker compose up -d`)

---

## 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/<org>/sinet.git
cd sinet
npm install
```

> **Note**: If you encounter a `SIGBUS` or `Bus error` during build on Linux x64, ensure `@next/swc-linux-x64-gnu` is not truncated (unpacked binary should be ~131MB). Reinstall with `npm install --force` or fetch the package directly.

---

## 3. Environment Configuration

1. Copy the template to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. By default, `.env.local` is pre-populated with safe local development placeholders (fallback test keys, local MongoDB uri `mongodb://localhost:27017`, and local admin credentials).
3. Validate your environment tiers anytime:
   ```bash
   npm run check:env
   ```

### Fetching Production / Staging Secrets from Vercel

To pull configured environment variables directly from Vercel:

```bash
# Link project to Vercel
npx vercel link

# Pull environment variables into .env.local
npx vercel env pull .env.local
```

### Essential Environment Variables

| Variable | Purpose | Local Default | Production Impact if Missing |
|----------|---------|---------------|------------------------------|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, sitemap, metadataBase, CSRF validation | `http://localhost:3000` | CSRF origin checks fail |
| `MONGODB_URI` / `MONGODB_DB` | Primary database for CMS, applications, team, reps | `mongodb://localhost:27017` / `sinet` | Form submissions fail (500); CMS uses static defaults |
| `ADMIN_EMAIL` | Admin login email for `/admin/login` | `admin@sinet.africa` | Cannot authenticate to `/admin` |
| `ADMIN_PASSWORD_HASH` | Scrypt hash (`<salt>:<hash>`) for admin login | Safe dev hash (`admin123456`) | Cannot authenticate to `/admin` |
| `ADMIN_SESSION_SECRET` | 32+ char secret for admin session JWT cookies | `local_dev_admin_session_secret...` | Admin session cookies cannot be signed |
| `ADMIN_TOTP_SECRET` | Base32 secret for Admin MFA (Authenticator app) | (empty locally) | Admin login blocked in production |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v3 public site key | Google test key | Waitlist bot check widget fails |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v3 private secret key | Google test secret | Waitlist form submission fails (400) |
| `RESEND_API_KEY` | Transactional email provider API key | Placeholder | Outgoing emails fail |
| `RESEND_AUDIENCE_ID` | Waitlist audience list ID | Placeholder | Waitlist subscriptions not stored in Resend |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Distributed sliding-window rate limiting | (empty locally) | **Forms fail closed (503)** in production |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 stream ID | (empty) | Analytics disabled |

> **Super Admin Auto-Provisioning**: On first OTP verification, the account matching `ADMIN_EMAIL` (matched case-insensitively) is automatically provisioned as `super_admin`. This event is permanently recorded in the audit log as `admin.provision_super_admin`.

---

## 4. Database Setup & Seeding

The application connects to MongoDB using the native driver (`src/lib/db/mongodb.ts`).

### Running Local MongoDB

To launch a local MongoDB container:

```bash
docker compose up -d
```

### Seeding Initial Data

Run the database and CMS seed scripts:

```bash
# Seed initial empires, reps, team, and how-it-works content
npm run seed:db

# Seed CMS page defaults (home, about, sectors, gallery, etc.)
npm run seed:cms
```

*Note: In local development, if MongoDB is unreachable, public pages gracefully fall back to built-in default content.*

---

## 5. Development & Testing Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js development server at [http://localhost:3000](http://localhost:3000) |
| `npm run typecheck` | Run TypeScript type-checking (`tsc --noEmit`) |
| `npm run lint` | Run ESLint across `src/` and `admin/` |
| `npm test` | Run Jest unit and security tests |
| `npm run test:watch` | Run Jest in interactive watch mode |
| `npm run check:env` | Validate current `.env.local` against required tiers |
| `npm run smoke` | Run API smoke tests against a running server |

---

## 6. Production Build

To build and verify the production bundle:

```bash
npm run build
```

This compiles all routes and automatically triggers `postbuild` (`next-sitemap`), generating:
- `public/sitemap.xml`
- `public/sitemap-0.xml`
- `public/robots.txt`

To test the production build locally:

```bash
npm run start
```

---

## 7. Deployment (Vercel + DNS)

1. **Vercel Project Setup**:
   - Import repository into Vercel.
   - Configure all environment variables in **Project Settings > Environment Variables**.
2. **Domain Routing**:
   - Add `www.sinet.africa` (Primary domain).
   - Add `sinet.africa` and configure a **301 Permanent Redirect** to `www.sinet.africa`.
3. **DNS Configuration (Namecheap)**:
   - `A @ -> 76.76.21.21`
   - `CNAME www -> cname.vercel-dns.com`
   - Enable DNSSEC in domain management.
4. **Health Verification**:
   - Verify health check endpoint: `curl https://www.sinet.africa/api/health`
