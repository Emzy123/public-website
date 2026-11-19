# SINet Agent Blockers

Items that need a human, CEO, legal, or environment decision. Agent continues on independent work.

## Format
- **What**
- **Why**
- **Exact steps**

---

## Open

### Human — Production Postgres unreachable
- **What:** Production reports `postgresConnected=false`.
- **Why:** Membership, campaigns, audit, verify DB path, and role grants need Postgres.
- **Exact steps:**
  1. Choose provider (Neon or Supabase) — still undecided.
  2. Create pooled connection string (`sslmode=verify-full` only, with optional `DATABASE_CA_CERT` if using a private root CA).
  3. Set `DATABASE_URL` (and optional `DATABASE_CA_CERT`) in Vercel.
  4. From a trusted machine, baseline then `npm run db:migrate` (see `docs/ops/migrations.md` once shipped).
  5. Confirm authorized health check shows Postgres `ok`.

### Human — Do not push from agent
- **What:** Agent never pushes or deploys.
- **Why:** Hard rule 1.
- **Exact steps:** Human reviews each `agent/phase-*` branch in order and pushes.

### Architecture Note — Multi-Instance Session Revocation & /verify Rate Limiting
- **Session Revocation & Cross-Instance Window (A11 / Follow-up 5):**
  - **Member JWT Expiry:** Hard expiration is 7 days (`SESSION_MAX_AGE = 60 * 60 * 24 * 7` seconds in `src/lib/auth/session.ts:9`), with an idle timeout of 30 minutes (`IDLE_TIMEOUT = 60 * 30` seconds in `src/lib/auth/session.ts:10`).
  - **Admin JWT Expiry:** Hard expiration is 2 hours (`SESSION_MAX_AGE = 60 * 60 * 2` seconds in `admin/lib/auth.ts:8` and `src/middleware.ts:8`).
  - **Revocation Window During Postgres Outage:** The in-memory `revokedJtis` denylist is process-local. Cross-instance token invalidation across serverless instances relies on deleting the active session row from the PostgreSQL `sessions` table. While PostgreSQL is down or unreachable, a logged-out member token stays valid on other serverless instances for up to that TTL (idle timeout of 30 minutes or hard max of 7 days). Privileged operations remain safe because 2FA elevation requires PostgreSQL (which fails closed with 503), and degraded fallback sessions strictly clamp permissions to the verified member role only.
- **Verification Rate Limiting (B2):** The `/verify` route rate limit counter is stored in Upstash Redis (`sinet:verify-member-credential`) and holds across all serverless instances. In production, if Upstash credentials are not set, it fails closed with HTTP 429. In development/testing without Upstash, it falls back to a process-local in-memory Map.

### Architecture Note — Jest Open Handles Without forceExit (Item 5)
- **What:** With `forceExit: true` removed from `jest.config.ts` and `globalTeardown` closing singleton Postgres and MongoDB connection pools, all 66 test suites (531 tests) pass, but the Jest test worker event loop retains open handles.
- **Why:** During `src/lib/posts/posts.test.ts`, `posts.ts` catches a missing Postgres `posts` table (unmigrated in Phase A) and dynamically imports `@/lib/db/mongodb`, initializing a MongoDB client whose topology monitoring timers/keep-alive sockets keep the Jest worker thread active. In Jest, `globalTeardown` runs in the master process only after all worker processes have exited, so open handles in worker processes block master process shutdown.
- **Exact steps:**
  1. Do not restore `forceExit: true` in `jest.config.ts`.
  2. Keep `globalTeardown` in `tests/setup/global-teardown.ts` to close active clients.
  3. In Phase B/C (when editorial/posts features are scheduled), mock Mongo in `posts.test.ts` or explicitly close worker connections in an `afterAll` hook with node environment flags.

---

## Resolved / N/A
(None yet this session.)
