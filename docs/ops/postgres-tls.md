# Postgres TLS (provider-agnostic)

## Proof: `ssl: 'require'` does **not** verify certificates

In `postgres` (npm) `node_modules/postgres/src/connection.js` (v3.4.x):

```js
if (ssl === 'require' || ssl === 'allow' || ssl === 'prefer')
  options.rejectUnauthorized = false
```

So passing `ssl: 'require'` disables certificate verification (`rejectUnauthorized: false`). Production must not use the string form.

## SINet production config

`src/lib/db/index.ts` uses an object for non-local connections:

```ts
ssl: {
  rejectUnauthorized: true,
  ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT } : {}),
}
```

Works with Neon or Supabase pooled URLs. Recommend `sslmode=verify-full` only in `DATABASE_URL` (never `sslmode=require`), and set `DATABASE_CA_CERT` when the provider requires a custom CA.

Covered by `src/lib/db/db-config.test.ts`.
