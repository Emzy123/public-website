import { pgTable, uuid, varchar, text, integer, boolean, timestamp, char, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

export const universities = pgTable('universities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  shortName: varchar('short_name', { length: 50 }).notNull(),
  campusCode: varchar('campus_code', { length: 10 }).notNull().unique(),
  state: varchar('state', { length: 50 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const chapters = pgTable('chapters', {
  id: uuid('id').defaultRandom().primaryKey(),
  universityId: uuid('university_id')
    .notNull()
    .unique()
    .references(() => universities.id, { onDelete: 'restrict' }),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  memberCount: integer('member_count').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const campusIdSequences = pgTable(
  'campus_id_sequences',
  {
    campusCode: varchar('campus_code', { length: 10 }).notNull(),
    yearPrefix: char('year_prefix', { length: 2 }).notNull(),
    lastSeq: integer('last_seq').default(0).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.campusCode, table.yearPrefix] }),
  })
);

export const memberIds = pgTable('member_ids', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'restrict' }),
  memberId: varchar('member_id', { length: 32 }).notNull().unique(),
  campusCode: varchar('campus_code', { length: 10 }).notNull(),
  yearPrefix: char('year_prefix', { length: 2 }).notNull(),
  sequenceNumber: integer('sequence_number').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  issuedBy: uuid('issued_by').references(() => users.id, { onDelete: 'set null' }),
});

export type University = typeof universities.$inferSelect;
export type NewUniversity = typeof universities.$inferInsert;
export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;
export type MemberIdRecord = typeof memberIds.$inferSelect;
export type NewMemberIdRecord = typeof memberIds.$inferInsert;
