/**
 * @jest-environment node
 */
import {
  canModerateChapter,
  isGlobalAdmin,
  hasRole,
  type UserRole,
} from './roles';
import { db } from '@/lib/db';
import { auditLog, users } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { writeAdminAudit } from './guards';

describe('Admin & Chapter Lead Moderation Scoping', () => {
  const fulokojaChapId = 'fulokoja-chap-uuid';
  const paauChapId = 'paau-chap-uuid';

  it('allows chapter lead to moderate only their assigned chapter', () => {
    const chapterLeadRoles: UserRole[] = ['chapter_lead'];
    const assignedChapters = [fulokojaChapId];

    // Allowed on their own chapter
    expect(canModerateChapter(chapterLeadRoles, assignedChapters, fulokojaChapId)).toBe(true);

    // Forbidden on a different chapter
    expect(canModerateChapter(chapterLeadRoles, assignedChapters, paauChapId)).toBe(false);
  });

  it('allows global admins universal moderation across all chapters', () => {
    const adminRoles: UserRole[] = ['admin'];
    const superAdminRoles: UserRole[] = ['super_admin'];

    expect(canModerateChapter(adminRoles, [], fulokojaChapId)).toBe(true);
    expect(canModerateChapter(adminRoles, [], paauChapId)).toBe(true);
    expect(canModerateChapter(superAdminRoles, [], fulokojaChapId)).toBe(true);
    expect(canModerateChapter(superAdminRoles, [], paauChapId)).toBe(true);
  });

  it('rejects regular members from chapter moderation', () => {
    const memberRoles: UserRole[] = ['member'];
    expect(canModerateChapter(memberRoles, [fulokojaChapId], fulokojaChapId)).toBe(false);
  });

  it('records administrative actions into audit_log table with full metadata', async () => {
    const testAdminEmail = `audit-test-${Date.now()}@sinet.africa`;
    const uniquePhone = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
    const [adminUser] = await db
      .insert(users)
      .values({ email: testAdminEmail, phone: uniquePhone })
      .returning();

    await writeAdminAudit({
      actorId: adminUser.id,
      actorEmail: testAdminEmail,
      action: 'application_approved',
      resource: 'applications',
      resourceId: 'test-app-123',
      metadata: {
        applicantEmail: 'student@fulokoja.edu.ng',
        division: 'student_finance',
      },
      ipAddress: '127.0.0.1',
    });

    const [recorded] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.actorEmail, testAdminEmail))
      .orderBy(desc(auditLog.createdAt))
      .limit(1);

    expect(recorded).toBeDefined();
    expect(recorded.action).toBe('application_approved');
    expect(recorded.resource).toBe('applications');
    expect(recorded.resourceId).toBe('test-app-123');
    expect(recorded.ipAddress).toBe('127.0.0.1');
    expect((recorded.metadata as any)?.division).toBe('student_finance');
  });
});
