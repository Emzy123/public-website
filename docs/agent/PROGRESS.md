# SINet Agent Progress

Source of truth for session restarts. Continue from the first unfinished item.

**Last updated:** 2026-11-20  
**Current branch:** `agent/brand-foundation`  
**New dependencies this session:** `sharp` (devDependency — explicitly required to build reproducible brand assets in `scripts/brand/build-assets.mjs`)

## Definition of Done (per item)
typecheck · lint · full `npm test` · `next build` · smoke — record summary lines below each item.

---

## Brand Foundation Phase (`agent/brand-foundation`)
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| 1. Source logo in brand/source + BRAND.md | done | 8bed79a | 1280x853 JPEG moved to brand/source/logo.jpg |
| 2. Asset set build script + public assets | done | pending | scripts/brand/build-assets.mjs, lockups, icons, og-image |
| 3. Centralized Logo component | pending | | src/components/brand/Logo.tsx |
| 4. Design tokens (Tailwind + CSS vars) | pending | | tailwind.config.ts & globals.css |
| 5. Fonts (Sora & Inter via next/font/google) | pending | | Self-hosted at build |
| 6. Contrast WCAG AA unit test | pending | | Unit test for semantic pairs & gold-500 restriction |
| 7. Tagline update | pending | | "Building Africa's Future Systems" |
| 8. Metadata icons & og-image links | pending | | Point openGraph/twitter/icons |
| 9. Gates verification | pending | | npm ci, typecheck, lint, jest, build, smoke, crawl, assets 200 |
| 10. Playwright screenshots check | pending | | Check availability and capture / & /about |

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
| A1 Git status / reflog / confirm security commits | released 2026-11-19 at 75fc63a | 79913a6 | See docs/agent/A1_GIT_REPORT.md |
| A2 Postgres TLS verify + config test | released 2026-11-19 at 75fc63a | 6cba401 (+5620e59, 746662f) | Proof: ssl require => rejectUnauthorized false; docs/ops/postgres-tls.md; unit tests for require/verify-full/none |
| A3 Member 2FA fail-closed + stale Mongo test | released 2026-11-19 at 75fc63a | 8917588 / 5620e59 | Verified in verify-otp & verify-2fa suites |
| A4 Degraded `/api/auth/me` JWT-only roles; 401 signed out | released 2026-11-19 at 75fc63a | 016dafa + me tests | Verified in me/route.test.ts |
| A5 OTP/magic-link logging allowlist | released 2026-11-19 at 75fc63a | 8917588 (+a53aa8a) | Verified never logs when NODE_ENV=production |
| A6 Boot: AUTH_SECRET + DATABASE_URL fatal in prod | released 2026-11-19 at 75fc63a | e4b4826 | Verified in secrets.test.ts & boot check |
| A7 `/api/health` public vs authorized + ops doc | released 2026-11-19 at 75fc63a | 78003e3 (+e4b4826) | docs/ops/health-check.md |
| A8 Admin applications display-only dedupe | released 2026-11-19 at 75fc63a | (dedupe.ts) | Display-only, never deletes user data |
| A9 `db:migrate` manual + `docs/ops/migrations.md` | released 2026-11-19 at 75fc63a | 10283d0 (+5c614ac) | Local migration verified against local postgres |
| A10 CI smoke SHA-pinned, no secrets | released 2026-11-19 at 75fc63a | fd811d0 | Verified permissions: contents: read |
| A11 Logout + server-side JWT revocation | released 2026-11-19 at 75fc63a | c9704e6 / eca1b8a (+5922fc7) | jti denylist + sessions delete; cross-instance Postgres dependency verified |
| A12 `docs/ops/ENV.md` | released 2026-11-19 at 75fc63a | 24c115e | Updated docs/ops/ENV.md |

---

