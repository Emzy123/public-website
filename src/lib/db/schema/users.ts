import { pgTable, uuid, varchar, timestamp, boolean, pgEnum, unique } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role_type', [
  'super_admin',
  'admin',
  'chapter_lead',
  'publisher',
  'member',
  'applicant',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }).unique(),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
  totpSecret: varchar('totp_secret', { length: 255 }),
  totpEnabled: boolean('totp_enabled').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: userRoleEnum('role').notNull(),
    chapterId: uuid('chapter_id'),
    assignedBy: uuid('assigned_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userRoleChapterUnique: unique('uq_user_role_chapter').on(table.userId, table.role, table.chapterId),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRoleRecord = typeof userRoles.$inferSelect;
export type NewUserRoleRecord = typeof userRoles.$inferInsert;
