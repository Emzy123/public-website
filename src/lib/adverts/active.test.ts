import type { AdvertItem } from '@admin/types/content';
import { getActiveAdverts, getPrimaryAdvert } from './active';

function advert(partial: Partial<AdvertItem> & Pick<AdvertItem, 'id' | 'title'>): AdvertItem {
  return {
    eyebrow: '',
    body: '',
    imageUrl: '',
    ctaLabel: '',
    ctaHref: '',
    enabled: true,
    showModal: true,
    startsAt: '',
    endsAt: '',
    sortOrder: 0,
    ...partial,
  };
}

describe('getActiveAdverts', () => {
  const now = Date.parse('2026-09-29T12:00:00Z');

  it('filters disabled and empty titles', () => {
    const items = [
      advert({ id: '1', title: 'Live', enabled: true, sortOrder: 1 }),
      advert({ id: '2', title: 'Off', enabled: false, sortOrder: 0 }),
      advert({ id: '3', title: '   ', enabled: true, sortOrder: 2 }),
    ];
    expect(getActiveAdverts({ items }, now).map((a) => a.id)).toEqual(['1']);
  });

  it('respects schedule windows', () => {
    const items = [
      advert({ id: 'future', title: 'Future', startsAt: '2026-10-01', sortOrder: 0 }),
      advert({ id: 'past', title: 'Past', endsAt: '2026-09-01', sortOrder: 1 }),
      advert({ id: 'live', title: 'Live', startsAt: '2026-09-01', endsAt: '2026-09-30', sortOrder: 2 }),
    ];
    expect(getActiveAdverts({ items }, now).map((a) => a.id)).toEqual(['live']);
  });

  it('returns primary as first by sort order', () => {
    const items = [
      advert({ id: 'b', title: 'B', sortOrder: 2 }),
      advert({ id: 'a', title: 'A', sortOrder: 0 }),
    ];
    expect(getPrimaryAdvert({ items }, now)?.id).toBe('a');
  });
});
