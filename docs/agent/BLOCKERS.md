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
  2. Create pooled connection string (`sslmode=verify-full` or require + `DATABASE_CA_CERT`).
  3. Set `DATABASE_URL` (and optional `DATABASE_CA_CERT`) in Vercel.
  4. From a trusted machine, baseline then `npm run db:migrate` (see `docs/ops/migrations.md` once shipped).
  5. Confirm authorized health check shows Postgres `ok`.

### Human — Do not push from agent
- **What:** Agent never pushes or deploys.
- **Why:** Hard rule 1.
- **Exact steps:** Human reviews each `agent/phase-*` branch in order and pushes.

---

## Resolved / N/A
(None yet this session.)
