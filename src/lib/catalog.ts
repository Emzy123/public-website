import type { CatalogPillar } from '@admin/types/content';
import { PILLAR_LABELS, type Pillar } from '@/lib/types/membership';

export function catalogPillarLabel(pillar: CatalogPillar): string {
  if (pillar === 'general') return 'General';
  return PILLAR_LABELS[pillar as Pillar];
}
