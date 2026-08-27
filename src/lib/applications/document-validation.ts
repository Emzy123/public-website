export const APPLICATION_DOC_MAX_BYTES = 5 * 1024 * 1024;

export const APPLICATION_DOC_ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
] as const;

export type ApplicationDocMimeType = (typeof APPLICATION_DOC_ALLOWED_TYPES)[number];

function hasPrefix(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Detect document MIME from magic bytes. DOCX is a ZIP with OOXML structure;
 * we accept ZIP signature for DOCX and rely on declared type + .docx extension.
 */
export function detectApplicationDocMimeType(
  bytes: Uint8Array,
  declaredType?: string,
  filename?: string
): ApplicationDocMimeType | null {
  if (bytes.length < 8) return null;

  if (hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46])) return 'application/pdf'; // %PDF
  if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';

  // OLE Compound File (legacy .doc)
  if (hasPrefix(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return 'application/msword';
  }

  // ZIP / OOXML (.docx)
  if (hasPrefix(bytes, [0x50, 0x4b, 0x03, 0x04]) || hasPrefix(bytes, [0x50, 0x4b, 0x05, 0x06])) {
    const lower = (filename || '').toLowerCase();
    if (lower.endsWith('.docx') || declaredType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
  }

  return null;
}

export function validateApplicationDocUpload(
  contentType: string,
  sizeBytes: number,
  filename?: string,
  bytes?: Uint8Array
): { ok: true; mime: ApplicationDocMimeType } | { ok: false; error: string } {
  if (sizeBytes <= 0) return { ok: false, error: 'File is empty.' };
  if (sizeBytes > APPLICATION_DOC_MAX_BYTES) {
    return {
      ok: false,
      error: `File is too large. Maximum size is ${Math.round(APPLICATION_DOC_MAX_BYTES / (1024 * 1024))}MB.`,
    };
  }
  if (filename && filename.length > 200) {
    return { ok: false, error: 'Filename is too long.' };
  }

  if (!bytes) {
    if (!APPLICATION_DOC_ALLOWED_TYPES.includes(contentType as ApplicationDocMimeType)) {
      return { ok: false, error: 'Unsupported file type. Allowed: PDF, DOC, DOCX, JPEG, PNG.' };
    }
    return { ok: true, mime: contentType as ApplicationDocMimeType };
  }

  const detected = detectApplicationDocMimeType(bytes, contentType, filename);
  if (!detected) {
    return { ok: false, error: 'File contents are not a supported document type.' };
  }

  return { ok: true, mime: detected };
}
