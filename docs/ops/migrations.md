# PostgreSQL migrations (manual only)

## Rules
- `npm run db:migrate` (`drizzle-kit migrate`) is **never** run by `npm run build`, `postbuild`, Vercel, GitHub Actions, or `postinstall`.
- Never run migrations, deletes, or data scripts against production from an agent session.
- Data-changing scripts must default to `--dry-run`.

## What ships in the repo
- Checked-in migration: `drizzle/0000_organic_scrambler.sql`
- Drizzle config: `drizzle.config.ts`
- Script: `npm run db:migrate`

There is **no** `drizzle-kit push` script in `package.json`. If an earlier production database was created with `drizzle-kit push`, tables may already exist without Drizzle’s migrations journal.

## Baseline plan (if production used `drizzle push`)
1. From a trusted machine with read access, compare live tables/columns/enums to `drizzle/0000_organic_scrambler.sql` (and `drizzle/meta/0000_snapshot.json`).
2. If the live schema matches `0000`, record the baseline so migrate does not re-apply it:
   - Prefer `drizzle-kit baseline` when your CLI version exposes it, **or**
   - Insert the `0000` revision into Drizzle’s migrations table for that database (exact table name follows drizzle-kit’s journal for this project).
3. Only after the baseline is recorded, run:

```bash
# Review first — point DATABASE_URL at the target (pooled) database
export DATABASE_URL='postgresql://…?sslmode=verify-full'
npm run db:migrate
```

4. If the live schema **does not** match `0000`, stop and write a forward migration; do not force-apply `0000`.

## New environments
On an empty database:

```bash
export DATABASE_URL='postgresql://…?sslmode=verify-full'
npm run db:migrate
```

## Provider note
Production provider (Neon vs Supabase) is not yet decided. Use a **pooled** connection string suitable for serverless (`prepare: false` is already set in `src/lib/db/index.ts`) and verified TLS (`rejectUnauthorized: true`, optional `DATABASE_CA_CERT`).
