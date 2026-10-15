import { isAdvertSuppressedRoute, ADVERT_SUPPRESSED_PREFIXES } from './suppression';

describe('Advert & Flyer Route Suppression', () => {
  it('suppresses on all required auth routes', () => {
    expect(isAdvertSuppressedRoute('/sign-in')).toBe(true);
    expect(isAdvertSuppressedRoute('/sign-in/')).toBe(true);
    expect(isAdvertSuppressedRoute('/verify-code')).toBe(true);
    expect(isAdvertSuppressedRoute('/2fa')).toBe(true);
  });

  it('suppresses on dashboard and portal routes', () => {
    expect(isAdvertSuppressedRoute('/portal')).toBe(true);
    expect(isAdvertSuppressedRoute('/portal/profile')).toBe(true);
    expect(isAdvertSuppressedRoute('/dashboard')).toBe(true);
    expect(isAdvertSuppressedRoute('/dashboard/pulse')).toBe(true);
  });

  it('suppresses on admin console routes', () => {
    expect(isAdvertSuppressedRoute('/admin')).toBe(true);
    expect(isAdvertSuppressedRoute('/admin/audit')).toBe(true);
    expect(isAdvertSuppressedRoute('/admin/content/adverts')).toBe(true);
  });

  it('suppresses on join wizard routes (including deep links with query parameters)', () => {
    expect(isAdvertSuppressedRoute('/join')).toBe(true);
    expect(isAdvertSuppressedRoute('/join/campus-ambassador')).toBe(true);
    expect(isAdvertSuppressedRoute('/join?role=volunteer')).toBe(true);
    expect(isAdvertSuppressedRoute('/join/3fac46517ba6?role=community-member')).toBe(true);
  });

  it('suppresses on credential verification routes', () => {
    expect(isAdvertSuppressedRoute('/verify')).toBe(true);
    expect(isAdvertSuppressedRoute('/verify/MEM-26-8812')).toBe(true);
  });

  it('allows public marketing routes', () => {
    expect(isAdvertSuppressedRoute('/')).toBe(false);
    expect(isAdvertSuppressedRoute('/about')).toBe(false);
    expect(isAdvertSuppressedRoute('/sectors')).toBe(false);
    expect(isAdvertSuppressedRoute('/news')).toBe(false);
    expect(isAdvertSuppressedRoute('/contact')).toBe(false);
    expect(isAdvertSuppressedRoute('/academy')).toBe(false);
    expect(isAdvertSuppressedRoute('/gallery')).toBe(false);
    expect(isAdvertSuppressedRoute('/membership')).toBe(false);
  });

  it('handles empty or malformed paths gracefully', () => {
    expect(isAdvertSuppressedRoute('')).toBe(false);
    expect(isAdvertSuppressedRoute(null)).toBe(false);
    expect(isAdvertSuppressedRoute(undefined)).toBe(false);
  });
});
