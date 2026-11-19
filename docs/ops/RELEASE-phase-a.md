# Phase A Production Release Checklist & Runbook

This document details the release checklist, required environment variables, verification commands, and rollback procedures for shipping Phase A (`agent/phase-a-security` and its follow-ups) into `master` via pull request.

---

## 1. Commits Included in Release (origin/master 5236120 -> HEAD)

The following 49 commits encompass Phase A security gates, resilience enhancements, operational tooling, and release-prep verifications:

```text
3d7c86c docs(agent): record Phase A release prep summary in PROGRESS.md (7)
d8c0133 docs(ops): update commit list with latest typecheck fix in release checklist (7)
fabb605 fix(test): resolve typecheck errors in test env assertions and auth me handler (8)
f7e5b52 docs(ops): update Phase A release checklist with Upstash requirement, outage matrix, and PR workflow (6, 7)
b8c7d77 chore(docker): add dev-only redis and serverless-redis-http services to docker-compose (3)
b1f7cce test(jest): manage database client teardown in globalTeardown without forceExit (5)
5cad534 fix(seed): guard seed execution against non-local/production and neutralize seed wording (2)
1c59300 fix(db): restrict docker service hostnames as local to non-production only (4)
c3db11f fix(api): eliminate internal database error and reason text from public responses (1)
f3a7f9a docs(ops): include final verification commit in release checklist (7)
c21fcc5 docs(agent): finalize Phase A follow-ups verification summary and checklist (7)
308b4aa test(db): fix it.each callback signature type in hostname match test (1)
171efbe docs(ops): create Phase A release checklist and runbook (7)
e786f07 docs(agent): scope PROGRESS.md to Phase A on this branch (6)
03f0234 docs(auth): document session TTL and cross-instance revocation window during Postgres outage (5)
c86634d fix(db): remove duplicate export of createPostgresClient and isLocalDatabaseHost (1)
5fd9b20 test(db): auto-seed local test database in globalSetup and skip if absent (3)
06eb394 fix(rate-limit): use trusted right-most IP or platform header to prevent spoof bypass (4)
ac4a944 test(db): assert driver-resolved rejectUnauthorized and exact local hostname matching (1)
99a8b3a docs(agent): update PROGRESS.md with reality, Phase C rows, and e0e27da0 fix (10)
34c46a0 docs(verify): document rate limit counter store and serverless semantics (8)
5922fc7 test(auth): verify cross-instance revocation dependency on Postgres sessions table (7)
a53aa8a test(auth): prove no OTP or magic link is logged when NODE_ENV is production (9)
746662f test(db): verify rejectUnauthorized with require, verify-full, and CA cert (3)
58f3b6e chore(docker): add dev-only postgres service to docker-compose (1)
0f305b9 docs(agent): record Phase A DoD results and summary (A1-A12)
eca1b8a fix(auth): avoid Map iterator for session denylist prune under TS target (A11)
24c115e docs(ops): list production env vars and Resend DNS verification steps (A12)
c9704e6 feat(auth): revoke member JWT on logout via jti denylist and sessions table (A11)
10283d0 docs(ops): add manual db:migrate baseline plan for push-created DBs (A9)
78003e3 docs(ops): document authorized /api/health Postgres ping usage (A7)
6cba401 docs(ops): prove postgres ssl require skips verify; keep rejectUnauthorized true (A2)
79913a6 docs(agent): record A1 git diagnostics and confirm security commit history (A1)
8b8032e docs(agent): add HARD RULES, PROGRESS, BLOCKERS, and COPY_REVIEW (phase-0)
9378622 feat(admin): add edit link roles control with staff invite-only server enforcement and audit logging
2fa2faa fix(links): unify link accepting and status calculation between admin UI and public join API
0e27da0 fix(auth): structured logging and admin health diagnostics for OTP sign-in delivery failures
5062ffb test(chapters): verify chapter join links routing through /join with role and chapter params
2dd6351 feat(compliance): gate unsigned financial claims and scale stats behind feature flag
5c614ac docs: document membership Postgres boot behavior and manual db:migrate
fd811d0 ci: pin Actions to commit SHAs, set contents:read, and smoke without repository secrets
e4b4826 fix(runtime): require AUTH_SECRET and DATABASE_URL at boot and ping Postgres with a timeout
8917588 fix(auth): fail closed on incomplete member 2FA and stop logging OTP codes by default
5620e59 fix(security): enforce verified TLS with custom CA support, fail closed on stale-Mongo 2FA, and assert JWT-only roles
ea09959 docs(deployment): document production Postgres pooling and SSL requirements
c042a6d feat(integrity): structured fallback audit logging and database reconciliation guide
016dafa fix(availability): graceful fallbacks and 503 handling for /me, /verify, 2FA, apply, and admin applications
c58f0c2 fix(security): prevent 2FA bypass in Mongo fallback, restrict fallback JWT roles to member, and enforce verified TLS
8a09f8b feat(capacity-audit): report sanitized database error diagnosis without leaking credentials
```

