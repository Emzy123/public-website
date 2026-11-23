import { notFound } from 'next/navigation';
import { ContentEditorPage } from '@admin/components/ContentEditorPage';
import { isCmsKey } from '@admin/lib/cms/keys';
import type { CmsKey } from '@admin/types/content';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function AdminContentPage(props: { params: Promise<{ key: string }> }) {
  const params = await props.params;
  if (!isCmsKey(params.key)) {
    notFound();
  }
  return <ContentEditorPage contentKey={params.key as CmsKey} />;
}