## Phase B — Broken paths (`agent/phase-b-paths`)
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| B1 Edit link roles + Staff invite-only + Closed bug | done | 0ae6b2d (+9378622/2fa2faa) | BLOCKERS UI steps shipped |
| B2 `/verify` public check + rate limit + footer | done | fa66f48 | /verify index + public API strip PII |
| B3 `/admin/audit` fix + pagination/filters + smoke | done | 4d983b7 | actor/date/pagination + client test |
| B4 Applications role filter = full enum | done | 24e3b17 | ALL_APPLICATION_ROLES dropdown |
| B5 Sign-in OTP neutral errors | done | 0ae6b2d (+e0e27da0) | Resend steps in BLOCKERS |
| B6 Regression smokes (redirects, join, /me 401) | done | 96596ff | returns/investor-journey/me/verify/footer |
| B7 Crawl script + CI | done | a064ee8 / (fix) | crawl-internal-links.mjs in smoke+CI |

---

## Phase B Hotfix — `/verify/[memberId]` 500 crash & PII signature gating (`agent/phase-b-hotfix`)
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| B.Hotfix.1 `getClientIp` HeadersAdapter .get crash fix | done | pending | Checks typeof input.get === 'function' first, safely falls back to 'unknown' |
| B.Hotfix.2 `/verify/[memberId]` signature privacy gate | done | pending | Without valid sig: status and member ID only; full details and trust seal require valid sig |
| B.Hotfix.3 `/verify/[memberId]` generateMetadata privacy gate | done | pending | Generic title/description without fullName unless sig valid |
| B.Hotfix.4 Smoke assertions for `/verify` & `/verify/SIN-TEST` | done | pending | Assert 200 + 'Member ID Not Found' |
| B.Hotfix.5 Docs on Upstash fallback & Vercel IP header | done | pending | Documented in rate-limit-unified.ts & BLOCKERS.md |

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


<<<<<<< HEAD
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


## Phase A Release Prep summary (`agent/phase-a-release-prep`)
- **Branch:** `agent/phase-a-release-prep`
- **Commits:**
  - c3db11f: fix(api): eliminate internal database error and reason text from public responses (1)
  - 1c59300: fix(db): restrict docker service hostnames as local to non-production only (4)
  - 5cad534: fix(seed): guard seed execution against non-local/production and neutralize seed wording (2)
  - b1f7cce: test(jest): manage database client teardown in globalTeardown without forceExit (5)
  - b8c7d77: chore(docker): add dev-only redis and serverless-redis-http services to docker-compose (3)
  - f7e5b52: docs(ops): update Phase A release checklist with Upstash requirement, outage matrix, and PR workflow (6, 7)
  - fabb605: fix(test): resolve typecheck errors in test env assertions and auth me handler (8)
  - d8c0133: docs(ops): update commit list with latest typecheck fix in release checklist (7)
- **DoD Verification Results:**
  - `npm test`: 66 passed suites / 66 total (531 tests passed / 531 total, 0 failed) with local Postgres & Mongo up
  - `npm run typecheck`: clean pass (0 errors)
  - `npm run lint`: pass (0 errors, 2 pre-existing react-hooks/exhaustive-deps warnings)
  - `next build`: pass (optimized build & next-sitemap generated, 82 static pages)
  - `npm run smoke`: 61 passed / 0 failed
  - `crawl`: script not present on Phase A (introduced in Phase B `a064ee8`)
- **Key Verifications:**
  - Zero internal database error or reason text leaks into public responses across all API routes under failure.
  - Safe database seeding: guards refuse execution against non-local (Neon, Supabase) and production environments; neutral test seed data with no legal-gated wording.
  - Rate-limit inventory complete; admin access during Postgres outage demonstrated (admin login page 200, admin login POST 200 via in-memory sliding window, public routes 503/429).
  - Docker service hostnames (`postgres`, `sinet-postgres`) restricted as local only in non-production.
  - Jest client teardown managed in `globalTeardown`; test worker dynamic Mongo import handle documented in `BLOCKERS.md`.
  - Apply route 503 check documented; Upstash documented as hard production precondition; PR-based release workflow detailed in `docs/ops/RELEASE-phase-a.md`.


