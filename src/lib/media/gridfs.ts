import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';

export const MEDIA_BUCKET = 'cms_media';

function getBucket(db: Awaited<ReturnType<typeof getMongoDb>>) {
  return new GridFSBucket(db, { bucketName: MEDIA_BUCKET });
}

export async function uploadMedia(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata: Record<string, unknown> = {}
): Promise<string> {
  const db = await getMongoDb();
  const bucket = getBucket(db);
  const id = new ObjectId();

  await new Promise<void>((resolve, reject) => {
    const uploadStream = bucket.openUploadStreamWithId(id, filename, {
      metadata: { ...metadata, contentType },
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve());
    uploadStream.end(buffer);
  });

  return id.toString();
}

export async function getMediaFile(id: string): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
} | null> {
  if (!ObjectId.isValid(id)) return null;

  const db = await getMongoDb();
  const bucket = getBucket(db);
  const objectId = new ObjectId(id);

  const files = await bucket.find({ _id: objectId }).limit(1).toArray();
  if (!files.length) return null;

  const file = files[0];
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    bucket
      .openDownloadStream(objectId)
      .on('data', (chunk: Buffer) => chunks.push(chunk))
      .on('error', reject)
      .on('end', () => resolve());
  });

  const contentType =
    (typeof file.metadata?.contentType === 'string' ? file.metadata.contentType : null) ??
    'application/octet-stream';

  return {
    buffer: Buffer.concat(chunks),
    contentType,
    filename: file.filename,
  };
}

export type MediaListItem = {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt?: string;
  uploadedBy?: string;
  url: string;
};

export async function listMedia(limit = 50, skip = 0): Promise<{ items: MediaListItem[]; total: number }> {
  const db = await getMongoDb();
  const bucket = getBucket(db);
  const files = await bucket
    .find({})
    .sort({ uploadDate: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  const total = await db.collection(`${MEDIA_BUCKET}.files`).countDocuments();

  const items: MediaListItem[] = files.map((file) => {
    const id = file._id.toString();
    const contentType =
      (typeof file.metadata?.contentType === 'string' ? file.metadata.contentType : null) ??
      'application/octet-stream';

    return {
      id,
      filename: file.filename,
      contentType,
      size: file.length,
      uploadedAt: typeof file.metadata?.uploadedAt === 'string' ? file.metadata.uploadedAt : undefined,
      uploadedBy: typeof file.metadata?.uploadedBy === 'string' ? file.metadata.uploadedBy : undefined,
      url: `/api/media/${id}`,
    };
  });

  return { items, total };
}
