# SINet Agent Progress

Source of truth for session restarts. Continue from the first unfinished item.

**Last updated:** 2026-11-18  
**Current branch:** `agent/phase-a-followups`  
**New dependencies this session:** none

## Definition of Done (per item)
typecheck · lint · full `npm test` · `next build` · smoke — record summary lines below each item.

---

## Phase 0 — First actions
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| 0.1 Rules `.cursor/rules/sinet.mdc` + AGENTS.md sync | done | 8b8032e | |
| 0.2 PROGRESS / BLOCKERS / COPY_REVIEW | done | 8b8032e | |

---

## Phase A — Sync and security gate (`agent/phase-a-security` & `agent/phase-a-verify`)
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| A1 Git status / reflog / confirm security commits | done | 79913a6 | See docs/agent/A1_GIT_REPORT.md |
| A2 Postgres TLS verify + config test | done | 6cba401 (+5620e59, 746662f) | Proof: ssl require => rejectUnauthorized false; docs/ops/postgres-tls.md; unit tests for require/verify-full/none |
| A3 Member 2FA fail-closed + stale Mongo test | done_on_master | 8917588 / 5620e59 | Verified in verify-otp & verify-2fa suites |
| A4 Degraded `/api/auth/me` JWT-only roles; 401 signed out | done_on_master | 016dafa + me tests | Verified in me/route.test.ts |
| A5 OTP/magic-link logging allowlist | done | 8917588 (+a53aa8a) | Verified never logs when NODE_ENV=production |
| A6 Boot: AUTH_SECRET + DATABASE_URL fatal in prod | done_on_master | e4b4826 | Verified in secrets.test.ts & boot check |
| A7 `/api/health` public vs authorized + ops doc | done | 78003e3 (+e4b4826) | docs/ops/health-check.md |
| A8 Admin applications display-only dedupe | done_on_master | (dedupe.ts) | Display-only, never deletes user data |
| A9 `db:migrate` manual + `docs/ops/migrations.md` | done | 10283d0 (+5c614ac) | Local migration verified against local postgres |
| A10 CI smoke SHA-pinned, no secrets | done_on_master | fd811d0 | Verified permissions: contents: read |
| A11 Logout + server-side JWT revocation | done | c9704e6 / eca1b8a (+5922fc7) | jti denylist + sessions delete; cross-instance Postgres dependency verified |
| A12 `docs/ops/ENV.md` | done | 24c115e | Updated docs/ops/ENV.md |

---

## Phase B — Broken paths (`agent/phase-b-paths`)
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| B1 Edit link roles + Staff invite-only + Closed bug | partial | 9378622 / 2fa2faa | Need BLOCKERS UI steps for link 3fac46517ba6 |
| B2 `/verify` public check + rate limit + footer | partial | verify/[memberId] exists | Need `/verify` index; confirm footer |
| B3 `/admin/audit` fix + pagination/filters + smoke | partial | page exists | Filters incomplete (action only); need actor/date + pagination + smoke |
| B4 Applications role filter = full enum | pending | | |
| B5 Sign-in OTP neutral errors | done_on_master | e0e27da0 | Confirm BLOCKERS for Resend |
| B6 Regression smokes (redirects, join, /me 401) | partial | 5062ffb | Expand smoke |
| B7 Crawl script + CI | pending | | |

---

## Phase C — Trust, content, polish (`agent/phase-c-content`)
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| C1 Delete 40% advert script (dry-run default) | pending | | |
| C2 Compliance copy + Disclaimer + regex | pending | | |
| C3 Numbers behind legal flag OFF | partial | 2dd6351 | Verify chapter counts |
| C4 hello@sinet.africa + privacy trim + terms COPY_REVIEW | pending | | investment interest still in privacy |
| C5 News polish | pending | | Submit Lead still present |
| C6 Gallery empty + a11y names | pending | | |
| C7 SEO generateMetadata + duplicate title test | pending | | |
| C8 One primary CTA + pillar anchors | pending | | |
| C9 Mobile Playwright screenshots | pending | | |
| C10 `/join` closed state + get notified | pending | | |

---

## Phase D — Ambassador portal (`agent/phase-d-ambassador`)
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| D1 Ambassador apply flow + /ambassadors redirect | pending | | |
| D2 Admin review queue | pending | | |
| D3 Approve grants applied-for role + email | pending | | |
| D4 Seed Campus Ambassadors campaign script | pending | | |

---

## Phase E — Role dashboard (`agent/phase-e-dashboard`)
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| E1 Data foundation + role enum + permissions | pending | | |
| E2 Shell + shared member pages | pending | | |
| E3 Ambassador dashboard | pending | | |
| E4 Volunteer dashboard | pending | | |
| E5 Community member dashboard | pending | | |
| E6 Staff dashboard | pending | | |
| E7 Partner dashboard | pending | | |
| E8 Admin role tools + impersonation + admins flag | pending | | |
| E9 Host routing middleware + DNS BLOCKERS | pending | | |

---

## Phase F — Payments design (`agent/phase-f-payments`)
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| F1 `docs/design/membership-payments.md` + flagged UI skeleton | pending | | |

---

## Final
| Item | Status | Notes |
|------|--------|-------|
| FINAL_REPORT.md | pending | |

---

## Phase summaries
(Appended at end of each phase.)


