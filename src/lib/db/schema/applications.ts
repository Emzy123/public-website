import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { users, userRoleEnum } from './users';
import { universities } from './chapters';
import { studentDivisionEnum } from './members';

export const applicationStatusEnum = pgEnum('application_status', [
  'submitted',
  'under_review',
  'approved',
  'rejected',
]);

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'active',
  'closed',
  'archived',
]);

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  targetRole: userRoleEnum('target_role').default('member').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  seatLimit: integer('seat_limit'),
  applicationCount: integer('application_count').default(0).notNull(),
  status: campaignStatusEnum('status').default('draft').notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const campaignWaitlist = pgTable(
  'campaign_waitlist',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    campaignWaitlistUnique: unique('uq_campaign_waitlist').on(table.campaignId, table.email),
  })
);

export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  universityId: uuid('university_id')
    .notNull()
    .references(() => universities.id, { onDelete: 'restrict' }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 30 }).notNull(),
  programme: varchar('programme', { length: 255 }).notNull(),
  level: varchar('level', { length: 20 }).notNull(),
  division: studentDivisionEnum('division').notNull(),
  contributionPitch: text('contribution_pitch').notNull(),
  photoUrl: text('photo_url').notNull(),
  status: applicationStatusEnum('status').default('submitted').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewRemarks: text('review_remarks'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
