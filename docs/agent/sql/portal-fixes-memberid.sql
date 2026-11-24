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
  'SIN-' || SUBSTRING(member_id FROM 8) AS canonical_member_id
FROM member_ids
WHERE member_id LIKE 'SIN-SIN%'
LIMIT 10;

-- Step 3: Update member_ids to canonical 'SIN-XXXXXX' (stripping extra 'SIN-')
UPDATE member_ids
SET member_id = 'SIN-' || SUBSTRING(member_id FROM 8)
WHERE member_id LIKE 'SIN-SIN%';

-- Step 4: Verify count after update (should be 0)
SELECT count(*) AS remaining_doubled_prefix_count
FROM member_ids
WHERE member_id LIKE 'SIN-SIN%';

-- Step 5: Check member_profiles for any referral_code stored with doubled prefix
SELECT count(*) AS affected_profiles_referral_count
FROM member_profiles
WHERE referral_code LIKE 'SINSIN%' OR referral_code LIKE 'SIN-SIN%';

-- Step 6: Preview any affected referral_codes
SELECT
  id,
  user_id,
  referral_code,
  REGEXP_REPLACE(referral_code, '^SIN-?SIN-?', 'SIN') AS normalized_referral_code
FROM member_profiles
WHERE referral_code LIKE 'SINSIN%' OR referral_code LIKE 'SIN-SIN%'
LIMIT 10;

-- Step 7: Update member_profiles referral_code if any doubled prefixes exist
UPDATE member_profiles
SET referral_code = REGEXP_REPLACE(referral_code, '^SIN-?SIN-?', 'SIN')
WHERE referral_code LIKE 'SINSIN%' OR referral_code LIKE 'SIN-SIN%';

-- SAFETY: Default to ROLLBACK. Change to COMMIT once Emmanuel reviews output.
ROLLBACK;
