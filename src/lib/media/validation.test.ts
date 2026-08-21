import { MEDIA_MAX_BYTES, validateMediaUpload } from './validation';

describe('validateMediaUpload', () => {
  it('accepts allowed image types under the size limit', () => {
    expect(validateMediaUpload('image/jpeg', 1024, 'photo.jpg')).toEqual({ ok: true });
    expect(validateMediaUpload('image/png', 1024)).toEqual({ ok: true });
    expect(validateMediaUpload('image/webp', 1024)).toEqual({ ok: true });
  });

  it('rejects unsupported types', () => {
    const result = validateMediaUpload('application/pdf', 1024, 'doc.pdf');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/unsupported file type/i);
    }
  });

  it('rejects empty files', () => {
    expect(validateMediaUpload('image/png', 0)).toEqual({ ok: false, error: 'File is empty.' });
  });

  it('rejects files over the max size', () => {
    const result = validateMediaUpload('image/jpeg', MEDIA_MAX_BYTES + 1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/too large/i);
    }
  });

  it('rejects a declared type that does not match the file signature', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(validateMediaUpload('image/png', jpeg.length, 'photo.png', jpeg)).toEqual({
      ok: false,
      error: 'File contents do not match the declared image type.',
    });
  });

  it('accepts matching file signatures', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(validateMediaUpload('image/png', png.length, 'photo.png', png)).toEqual({ ok: true });
  });
});