---

## 2. Boot Environment Variables (Fatal if Missing in Production)

The Next.js application enforces strict boot-time assertions in `src/lib/runtime/securityConfig.ts` and `src/lib/auth/session.ts`. If any required boot variable is missing, the server process exits immediately or throws a fatal error:

| Variable Name | Required At Boot | Fatal in Production? | Description & Failure Behavior |
|---|---|---|---|
| `AUTH_SECRET` | Yes | **Fatal** | Secret key (minimum 32 characters) for signing member and fallback session JWTs. If missing or shorter than 32 characters, throws fatal exception and halts server startup. |
| `DATABASE_URL` | Yes | **Fatal** | Connection string for PostgreSQL database. If missing or empty in production, throws fatal exception and halts server startup. Must specify `sslmode=verify-full`. |
| `NEXT_PUBLIC_SITE_URL` | Yes | Non-fatal (Warns) | Canonical site domain. Warns if missing or if protocol is not `https://` in production. |
| `ADMIN_TOTP_SECRET` | Recommended | Non-fatal (Warns) | MFA secret for admin console sign-in. If absent, logs warning during boot; admin console authentication requires MFA setup. |

---

## 3. Hard Precondition: Upstash Redis & Full Functionality Env Vars

In production, **Upstash Redis is a hard precondition**. Without configured Upstash Redis REST credentials, distributed rate limiting across serverless instances fails closed with HTTP 429 for public endpoints, and campaign application submissions fail closed with HTTP 503.

| Variable Name | Purpose | Recommended Setting / Requirement |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint (**Hard Precondition**) | REST URL (e.g. `https://<db>.upstash.io`). Required for rate limiting across serverless instances. |
| `UPSTASH_REDIS_REST_TOKEN`| Upstash Redis REST token (**Hard Precondition**) | Bearer token for Upstash Redis REST access. |
| `DATABASE_URL` | Primary PostgreSQL database connection | Pooled connection string with `sslmode=verify-full`. |
| `DATABASE_CA_CERT` | Custom CA root certificate | PEM certificate content (required if cloud provider uses private/custom root CA). |
| `RESEND_API_KEY` | Transactional email provider API key | Resend API key for delivering OTP codes and application receipts. |
| `AUTH_FROM_EMAIL` | Transactional sender address | Must match verified domain in Resend (e.g. `SINet <auth@sinet.africa>`). |
| `HEALTH_CHECK_TOKEN` | Authorized monitoring diagnostic token | High-entropy secret for deep `/api/health` diagnostics. |
| `MONGODB_URI` | Secondary document storage | MongoDB Atlas connection string for CMS, fallback logs, and backups. |

---

## 4. Unified Rate-Limit Inventory & Production Behavior Without Upstash

Every protected endpoint uses the unified rate-limiting engine (`src/lib/security/rate-limit-unified.ts`). In production, if Upstash Redis credentials are absent, public routes **fail closed** to prevent brute-force attacks across serverless instances, while admin login provides an in-memory fallback to avoid total operator lockout:

