/**
 * @jest-environment node
 */
import { ALL_APPLICATION_ROLES, ROLE_LABELS } from './membership';

describe('Admin applications role filter enum (B4)', () => {
  it('exposes the full application role enum with labels', () => {
    expect(ALL_APPLICATION_ROLES).toEqual([
      'volunteer',
      'staff',
      'community-member',
      'ambassador',
      'partnership-interest',
    ]);
    for (const role of ALL_APPLICATION_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
  });
});
