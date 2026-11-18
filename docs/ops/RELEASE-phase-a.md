# Phase A Production Release Checklist & Runbook

This document details the release checklist, required environment variables, verification commands, and rollback procedures for shipping Phase A (`agent/phase-a-security` and its follow-ups) into `master` via pull request.

---

## 1. Commits Included in Release (origin/master 5236120 -> HEAD)

The following 35 commits encompass Phase A security gates, resilience enhancements, operational tooling, and follow-up verifications:

```text
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

## 3. Environment Variables for Full Functionality

The following environment variables are required for complete platform operation, distributed security, and communication gateways:

| Variable Name | Purpose | Recommended Setting |
|---|---|---|
| `DATABASE_URL` | Primary PostgreSQL database connection | Pooled connection string with `sslmode=verify-full` |
| `DATABASE_CA_CERT` | Custom CA root certificate | PEM certificate content (required if cloud provider uses private/custom root CA) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint | Distributed rate limit store across serverless lambdas |
| `UPSTASH_REDIS_REST_TOKEN`| Upstash Redis REST token | Bearer token for Upstash Redis REST access |
| `RESEND_API_KEY` | Transactional email provider API key | Resend API key for delivering OTP codes and application receipts |
| `AUTH_FROM_EMAIL` | Transactional sender address | Must match verified domain in Resend (e.g. `SINet <auth@sinet.africa>`) |
| `HEALTH_CHECK_TOKEN` | Authorized monitoring diagnostic token | High-entropy secret for deep `/api/health` diagnostics |
| `MONGODB_URI` | Secondary document storage | MongoDB Atlas connection string for CMS, fallback logs, and backups |

---

## 4. Expected Behavior If Services or Variables Are Missing

| Missing Variable / Service | Platform Impact & Failure Mode |
|---|---|
| `AUTH_SECRET` | **Fatal Crash**: Server cannot boot; all requests fail. |
| `DATABASE_URL` | **Fatal Crash**: Server cannot boot; all requests fail. |
| `DATABASE_URL` (Unreachable Host) | **Graceful Degradation**: Server boots; public pages return `HTTP 200`; `/api/health` returns public `200` (or `503` if authorized token supplied); member API endpoints return `HTTP 503`; member 2FA fails closed; `/api/auth/me` returns `HTTP 401` when signed out. |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | **Fail-Closed Rate Limiting**: In production mode, `/verify` and member 2FA rate limiting fail closed with `HTTP 429` (`Too many verification requests. Please slow down.`). In development, falls back to process-local memory Map. |
| `RESEND_API_KEY` | **Sign-In Unavailable**: OTP request API fails; OTP codes are never logged in production. `/api/health` reports email as degraded. |
| `AUTH_FROM_EMAIL` (with `RESEND_API_KEY`) | **Health Check 503**: Misconfiguration triggers `emailMissingFrom` guard; `/api/health` returns `HTTP 503 unhealthy`. |
| `HEALTH_CHECK_TOKEN` | **Public View Only**: Deep dependency breakdown (`mongo`, `postgres`, `redis`, `email`, `authOtp`) is withheld from callers; `/api/health` returns only `{ ok: true, status: "healthy" }`. |
| `DATABASE_CA_CERT` (if host has private CA)| **TLS Handshake Error**: If `DATABASE_URL` uses a host whose CA is not in Node's default CA bundle, connections fail with TLS verification error (rejectUnauthorized remains `true`). |

---

## 5. Post-Deployment Verification Commands

Run the following smoke check commands immediately after deploying to production:

```bash
PROD_URL="https://www.sinet.africa" # Replace with target deployment URL
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
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Candidate"}'

# 7. Verify 2FA Origin & Session Guard (Expect: HTTP/1.1 403 Forbidden origin, or HTTP/1.1 401 Session expired)
curl -i -s -X POST "$PROD_URL/api/auth/verify-2fa" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}'
```

---

## 6. Rollback Procedures

If any critical health failure or unexpected regression occurs post-deployment:

### Immediate Vercel Instant Rollback
1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Select the **SINet** project.
3. Click on the **Deployments** tab.
4. Locate the previous production deployment (prior to the Phase A release merge).
5. Click the three dots (`...`) context menu on the previous deployment and select **Promote to Production** (or **Instant Rollback**).
6. Confirm the rollback. Vercel will instantly route 100% of production traffic back to the previous deployment build artifacts without requiring a rebuild.
7. Re-run post-deployment check #1 and #2 to confirm service restoration.