| Route / Operation | Key Prefix | Max Requests | Window (Sec) | Production Behavior Without Upstash |
|---|---|---|---|---|
| `POST /api/auth/request-otp` | `member-auth-otp` | 3 req | 600s (10 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/auth/verify-otp` | `member-verify-otp` | 5 req | 300s (5 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/auth/verify-2fa` | `member-2fa` | 5 req | 300s (5 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/admin/auth/login` | `admin-login` | 5 req | 900s (15 min) | **In-memory fallback**: Sliding window limiter prevents admin lockout during Upstash outage |
| Admin MFA (Step 2 TOTP) | `admin-login` | 5 req | 900s (15 min) | Governed under unified admin login attempt limiter; falls back to in-memory window |
| Magic Link Request | `member-auth-otp` | 3 req | 600s (10 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `GET /api/verify/[memberId]` | `verify-member-credential` | 60 req | 60s (1 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/join/[slug]/apply` | `join-applications` | 10 req | 900s (15 min) | **Fails closed**: HTTP 503 (`Service is not configured correctly.`) via securityConfig guard |
| `POST /api/join/[slug]/documents` | `join-documents` | 10 req | 900s (15 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/waitlist` | `waitlist-submissions` | 5 req | 600s (10 min) | **Fails closed**: HTTP 429 / securityConfig HTTP 503 |
| `POST /api/contact` | `contact-submissions` | 5 req | 600s (10 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/academy` | `academy-submissions` | 5 req | 600s (10 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/applications/notify` | `apply-notify` | 5 req | 900s (15 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/admin/registration-links`| `admin-link-create` | 10 req | 60s (1 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `PUT /api/admin/content/[key]` | `admin-draft-save` | 30 req | 60s (1 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/admin/content/[key]/publish` | `admin-publish` | 5 req | 300s (5 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/admin/media` | `admin-media-upload` | 12 req | 60s (1 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/admin/content/adverts/legal-approval` | `admin-advert-legal-approval` | 10 req | 300s (5 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/posts` | `create-post` | 5 req | 600s (10 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/posts/[slug]/report` | `report-post` | 5 req | 900s (15 min) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |
| `POST /api/pulse/check-in` | `pulse-check-in` | 10 req | 3600s (1 hr) | **Fails closed**: HTTP 429 (`Retry-After: 60`) |

---

## 5. Apply Route 503 Configuration Dependency

When a user submits an application via `POST /api/join/[slug]/apply`, the request passes through `enforcePublicFormGuards` before accessing the campaign data:

```ts
// src/app/api/join/[slug]/apply/route.ts:41-47
const blocked = await enforcePublicFormGuards(request, {
  routeKey: 'applications',
  rateLimitPrefix: 'join-applications',
  maxRequests: 10,
  windowSeconds: 15 * 60,
});
if (blocked) return blocked;
```

Inside `enforcePublicFormGuards` (`src/lib/security/public-form.ts:42-48`), the configuration validator checks required environment variables:

```ts
// src/lib/runtime/securityConfig.ts:52-61
applications: ['MONGODB_URI', 'MONGODB_DB', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
...
const required = [...routeRequired[route]];
if (isProductionMode()) {
  required.push('UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN');
}

const missing = missingEnvVars(required);
return devOrProdMessage(missing, route);
```

The check that returns `"Service is not configured correctly."`:

```ts
// src/lib/runtime/securityConfig.ts:30-35
const isUpstashMissing = missing.includes('UPSTASH_REDIS_REST_URL') || missing.includes('UPSTASH_REDIS_REST_TOKEN');
return {
  ok: false,
  status: isUpstashMissing ? 503 : 500,
  message: 'Service is not configured correctly.',
};
```

**Configuration Dependency:** In production mode, if `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is missing, the apply route returns `HTTP 503` with `{ error: "Service is not configured correctly." }`. If any core email or database variables are missing, it returns `HTTP 500`.

---

## 6. Admin Capabilities & Outage Matrix During PostgreSQL Downtime

The following matrix documents what an admin can and cannot do during a PostgreSQL outage:

| Admin Functionality | Status During Postgres Outage | Mechanism / Handling |
|---|---|---|
| **Admin Login Page** (`GET /admin/login`) | **AVAILABLE (HTTP 200)** | Next.js server-renders login page without DB query |
| **Admin Authentication** (`POST /api/admin/auth/login`) | **AVAILABLE (HTTP 200)** | Credentials verified via scrypt hash and TOTP MFA in memory; session JWT issued |
| **Admin In-Memory Rate Limiting** | **AVAILABLE** | Admin login exempt from production Upstash fail-closed gate; uses local sliding window |
| **Admin Password & MFA Validation** | **AVAILABLE** | Uses `ADMIN_PASSWORD_HASH` and `ADMIN_TOTP_SECRET` env vars |
| **CMS Content Editing** | **AVAILABLE** | Content cached in MongoDB / memory remains editable |
| **System Diagnostics** (`/api/health`) | **AVAILABLE** | Deep diagnostic with `x-health-token` reports component breakdown |
| **Review Postgres Applications** (`/admin/applications/[id]`) | **UNAVAILABLE (HTTP 503)** | Fails closed with `{ error: "database_unavailable" }` |
| **Approve / Reject Applications** (`/admin/applications/[id]/review`) | **UNAVAILABLE (HTTP 503)** | Fails closed with `{ error: "database_unavailable" }` |
| **Institutional Audit Log** (`GET /api/admin/audit`) | **UNAVAILABLE (HTTP 503)** | Fails closed with `{ error: "Institutional audit log is temporarily unavailable..." }` |
| **Audit Log DB Writes** | **DEGRADED (Logged)** | Falls back to MongoDB or structured server logs with zero secrets |
| **Member 2FA Elevation** (`/api/auth/verify-2fa`) | **UNAVAILABLE (HTTP 503)** | Fails closed with `{ error: "Authentication service temporarily unavailable..." }` |
| **Cross-Instance Session Revocation** | **DEGRADED (Process-local)** | Process-local denylist active; other instances retain validity until JWT expiration |

---

## 7. Expected Behavior If Services or Variables Are Missing

| Missing Variable / Service | Platform Impact & Failure Mode |
|---|---|
| `AUTH_SECRET` | **Fatal Crash**: Server cannot boot; all requests fail. |
| `DATABASE_URL` | **Fatal Crash**: Server cannot boot; all requests fail. |
| `DATABASE_URL` (Unreachable Host) | **Graceful Degradation**: Server boots; public pages return `HTTP 200`; public `/api/health` returns `200`; authorized health probe returns `HTTP 503`; member API endpoints return `HTTP 503`; member 2FA fails closed; `/api/auth/me` returns `HTTP 401` when signed out. |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | **Fail-Closed Rate Limiting**: In production mode, public rate limiting fails closed with `HTTP 429`. Campaign apply fails closed with `HTTP 503` (`Service is not configured correctly.`). Admin login remains accessible via in-memory limiter. |
| `RESEND_API_KEY` | **Sign-In Unavailable**: OTP request API fails; OTP codes are never logged in production. `/api/health` reports email as degraded. |
| `AUTH_FROM_EMAIL` (with `RESEND_API_KEY`) | **Health Check 503**: Misconfiguration triggers `emailMissingFrom` guard; authorized `/api/health` returns `HTTP 503 unhealthy`. |
| `HEALTH_CHECK_TOKEN` | **Public View Only**: Deep dependency breakdown (`mongo`, `postgres`, `redis`, `email`, `authOtp`) is withheld from callers; `/api/health` returns `{ ok: true, status: "healthy" }`. |
| `DATABASE_CA_CERT` (if host has private CA)| **TLS Handshake Error**: If `DATABASE_URL` uses a host whose CA is not in Node's default CA bundle, connections fail with TLS verification error (rejectUnauthorized remains `true`). |

---

## 8. Uptime Monitoring Note (Authorized Token Health Probe)

> [!IMPORTANT]
> **Use the Authorized Health Token Probe for synthetic monitoring, NOT public `/api/health`.**
> 
> The public unauthenticated `GET /api/health` endpoint returns `HTTP 200 { ok: true, status: "healthy" }` even during a database or email degradation to avoid exposing internal infrastructure outages to unauthenticated visitors and automated scrapers.
> 
> Synthetic monitors (e.g. BetterStack, Datadog, Pingdom, UptimeRobot) **must** pass the authorization header:
> ```bash
> curl -i -H "x-health-token: $HEALTH_CHECK_TOKEN" https://www.sinet.africa/api/health
> ```
> (or query parameter `?token=$HEALTH_CHECK_TOKEN`). The authorized probe inspects live connections to PostgreSQL, MongoDB, Redis, and Resend, and accurately returns **HTTP 503** when any critical service is degraded.

---

## 9. PR-Based Release Runbook & Post-Deployment Verification

All Phase A releases must follow this pull request procedure (never push directly to `master`):

### Pre-Merge PR Workflow
1. **Push Branch:** Human pushes the release preparation branch:
   ```bash
   git push origin agent/phase-a-release-prep
   ```
2. **Open Pull Request:** Open a GitHub Pull Request from `agent/phase-a-release-prep` to `master` titled:
   `Release Phase A: Production Security Gate, TLS Verification, and Resilience`
3. **Verify Vercel Preview Deployment:**
   - Wait for Vercel preview deployment to build and deploy.
   - Confirm preview build passes without errors and static pages (82/82) generate cleanly.
4. **Run Smoke Suite Against Preview:**
   Execute the post-deployment verification script against the preview deployment URL.
5. **Merge on Human Approval:** Once reviewed and approved by the owner, merge the PR into `master` via "Squash and merge" or "Rebase and merge".

### Post-Deployment Smoke Checks (Run Against Target URL)

```bash
PROD_URL="https://www.sinet.africa" # Replace with preview or production URL
HEALTH_TOKEN="your-health-token-here"

# 1. Verify Public Landing Page Boots (Expect: HTTP/1.1 200 OK)
curl -i -s "$PROD_URL/" | head -n 15

# 2. Verify Public Health Check (Expect: HTTP/1.1 200 OK with {"ok":true,"status":"healthy"})
curl -i -s "$PROD_URL/api/health"

# 3. Verify Authorized Deep Health Diagnostic (Expect: HTTP/1.1 200 OK with all checks "ok")
curl -i -s -H "x-health-token: $HEALTH_TOKEN" "$PROD_URL/api/health"

# 4. Verify Signed-Out Member Me API (Expect: HTTP/1.1 401 Unauthorized with {"authenticated":false,"user":null})
curl -i -s "$PROD_URL/api/auth/me"

# 5. Verify Member Verification Rate Limit / Routing (Expect: HTTP/1.1 200 with {"valid":false} or HTTP/1.1 429)
curl -i -s "$PROD_URL/api/verify/SIN-TEST"

# 6. Verify Campaign Application Origin & Validation Guard (Expect: HTTP/1.1 400 or HTTP/1.1 403 Forbidden origin)
curl -i -s -X POST "$PROD_URL/api/join/campus-ambassadors-2026/apply" \
  -H "Origin: https://sinet.africa" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Candidate"}'

# 7. Verify 2FA Origin & Session Guard (Expect: HTTP/1.1 401 Session expired or HTTP/1.1 403 Forbidden origin)
curl -i -s -X POST "$PROD_URL/api/auth/verify-2fa" \
  -H "Origin: https://sinet.africa" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'
```

---

## 10. Rollback Procedures

If any critical health failure or unexpected regression occurs post-deployment:

### Immediate Vercel Instant Rollback
1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Select the **SINet** project.
3. Click on the **Deployments** tab.
4. Locate the previous production deployment (prior to the Phase A release merge).
5. Click the three dots (`...`) context menu on the previous deployment and select **Promote to Production** (or **Instant Rollback**).
6. Confirm the rollback. Vercel will instantly route 100% of production traffic back to the previous deployment build artifacts without requiring a rebuild.
7. Re-run post-deployment check #1 and #3 to confirm service restoration.
