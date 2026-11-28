-- Migration / Data Fix: docs/agent/sql/portal-fixes-memberid.sql
-- Goal: Inspect and normalize legacy doubled-prefix member IDs ('SIN-SIN...') in PostgreSQL.
--
-- Safety:
-- 1. Review query outputs inside BEGIN block before changing ROLLBACK to COMMIT.
-- 2. Default execution rolls back all changes.
-- 3. Run manually via Neon SQL editor or psql.

BEGIN;

-- Step 1: Count rows in member_ids with doubled prefix 'SIN-SIN%'
SELECT count(*) AS affected_member_ids_count
FROM member_ids
WHERE member_id LIKE 'SIN-SIN%';

-- Step 2: Preview the first 10 affected rows and their canonical transformation
SELECT
  id,
  user_id,
  member_id AS current_member_id,
  REGEXP_REPLACE(member_id, '^SIN-?SIN-?', 'SIN-') AS canonical_member_id
FROM member_ids
WHERE member_id ~ '^SIN-?SIN-?'
LIMIT 10;

-- Step 3: Update member_ids to canonical 'SIN-XXXXXX' (stripping at most one duplicated prefix)
UPDATE member_ids m
SET member_id = REGEXP_REPLACE(m.member_id, '^SIN-?SIN-?', 'SIN-')
WHERE m.member_id ~ '^SIN-?SIN-?'
  AND NOT EXISTS (
    SELECT 1 FROM member_ids existing
    WHERE existing.member_id = REGEXP_REPLACE(m.member_id, '^SIN-?SIN-?', 'SIN-')
      AND existing.id <> m.id
  );

-- Step 4: Verify count after update (should be 0)
SELECT count(*) AS remaining_doubled_prefix_count
FROM member_ids
WHERE member_id ~ '^SIN-?SIN-?';

-- Step 5: Check member_profiles for referral_code stored with a true doubled prefix
-- (excludes valid 9-char referral codes whose 6-char nanoid starts with 'SIN', e.g. 'SINSIN...')
SELECT count(*) AS affected_profiles_referral_count
FROM member_profiles
WHERE referral_code LIKE 'SIN-SIN%'
   OR (referral_code LIKE 'SINSIN%' AND length(referral_code) >= 12);

-- Step 6: Preview any affected referral_codes
SELECT
  id,
  user_id,
  referral_code,
  REGEXP_REPLACE(referral_code, '^SIN-?SIN-?', 'SIN') AS normalized_referral_code
FROM member_profiles
WHERE referral_code LIKE 'SIN-SIN%'
   OR (referral_code LIKE 'SINSIN%' AND length(referral_code) >= 12)
LIMIT 10;

-- Step 7: Update member_profiles referral_code if any doubled prefixes exist
UPDATE member_profiles mp
SET referral_code = REGEXP_REPLACE(mp.referral_code, '^SIN-?SIN-?', 'SIN')
WHERE (
    mp.referral_code LIKE 'SIN-SIN%'
    OR (mp.referral_code LIKE 'SINSIN%' AND length(mp.referral_code) >= 12)
  )
  AND NOT EXISTS (
    SELECT 1 FROM member_profiles existing
    WHERE existing.referral_code = REGEXP_REPLACE(mp.referral_code, '^SIN-?SIN-?', 'SIN')
      AND existing.id <> mp.id
  );

-- SAFETY: Default to ROLLBACK. Change to COMMIT once Emmanuel reviews output.
ROLLBACK;

-- Read-only audit: count of users with an approved/active membership but no member_ids row
SELECT count(*) AS active_members_without_member_id_count
FROM member_profiles mp
LEFT JOIN member_ids mi ON mp.user_id = mi.user_id
WHERE mp.status = 'active' AND mi.id IS NULL;
