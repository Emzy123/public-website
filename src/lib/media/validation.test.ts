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
});
