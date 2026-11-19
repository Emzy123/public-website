# Authorized health check

## Public response
`GET /api/health` without credentials returns only:

```json
{ "ok": true, "status": "healthy" }
```

or `{ "status": "unhealthy" }` with HTTP 503 when email is misconfigured (Resend key present but `AUTH_FROM_EMAIL` missing). No dependency details, no error text, no connection strings.

## Authorized detail
Authorized callers receive dependency checks including a Postgres ping (≈2.5s timeout). Failures return status enums only (`ok` | `degraded` | `error`) — never driver messages or `DATABASE_URL`.

### Option A — health token header
1. Set `HEALTH_CHECK_TOKEN` in the environment (long random string).
2. Call:

```bash
curl -sS -H "x-health-token: $HEALTH_CHECK_TOKEN" https://sinet.africa/api/health | jq .
```

### Option B — admin session cookie
1. Sign in at `/admin/login` as `ADMIN_EMAIL`.
2. From a browser session (or curl with the `sinet_admin_session` cookie):

```bash
curl -sS -b "sinet_admin_session=<cookie-value>" https://sinet.africa/api/health | jq .
```

## Interpreting Postgres
| Value | Meaning |
|-------|---------|
| `ok` | Ping succeeded within timeout |
| `degraded` | `DATABASE_URL` unset (should not happen in production — boot is fatal) |
| `error` | Unreachable or timed out — public site may still be up; Postgres-only routes return 503 |
