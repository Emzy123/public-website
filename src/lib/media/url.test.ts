import { buildMediaUrl, extractMediaId, rewriteMediaUrlsDeep, toPublicMediaUrl } from './url';

describe('media url durability', () => {
  it('builds stable public media paths without signatures', () => {
    expect(buildMediaUrl('abc123')).toBe('/api/media/abc123');
  });

  it('strips expired signature query params from stored URLs', () => {
    const expired =
      '/api/media/68abc?expires=1700000000&sig=deadbeef';
    expect(toPublicMediaUrl(expired)).toBe('/api/media/68abc');
    expect(extractMediaId(expired)).toBe('68abc');
  });

  it('rewrites nested CMS payloads', () => {
    const input = {
      items: [
        {
          imageUrl: '/api/media/xyz?expires=1&sig=x',
          nested: { logoUrl: '/api/media/logo1?expires=2&sig=y' },
        },
      ],
      external: 'https://cdn.example/a.jpg',
    };
    expect(rewriteMediaUrlsDeep(input)).toEqual({
      items: [
        {
          imageUrl: '/api/media/xyz',
          nested: { logoUrl: '/api/media/logo1' },
        },
      ],
      external: 'https://cdn.example/a.jpg',
    });
  });
});
