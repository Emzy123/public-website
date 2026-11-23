import { requireRole } from '@/lib/auth/guards';
import { AdminShell } from '@admin/components/AdminShell';
import { PostsModerationInner } from './PostsModerationInner';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata = {
  title: 'Editorial Moderation Queue',
};

export default async function AdminPostsPage() {
  await requireRole(['super_admin', 'admin', 'chapter_lead']);

  return (
    <AdminShell
      title="Editorial Moderation Queue"
      description="Moderate student updates, agricultural dispatches, and campus enterprise articles."
    >
      <PostsModerationInner />
    </AdminShell>
  );
}