## Phase A summary
- **Branch:** `agent/phase-a-security`
- **Commits (this phase):** 8b8032e phase-0; 79913a6 A1; 6cba401 A2; 78003e3 A7; 10283d0 A9; c9704e6 A11; eca1b8a A11 fix; 24c115e A12
- **Inherited from master:** A3–A6, A8, A10 (c58f0c2…fd811d0)
- **Tests added:** logout.test.ts; session revocation cases
- **DoD (2026-11-04):**
  - typecheck: pass
  - lint: pass (2 pre-existing hook warnings)
  - npm test: 59 passed suites / 5 failed (Postgres integration: campaigns, gamification, member-id, moderation-guards, pulse) — docker compose provides Mongo only, no local Postgres
  - A11 unit: 7/7 pass
  - next build: pass
  - smoke: 59 passed, 2 failed (`/api/join/finance-analysts-cohort-1`, `/api/join/student-enterprise-fellows` → campaign not found with unreachable Postgres on :9)
- **Risks:** Multi-instance logout denylist is process-local until sessions row delete is reachable; document in BLOCKERS if needed.
- **Human:** none new beyond existing Postgres/DNS blockers.


## Phase A Verification summary (`agent/phase-a-verify`)
- **Branch:** `agent/phase-a-verify`
- **Commits:**
  - 58f3b6e: chore(docker): add dev-only postgres service to docker-compose (1)
  - 746662f: test(db): verify rejectUnauthorized with require, verify-full, and CA cert (3)
  - a53aa8a: test(auth): prove no OTP or magic link is logged when NODE_ENV is production (9)
  - 5922fc7: test(auth): verify cross-instance revocation dependency on Postgres sessions table (7)
  - 34c46a0: docs(verify): document rate limit counter store and serverless semantics (8)
- **DoD Verification Results:**
  - `npm test`: 64 passed suites / 64 total (495 tests passed / 495 total, 0 failed) with local Postgres & Mongo up
  - `npm run typecheck`: clean pass (0 errors)
  - `npm run lint`: pass (0 errors, 2 pre-existing react-hooks/exhaustive-deps warnings)
  - `next build`: pass (optimized build & next-sitemap generated)
  - `npm run smoke`: 61 passed / 0 failed
  - `crawl`: script not present on Phase A (introduced in Phase B `a064ee8`)
- **Key Findings:**
  - Step 3 (TLS): node_modules/postgres sets rejectUnauthorized:false when ssl is a string ('require'/'allow'/'prefer'). `src/lib/db/index.ts` passes ssl object `{ rejectUnauthorized: true }`, ensuring verified TLS regardless of sslmode parameter.
  - Step 4 (Unreachable Postgres): Server boots cleanly; public pages return 200; member/campaign APIs return 503; 2FA fails closed. Missing AUTH_SECRET / DATABASE_URL is fatal at boot.
  - Step 5 (Stale-Mongo 2FA): Refuses login with 503 for stale-Mongo cases; denies missing totpSecret; verifies only member's own totpSecret.
  - Step 6 (Degraded /me): Roles and chapter IDs come strictly from verified JWT claims; elevated Mongo roles ignored.
  - Step 7 (Revocation): In-memory jti denylist is process-local; cross-instance revocation relies on Postgres sessions table. Privileged roles fail closed when Postgres is down.
  - Step 8 (/verify Rate Limit): Counter stored in Upstash Redis; holds across serverless instances. Fails closed with 429 when Upstash unconfigured in production.
  - Step 9 (OTP Logging): Allowlist requires NODE_ENV=development AND DEV_LOG_OTP=1; strictly blocked in production.


## Phase A Follow-ups summary (`agent/phase-a-followups`)
- **Branch:** `agent/phase-a-followups`
- **Commits:**
  - ac4a944: test(db): assert driver-resolved rejectUnauthorized and exact local hostname matching (1)
  - 06eb394: fix(rate-limit): use trusted right-most IP or platform header to prevent spoof bypass (4)
  - 5fd9b20: test(db): auto-seed local test database in globalSetup and skip if absent (3)
  - c86634d: fix(db): remove duplicate export of createPostgresClient and isLocalDatabaseHost (1)
  - 03f0234: docs(auth): document session TTL and cross-instance revocation window during Postgres outage (5)
  - e786f07: docs(agent): scope PROGRESS.md to Phase A on this branch (6)
  - 171efbe: docs(ops): create Phase A release checklist and runbook (7)
  - 308b4aa: test(db): fix it.each callback signature type in hostname match test (1)
- **DoD Verification Results:**
  - `npm test`: 64 passed suites / 64 total (516 tests passed / 516 total, 0 failed) with local Postgres & Mongo up
  - `npm run typecheck`: clean pass (0 errors)
  - `npm run lint`: pass (0 errors, 2 pre-existing react-hooks/exhaustive-deps warnings)
  - `next build`: pass (optimized build & next-sitemap generated)
  - `npm run smoke`: 61 passed / 0 failed
- **Key Verifications:**
  - Driver-resolved TLS options asserted and passed (`rejectUnauthorized === true` on real client options for require/verify-full/none/CA).
  - Exact hostname matching verified (localhost.example.com, 127.0.0.1.example, Neon, Supabase are non-local).
  - Self-seeding Jest test fixture: fresh Postgres database dropped, recreated, migrated, and passed `npm test` without manual seed.
  - Rate limit IP spoofing prevented using trusted platform header or right-most forwarded-for IP.
  - Member (7d / 30m idle) and Admin (2h) TTL documented in BLOCKERS.md along with cross-instance revocation window during Postgres downtime.
  - Production release checklist and runbook created in `docs/ops/RELEASE-phase-a.md`.



