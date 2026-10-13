import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { chapters } from './chapters';

export const memberStatusEnum = pgEnum('member_status', [
  'pending',
  'active',
  'suspended',
  'alumni',
]);

export const studentDivisionEnum = pgEnum('student_division', [
  'student_finance',
  'student_enterprise',
  'governance_records',
]);

export const memberProfiles = pgTable('member_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'set null' }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  bio: varchar('bio', { length: 280 }),
  programme: varchar('programme', { length: 255 }),
  level: varchar('level', { length: 20 }),
  division: studentDivisionEnum('division'),
  status: memberStatusEnum('status').default('pending').notNull(),
  statusReason: text('status_reason'),
  referralCode: varchar('referral_code', { length: 32 }).notNull().unique(),
  referredByCode: varchar('referred_by_code', { length: 32 }),
  profileCompletenessPct: integer('profile_completeness_pct').default(20).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const badges = pgTable('badges', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  iconName: varchar('icon_name', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userBadges = pgTable(
  'user_badges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    badgeId: varchar('badge_id', { length: 50 })
      .notNull()
      .references(() => badges.id, { onDelete: 'cascade' }),
    awardedAt: timestamp('awarded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userBadgeUnique: unique('uq_user_badge').on(table.userId, table.badgeId),
  })
);

export type MemberProfile = typeof memberProfiles.$inferSelect;
export type NewMemberProfile = typeof memberProfiles.$inferInsert;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
