import type { CmsDataMap, CmsKey } from '@admin/types/content';
import { contentDiffers } from './diff';
import { getDefaultContent, normalizeAdvertsContent, normalizeGalleryContent, normalizeNewsContent, normalizePartnersContent, normalizeProductsContent, normalizeSiteSettings } from './defaults';
import { CMS_COLLECTION } from './keys';
import { getMongoDb } from '@/lib/db/mongodb';

type CmsDocument = {
  key: string;
  data?: unknown;
  draft?: unknown;
  updatedAt?: string;
  updatedBy?: string;
  draftUpdatedAt?: string;
  draftUpdatedBy?: string;
};

function normalizeContent<K extends CmsKey>(key: K, value: unknown): CmsDataMap[K] {
  if (key === 'site-settings') {
    return normalizeSiteSettings(value as Partial<CmsDataMap['site-settings']>) as CmsDataMap[K];
  }
  if (key === 'gallery') {
    return normalizeGalleryContent(value as Partial<CmsDataMap['gallery']>) as CmsDataMap[K];
  }
  if (key === 'news') {
    return normalizeNewsContent(value as Partial<CmsDataMap['news']>) as CmsDataMap[K];
  }
  if (key === 'products-page') {
    return normalizeProductsContent(value as Partial<CmsDataMap['products-page']>) as CmsDataMap[K];
  }
  if (key === 'partners-page') {
    return normalizePartnersContent(value as Partial<CmsDataMap['partners-page']>) as CmsDataMap[K];
  }
  if (key === 'adverts') {
    return normalizeAdvertsContent(value as Partial<CmsDataMap['adverts']>) as CmsDataMap[K];
  }
  return value as CmsDataMap[K];
}

export type CmsAdminMeta = {
  hasDraft: boolean;
  hasUnpublishedChanges: boolean;
  publishedAt?: string;
  publishedBy?: string;
  draftUpdatedAt?: string;
  draftUpdatedBy?: string;
};

async function fetchDocument(key: CmsKey): Promise<CmsDocument | null> {
  try {
    const db = await getMongoDb();
    return (await db.collection(CMS_COLLECTION).findOne({ key })) as CmsDocument | null;
  } catch {
    return null;
  }
}

export async function getCmsContent<K extends CmsKey>(
  key: K,
  options?: { preview?: boolean }
): Promise<CmsDataMap[K]> {
  const doc = await fetchDocument(key);

  if (options?.preview && doc?.draft !== undefined) {
    return normalizeContent(key, doc.draft);
  }

  if (doc?.data !== undefined) {
    return normalizeContent(key, doc.data);
  }

  return getDefaultContent(key);
}

export async function getCmsContentForAdmin<K extends CmsKey>(
  key: K
): Promise<{ data: CmsDataMap[K]; meta: CmsAdminMeta }> {
  const doc = await fetchDocument(key);
  const published = normalizeContent(
    key,
    doc?.data !== undefined ? doc.data : getDefaultContent(key)
  );
  const hasDraft = doc?.draft !== undefined;
  const data = (hasDraft ? normalizeContent(key, doc!.draft) : published) as CmsDataMap[K];

  return {
    data,
    meta: {
      hasDraft,
      hasUnpublishedChanges: hasDraft && contentDiffers(doc!.draft, published),
      publishedAt: doc?.updatedAt,
      publishedBy: doc?.updatedBy,
      draftUpdatedAt: doc?.draftUpdatedAt,
      draftUpdatedBy: doc?.draftUpdatedBy,
    },
  };
}

/** Writes published content directly (used by seed scripts). */
export async function setCmsContent<K extends CmsKey>(
  key: K,
  data: CmsDataMap[K],
  updatedBy?: string
): Promise<void> {
  const db = await getMongoDb();
  await db.collection(CMS_COLLECTION).updateOne(
    { key },
    {
      $set: {
        key,
        data,
        updatedAt: new Date().toISOString(),
        ...(updatedBy ? { updatedBy } : {}),
      },
    },
    { upsert: true }
  );
}

export async function saveCmsDraft<K extends CmsKey>(
  key: K,
  data: CmsDataMap[K],
  updatedBy?: string
): Promise<void> {
  const db = await getMongoDb();
  await db.collection(CMS_COLLECTION).updateOne(
    { key },
    {
      $set: {
        key,
        draft: data,
        draftUpdatedAt: new Date().toISOString(),
        ...(updatedBy ? { draftUpdatedBy: updatedBy } : {}),
      },
    },
    { upsert: true }
  );
}

export async function publishCmsContent<K extends CmsKey>(
  key: K,
  updatedBy?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const doc = await fetchDocument(key);
  const toPublish = doc?.draft ?? doc?.data;

  if (toPublish === undefined) {
    return { ok: false, error: 'Nothing to publish' };
  }

  const db = await getMongoDb();
  await db.collection(CMS_COLLECTION).updateOne(
    { key },
    {
      $set: {
        key,
        data: toPublish,
        updatedAt: new Date().toISOString(),
        ...(updatedBy ? { updatedBy } : {}),
      },
      $unset: {
        draft: '',
        draftUpdatedAt: '',
        draftUpdatedBy: '',
      },
    },
    { upsert: true }
  );

  return { ok: true };
}

export async function listCmsDocuments() {
  try {
    const db = await getMongoDb();
    const docs = await db
      .collection(CMS_COLLECTION)
      .find(
        {},
        { projection: { key: 1, updatedAt: 1, updatedBy: 1, draftUpdatedAt: 1, draftUpdatedBy: 1 } }
      )
      .toArray();
    return docs;
  } catch {
    return [];
  }
}

export async function seedAllCmsContent(): Promise<Record<string, boolean>> {
  const keys: CmsKey[] = [
    'hero-slides',
    'home',
    'empires-page',
    'about',
    'blueprint',
    'transparency',
    'impact',
    'investor-journey',
    'returns',
    'academy',
    'connect',
    'sectors-page',
    'gallery',
    'news',
    'products-page',
    'partners-page',
    'adverts',
    'waitlist-page',
    'contact-page',
    'site-settings',
  ];
  const results: Record<string, boolean> = {};

  for (const key of keys) {
    try {
      const doc = await fetchDocument(key);
      if (!doc) {
        await setCmsContent(key, getDefaultContent(key), 'seed');
        results[key] = true;
      } else {
        results[key] = false;
      }
    } catch {
      results[key] = false;
    }
  }

  return results;
}
