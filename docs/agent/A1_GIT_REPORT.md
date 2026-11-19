## A1 Git diagnostics (2026-11-04)

### git status
On branch agent/phase-a-security
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/agent/A1_GIT_REPORT.md

nothing added to commit but untracked files present (use "git add" to track)

### git reflog -n 30
8b8032e HEAD@{0}: commit: docs(agent): add HARD RULES, PROGRESS, BLOCKERS, and COPY_REVIEW (phase-0)
9378622 HEAD@{1}: checkout: moving from master to agent/phase-a-security
9378622 HEAD@{2}: commit: feat(admin): add edit link roles control with staff invite-only server enforcement and audit logging
2fa2faa HEAD@{3}: commit: fix(links): unify link accepting and status calculation between admin UI and public join API
0e27da0 HEAD@{4}: commit: fix(auth): structured logging and admin health diagnostics for OTP sign-in delivery failures
5062ffb HEAD@{5}: commit: test(chapters): verify chapter join links routing through /join with role and chapter params
2dd6351 HEAD@{6}: commit: feat(compliance): gate unsigned financial claims and scale stats behind feature flag
5c614ac HEAD@{7}: commit: docs: document membership Postgres boot behavior and manual db:migrate
fd811d0 HEAD@{8}: commit: ci: pin Actions to commit SHAs, set contents:read, and smoke without repository secrets
e4b4826 HEAD@{9}: commit: fix(runtime): require AUTH_SECRET and DATABASE_URL at boot and ping Postgres with a timeout
8917588 HEAD@{10}: commit: fix(auth): fail closed on incomplete member 2FA and stop logging OTP codes by default
5620e59 HEAD@{11}: commit: fix(security): enforce verified TLS with custom CA support, fail closed on stale-Mongo 2FA, and assert JWT-only roles
ea09959 HEAD@{12}: checkout: moving from ea09959e04ea7984e6e1ff4e5b799f01a3adc4b6 to master
ea09959 HEAD@{13}: cherry-pick: docs(deployment): document production Postgres pooling and SSL requirements
c042a6d HEAD@{14}: cherry-pick: feat(integrity): structured fallback audit logging and database reconciliation guide
016dafa HEAD@{15}: commit (amend): fix(availability): graceful fallbacks and 503 handling for /me, /verify, 2FA, apply, and admin applications
702c0a7 HEAD@{16}: checkout: moving from master to 702c0a7
f4be06e HEAD@{17}: reset: moving to HEAD
f4be06e HEAD@{18}: commit: docs(deployment): document production Postgres pooling and SSL requirements
5e17fc2 HEAD@{19}: commit: feat(integrity): structured fallback audit logging and database reconciliation guide
702c0a7 HEAD@{20}: commit: fix(availability): graceful fallbacks and 503 handling for /me, /verify, 2FA, apply, and admin applications
c58f0c2 HEAD@{21}: commit: fix(security): prevent 2FA bypass in Mongo fallback, restrict fallback JWT roles to member, and enforce verified TLS
8a09f8b HEAD@{22}: commit: feat(capacity-audit): report sanitized database error diagnosis without leaking credentials
5236120 HEAD@{23}: commit: feat(capacity-audit): add GET /api/admin/capacity-audit and self-healing application counts
40ed033 HEAD@{24}: commit: feat(scripts): add capacity counts audit and dry-run backfill script
d1380f0 HEAD@{25}: commit: fix(links,concurrency): support unlimited and zero-capacity links, add Postgres concurrent seat limit integration test
2f197c1 HEAD@{26}: commit: fix(apply,links): compensating slot release on Mongo, ACID tx rollback on Postgres, precedence alignment, and frontend status handling
9a5c87b HEAD@{27}: commit: fix(links,apply): atomic capacity check, status precedence, Africa/Lagos timezone expiry, and 4xx status enforcement
607c285 HEAD@{28}: commit: fix(links): unify link status calculation across public join route and admin cards
9365d07 HEAD@{29}: commit: docs(admin,chapters): document super_admin auto-provisioning, add TTL cache and retryable unreachability handling for chapters

### git log --oneline -n 20
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
5236120 feat(capacity-audit): add GET /api/admin/capacity-audit and self-healing application counts
40ed033 feat(scripts): add capacity counts audit and dry-run backfill script
d1380f0 fix(links,concurrency): support unlimited and zero-capacity links, add Postgres concurrent seat limit integration test
2f197c1 fix(apply,links): compensating slot release on Mongo, ACID tx rollback on Postgres, precedence alignment, and frontend status handling

### git log origin/master..HEAD --oneline
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

### git diff 8a09f8b HEAD --stat (summary)
 src/lib/runtime/secrets.ts                         |  19 +-
 src/lib/schemas/registration-link.schema.ts        |  80 +++--
 src/lib/site-config.ts                             |   6 +
 src/lib/types/membership.ts                        |   1 +
 81 files changed, 3742 insertions(+), 337 deletions(-)

### Confirmed security commits
c58f0c2 fix(security): prevent 2FA bypass in Mongo fallback, restrict fallback JWT roles to member, and enforce verified TLS
016dafa fix(availability): graceful fallbacks and 503 handling for /me, /verify, 2FA, apply, and admin applications
c042a6d feat(integrity): structured fallback audit logging and database reconciliation guide
ea09959 docs(deployment): document production Postgres pooling and SSL requirements

### Uncommitted work
Working tree clean at phase-0 commit (no prior uncommitted work to split).