## Phase A Final review summary (`agent/phase-a-final`)
- **Branch:** `agent/phase-a-final`
- **Commits:**
  - 32886c1: fix(security): redact database URLs and credentials from logs, errors, and fixtures (1)
  - e79c1c4: fix(admin): use Upstash for admin limiter and fail closed on unaudited application reviews (2)
- **DoD Verification Results:**
  - `npm test`: 67 passed suites / 67 total (536 tests passed / 536 total, 0 failed) with local Postgres & Mongo up
  - `npm run typecheck`: clean pass (0 errors)
  - `npm run lint`: pass (0 errors, 2 pre-existing react-hooks/exhaustive-deps warnings)
  - `next build`: pass (optimized build & next-sitemap generated, 82 static pages)
  - `npm run smoke`: 61 passed / 0 failed
- **Key Verifications:**
  - Complete redaction of database URLs and credentials from all logs, errors, console messages, and test fixture refusal outputs.
  - Admin identity documented: credentials and MFA TOTP verified via env vars in memory; role super_admin hardcoded in guards for verified admin session. Zero admin roles read from Mongo.
  - Admin login limiter dynamically connects to Upstash Redis when configured, and falls back to in-memory sliding window when unconfigured or unreachable.
  - Admin write routes audited: CMS, adverts legal approval, and links are durably audited in MongoDB; application reviews fail closed with HTTP 503 during Postgres outages, preventing unaudited decisions.
  - Posts table drift identified: schema defines posts and post_reports, which were added after initial migration 0000.
  - Request-OTP 503 root cause confirmed: RESEND_API_KEY assertion in production mode; token generation succeeds via MongoDB fallback.
  - CR-001 status updated to "removed (no approval required)".


## Phase B summary
- **Branch:** `agent/phase-b-paths`
- **Commits:** 0ae6b2d B1; fa66f48 B2; 4d983b7 B3; 24e3b17 B4; 96596ff B5-B6; a064ee8 B7; crawl transparency allowlist fix
- **DoD:** typecheck pass; lint pass (pre-existing warnings); unit suites for B2/B3/B4 pass; full jest 62 pass / 5 fail (Postgres absent); next build pass; crawl 61 ok / 0 failed after fresh start
- **Human:** B1 Staff link UI steps + B5 Resend in BLOCKERS.md


## Phase B Follow-ups summary (`agent/phase-b-followups`)
- **Branch:** `agent/phase-b-followups`
- **Commits:**
  - 7c6d50e: fix(crawl): remove internal transparency links and disallow 404s in crawler (1)
  - 31828df: fix(api): mark universities route force-dynamic with regression tests (2)
  - 6cd4984: fix(verify): enforce trusted Vercel IP extraction and friendly rate-limit UI (3)
- **Key Verifications:**
  - Internal links to retired `/transparency` route removed from `ConnectClient`, `privacy`, and `terms` (pointed to `/about` and direct `/contact`).
  - `/transparency` 404 allowlist completely removed from `crawl-internal-links.mjs`; crawl strictly fails on any 404 or 500.
  - `/api/universities` verified to query PostgreSQL and marked `export const dynamic = 'force-dynamic'` to prevent static baking during build; unit tests added.
  - Client IP extraction unified across `rate-limit.ts` and `rate-limit-unified.ts` using trusted Vercel sources (`x-real-ip`, platform leftmost `x-vercel-forwarded-for` / `x-forwarded-for`) and fixed bucket `'unknown'`. Client-rotatable headers (e.g. `cf-connecting-ip`) stripped. Proved via tests that rotating headers cannot reset the limit.
  - `/verify/[memberId]` page checks rate limit and renders friendly user-facing error UI when limited or when Upstash is missing in production.
