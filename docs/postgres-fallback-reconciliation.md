# PostgreSQL Fallback Data Reconciliation Guide

During primary PostgreSQL outages or maintenance windows, SINet maintains high availability by redirecting critical writes to MongoDB fallback collections. To guarantee data integrity and operational auditability without compromising user privacy, every fallback write emits a structured event and records metadata in MongoDB.

This guide outlines how to identify, inspect, and reconcile records written to MongoDB back into PostgreSQL once connectivity is restored.

---

## 1. Structured Fallback Audit Events

Whenever a write operation falls back to MongoDB, the system emits an immutable structured audit event:

```json
{
  "event": "postgres_fallback_write",
  "type": "user" | "verification_token" | "application" | "post",
  "id": "<record_identifier>",
  "timestamp": "2026-10-17T21:40:00.000Z"
}
```

### Strict Privacy Guarantee
- **No PII**: Events never include user emails, full names, phone numbers, or academic institutions.
- **No Secrets**: Events never include passwords, OTP codes, session tokens, or connection strings.
- Only opaque identifiers (Mongo `ObjectId`, generated UUIDs, or SHA-256 token hashes) are logged.

### Event Destinations
1. **Application Stdout/Logs**: Captured automatically by hosting platforms (e.g., Vercel runtime logs, AWS CloudWatch, Datadog).
2. **MongoDB `fallbackAuditLogs` Collection**: Stored directly in MongoDB for instant querying via Mongo shell or migration scripts.

---

## 2. Locating Fallback Records

### Method A: Querying MongoDB `fallbackAuditLogs`
Connect to the MongoDB database (via `mongosh` or MongoDB Compass) and query records created during the outage window:

```javascript
// Find all fallback writes between outage start and resolution
db.fallbackAuditLogs.find({
  event: "postgres_fallback_write",
  createdAt: {
    $gte: ISODate("2026-10-17T18:00:00Z"),
    $lte: ISODate("2026-10-17T21:30:00Z")
  }
}).sort({ createdAt: 1 });
```

Filter by entity type to plan phased reconciliation:
```javascript
// Applications submitted during outage
db.fallbackAuditLogs.find({ type: "application" });

// Users verified or created during outage
db.fallbackAuditLogs.find({ type: "user" });

// Blog/community posts authored during outage
db.fallbackAuditLogs.find({ type: "post" });
```

### Method B: Log Aggregator Query
In Vercel Log Drains, Datadog, or CloudWatch:
```text
@message:"postgres_fallback_write"
```

---

## 3. Entity-by-Entity Reconciliation Procedures

### 3.1 Applications (`type: "application"`)
- **Source**: MongoDB `applications` collection (`_id: ObjectId(...)`).
- **Target**: PostgreSQL `applications` table.
- **Procedure**:
  1. Fetch unmerged applications from MongoDB:
     ```javascript
     const fallbackApps = await mongo.collection('applications').find({
       _id: { $in: auditAppIds.map(id => new ObjectId(id)) }
     }).toArray();
     ```
  2. For each application, verify if the user exists in PostgreSQL `users`. If not, create the user record first.
  3. Validate `campaignId` or map `sourceLinkSlug` to the appropriate PostgreSQL campaign record.
  4. Insert application into PostgreSQL:
     ```sql
     INSERT INTO applications (
       id, user_id, campaign_id, university_id, full_name, email, phone,
       programme, level, division, contribution_pitch, status, created_at
     ) VALUES (
       gen_random_uuid(), :userId, :campaignId, :universityId, :fullName,
       :email, :phone, :programme, :level, :division, :pitch, :status, :submittedAt
     );
     ```
  5. Mark the Mongo record as reconciled:
     ```javascript
     await mongo.collection('applications').updateOne(
       { _id: app._id },
       { $set: { reconciledToPostgres: true, reconciledAt: new Date() } }
     );
     ```

### 3.2 Users & Member Profiles (`type: "user"`)
- **Source**: MongoDB `members` collection.
- **Target**: PostgreSQL `users`, `user_roles`, and `member_profiles` tables.
- **Procedure**:
  1. Retrieve member profiles updated during the outage:
     ```javascript
     const fallbackMembers = await mongo.collection('members').find({
       lastLoginAt: { $gte: outageStartTime }
     }).toArray();
     ```
  2. Upsert user into PostgreSQL `users`:
     ```sql
     INSERT INTO users (email, phone, updated_at)
     VALUES (:email, :phone, NOW())
     ON CONFLICT (email) DO UPDATE
     SET phone = COALESCE(EXCLUDED.phone, users.phone),
         updated_at = NOW();
     ```
  3. Ensure role assignment exists in `user_roles` (defaulting to `'member'`).

### 3.3 Verification Tokens (`type: "verification_token"`)
- **Source**: MongoDB `verification_tokens` collection.
- **Target**: PostgreSQL `verification_tokens` table.
- **Procedure**:
  - Verification OTP tokens and magic link tokens have a **10-minute Time-To-Live (TTL)**.
  - Check `expiresAt`:
    - If `expiresAt < NOW()`, the token has already expired and does **not** need reconciliation. Clean up with:
      ```javascript
      await mongo.collection('verification_tokens').deleteMany({
        expiresAt: { $lt: new Date() }
      });
      ```
    - If active, copy `identifier`, `token_hash`, `channel`, and `expires_at` into PostgreSQL `verification_tokens`.

### 3.4 Posts (`type: "post"`)
- **Source**: MongoDB `posts` collection and memory cache.
- **Target**: PostgreSQL `posts` table.
- **Procedure**:
  1. Retrieve posts saved in MongoDB during the outage:
     ```javascript
     const fallbackPosts = await mongo.collection('posts').find({}).toArray();
     ```
  2. Insert into PostgreSQL `posts`:
     ```sql
     INSERT INTO posts (
       id, slug, title, summary, content_html, pillar, status,
       author_id, author_name, author_role, cover_image_url, reading_time_minutes, created_at
     ) VALUES (
       :id, :slug, :title, :summary, :contentHtml, :pillar, :status,
       :authorId, :authorName, :authorRole, :coverImageUrl, :readingTimeMinutes, :createdAt
     ) ON CONFLICT (slug) DO UPDATE
     SET slug = posts.slug || '-' || floor(random() * 1000)::text;
     ```
  3. Once verified, clear or archive reconciled entries from MongoDB `posts`.

---

## 4. Post-Reconciliation Verification

1. **Verify Counts**: Ensure total records in PostgreSQL match MongoDB fallback audit counts.
2. **Audit Cleanup**: Once confirmed, archive processed entries in `fallbackAuditLogs`:
   ```javascript
   await mongo.collection('fallbackAuditLogs').updateMany(
     { _id: { $in: processedAuditIds } },
     { $set: { reconciled: true, reconciledAt: new Date() } }
   );
   ```
3. **Run Smoke Suite**: Run `npm run smoke` to confirm all endpoints function against primary PostgreSQL.
