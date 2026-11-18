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
- **Session Revocation (A11):** The in-memory `revokedJtis` denylist is process-local. Cross-instance token invalidation across serverless functions requires deleting the row from the PostgreSQL `sessions` table. If PostgreSQL is unreachable, privileged operations fail closed (2FA cannot complete with 503, and fallback sessions strictly grant the 'member' role).
- **Verification Rate Limiting (B2):** The `/verify` route rate limit counter is stored in Upstash Redis (`sinet:verify-member-credential`) and holds across all serverless instances. In production, if Upstash credentials are not set, it fails closed with HTTP 429. In development/testing without Upstash, it falls back to a process-local in-memory Map.

---

## Resolved / N/A
(None yet this session.)
