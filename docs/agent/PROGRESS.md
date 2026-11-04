# SINet Agent Progress

Source of truth for session restarts. Continue from the first unfinished item.

**Last updated:** 2026-11-04  
**Current branch:** (creating `agent/phase-a-security`)  
**New dependencies this session:** none yet

## Definition of Done (per item)
typecheck · lint · full `npm test` · `next build` · smoke — record summary lines below each item.

---

## Phase 0 — First actions
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| 0.1 Rules `.cursor/rules/sinet.mdc` + AGENTS.md sync | in_progress | | |
| 0.2 PROGRESS / BLOCKERS / COPY_REVIEW | in_progress | | |

---

## Phase A — Sync and security gate (`agent/phase-a-security`)
| Item | Status | Commit | Notes |
|------|--------|--------|-------|
| A1 Git status / reflog / confirm security commits | pending | | Local ahead 15; tree clean; c58f0c2,016dafa,c042a6d,ea09959 present |
| A2 Postgres TLS verify + config test | done_on_master | 5620e59 / c58f0c2 | `rejectUnauthorized: true` + DATABASE_CA_CERT; `db-config.test.ts` |
| A3 Member 2FA fail-closed + stale Mongo test | done_on_master | 8917588 / 5620e59 | |
| A4 Degraded `/api/auth/me` JWT-only roles; 401 signed out | done_on_master | 016dafa + me tests | |
| A5 OTP/magic-link logging allowlist | done_on_master | 8917588 | |
| A6 Boot: AUTH_SECRET + DATABASE_URL fatal in prod | done_on_master | e4b4826 | |
| A7 `/api/health` public vs authorized + ops doc | partial | e4b4826 | Need `docs/ops` authorized-check doc |
| A8 Admin applications display-only dedupe | done_on_master | (dedupe.ts) | |
| A9 `db:migrate` manual + `docs/ops/migrations.md` | partial | 5c614ac | Need ops/migrations.md |
| A10 CI smoke SHA-pinned, no secrets | done_on_master | fd811d0 | |
| A11 Logout + server-side JWT revocation | pending | | Cookie clear only today |
| A12 `docs/ops/ENV.md` | pending | | |

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
