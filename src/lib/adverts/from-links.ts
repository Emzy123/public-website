import { ObjectId } from 'mongodb';
import type { AdvertItem } from '@admin/types/content';
import { getMongoDb } from '@/lib/db/mongodb';
import {
  REGISTRATION_LINKS_COLLECTION,
  isLinkAcceptingApplications,
  maybeAutoCloseLink,
  serialiseRegistrationLink,
} from '@/lib/registration-links';
import { registrationLinkToAdvert } from './link-advert';

export { registrationLinkToAdvert } from './link-advert';

/** Open campaign links that should appear in the public advert spotlight. */
export async function getOpenRegistrationLinkAdverts(): Promise<AdvertItem[]> {
  try {
    const db = await getMongoDb();
    const docs = await db
      .collection(REGISTRATION_LINKS_COLLECTION)
      .find({ isOpen: true })
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray();

    const adverts: AdvertItem[] = [];
    let order = -100;

    for (const doc of docs) {
      const linkDoc = doc as typeof doc & { _id: ObjectId };
      await maybeAutoCloseLink(db, linkDoc);
      if (!isLinkAcceptingApplications(linkDoc)) continue;
      const link = serialiseRegistrationLink(linkDoc);
      adverts.push(registrationLinkToAdvert(link, order));
      order += 1;
    }

    return adverts;
  } catch {
    return [];
  }
}
