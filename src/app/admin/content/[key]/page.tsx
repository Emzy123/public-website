import { notFound } from 'next/navigation';
import { ContentEditorPage } from '@admin/components/ContentEditorPage';
import { isCmsKey } from '@admin/lib/cms/keys';
import type { CmsKey } from '@admin/types/content';

export default function AdminContentPage({ params }: { params: { key: string } }) {
  if (!isCmsKey(params.key)) {
    notFound();
  }
  return <ContentEditorPage contentKey={params.key as CmsKey} />;
}
