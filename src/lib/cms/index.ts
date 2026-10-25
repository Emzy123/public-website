import { isPreviewMode } from '@admin/lib/preview';

export {
  listCmsDocuments,
  saveCmsDraft,
  publishCmsContent,
  setCmsContent,
} from '@admin/lib/cms/repository';
export { getDefaultContent } from '@admin/lib/cms/defaults';
export type { CmsAdminMeta } from '@admin/lib/cms/repository';
export type * from '@admin/types/content';

import { getCmsContent as getPublishedOrPreviewContent } from '@admin/lib/cms/repository';
import type { CmsKey, CmsDataMap } from '@admin/types/content';
import { gateUnsignedCmsContent } from '@/lib/compliance/unsigned-claims';

/** Public-site CMS reader. Uses draft content when preview mode cookie is active. */
export async function getCmsContent<K extends CmsKey>(key: K): Promise<CmsDataMap[K]> {
  const content = await getPublishedOrPreviewContent(key, { preview: isPreviewMode() });
  return gateUnsignedCmsContent(content);
}
