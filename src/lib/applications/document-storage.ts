import { GridFSBucket, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/db/mongodb';

export const APPLICATION_DOCS_BUCKET = 'application_docs';

function getBucket(db: Awaited<ReturnType<typeof getMongoDb>>) {
  return new GridFSBucket(db, { bucketName: APPLICATION_DOCS_BUCKET });
}

export type ApplicationDocMetadata = {
  contentType: string;
  slug: string;
  role: string;
  docKey: string;
  originalFilename: string;
  temporary: boolean;
  applicationId?: string;
  uploadedAt: string;
};

export async function uploadApplicationDocument(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata: Omit<ApplicationDocMetadata, 'contentType' | 'uploadedAt' | 'originalFilename'>
): Promise<string> {
  const db = await getMongoDb();
  const bucket = getBucket(db);
  const id = new ObjectId();

  await new Promise<void>((resolve, reject) => {
    const uploadStream = bucket.openUploadStreamWithId(id, filename, {
      metadata: {
        ...metadata,
        contentType,
        originalFilename: filename,
        uploadedAt: new Date().toISOString(),
      },
    });
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve());
    uploadStream.end(buffer);
  });

  return id.toString();
}

export async function getApplicationDocument(id: string): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
  metadata: Record<string, unknown>;
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
    metadata: (file.metadata || {}) as Record<string, unknown>,
  };
}

/** Verify uploaded docs belong to this slug/role and attach them to an application. */
export async function attachDocumentsToApplication(
  documentIds: string[],
  slug: string,
  role: string,
  applicationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await getMongoDb();
  const filesColl = db.collection(`${APPLICATION_DOCS_BUCKET}.files`);

  for (const id of documentIds) {
    if (!ObjectId.isValid(id)) return { ok: false, error: 'Invalid document reference.' };
    const file = await filesColl.findOne({ _id: new ObjectId(id) });
    if (!file) return { ok: false, error: 'Uploaded document not found. Please re-upload.' };
    const meta = (file.metadata || {}) as Record<string, unknown>;
    if (meta.slug !== slug || meta.role !== role) {
      return { ok: false, error: 'Document does not match this application.' };
    }
    if (meta.applicationId && meta.applicationId !== applicationId) {
      return { ok: false, error: 'Document is already attached to another application.' };
    }
  }

  await filesColl.updateMany(
    { _id: { $in: documentIds.map((id) => new ObjectId(id)) } },
    {
      $set: {
        'metadata.temporary': false,
        'metadata.applicationId': applicationId,
      },
    }
  );

  return { ok: true };
}
