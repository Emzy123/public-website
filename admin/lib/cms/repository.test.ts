import { contentDiffers } from './diff';

describe('contentDiffers', () => {
  it('returns false for identical objects', () => {
    expect(contentDiffers({ a: 1 }, { a: 1 })).toBe(false);
  });

  it('returns true when values differ', () => {
    expect(contentDiffers({ a: 1 }, { a: 2 })).toBe(true);
  });

  it('returns true when keys differ', () => {
    expect(contentDiffers({ a: 1 }, { b: 1 })).toBe(true);
  });
});
