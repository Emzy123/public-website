import {
  detectApplicationDocMimeType,
  validateApplicationDocUpload,
} from './document-validation';

describe('application document validation', () => {
  it('detects PDF magic bytes', () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    expect(detectApplicationDocMimeType(bytes)).toBe('application/pdf');
  });

  it('detects JPEG', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(detectApplicationDocMimeType(bytes)).toBe('image/jpeg');
  });

  it('rejects empty files', () => {
    const result = validateApplicationDocUpload('application/pdf', 0);
    expect(result.ok).toBe(false);
  });

  it('accepts valid PDF buffer', () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0, 0, 0, 0]);
    const result = validateApplicationDocUpload('application/pdf', bytes.length, 'cv.pdf', bytes);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mime).toBe('application/pdf');
  });
});
