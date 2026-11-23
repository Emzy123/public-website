import { requireRole } from '@/lib/auth/guards';
import { AdminShell } from '@admin/components/AdminShell';
import { PostsModerationInner } from './PostsModerationInner';

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
