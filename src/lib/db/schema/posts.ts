import { pgTable, text, varchar, timestamp, integer, uuid, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const POST_PILLARS = [
  'agriculture',
  'trade_distribution',
  'real_estate',
  'community',
] as const;

export type PostPillar = (typeof POST_PILLARS)[number];

export const POST_STATUSES = [
  'draft',
  'in_review',
  'published',
  'rejected',
  'archived',
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  summary: text('summary').notNull(),
  contentHtml: text('content_html').notNull(),
  pillar: varchar('pillar', { length: 50 }).$type<PostPillar>().notNull(),
  status: varchar('status', { length: 50 }).$type<PostStatus>().default('draft').notNull(),
  authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
  authorName: varchar('author_name', { length: 255 }).notNull(),
  authorRole: varchar('author_role', { length: 100 }).default('Member').notNull(),
  authorEmail: varchar('author_email', { length: 255 }),
  coverImageUrl: varchar('cover_image_url', { length: 1024 }),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  readingTimeMinutes: integer('reading_time_minutes').default(1).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  moderatedBy: varchar('moderated_by', { length: 255 }),
  moderatedAt: timestamp('moderated_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const REPORT_REASONS = [
  'spam',
  'misinformation',
  'harassment',
  'inappropriate',
  'copyright',
  'other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const postReports = pgTable('post_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .references(() => posts.id, { onDelete: 'cascade' })
    .notNull(),
  reporterUserId: uuid('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
  reporterEmail: varchar('reporter_email', { length: 255 }).notNull(),
  reason: varchar('reason', { length: 100 }).$type<ReportReason>().notNull(),
  details: text('details'),
  status: varchar('status', { length: 50 }).$type<'pending' | 'resolved' | 'dismissed'>().default('pending').notNull(),
  resolvedBy: varchar('resolved_by', { length: 255 }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PostRecord = typeof posts.$inferSelect;
export type NewPostRecord = typeof posts.$inferInsert;
export type PostReportRecord = typeof postReports.$inferSelect;
export type NewPostReportRecord = typeof postReports.$inferInsert;
