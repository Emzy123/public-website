import { getPrimaryNav } from './site-config';

describe('Navigation Structure (Header & Footer)', () => {
  it('primary navigation contains exact required links and community dropdown', () => {
    const nav = getPrimaryNav();
    const labels = nav.map((item) => item.label);

    expect(labels).toContain('About');
    expect(labels).toContain('What We Do');
    expect(labels).toContain('Gallery');
    expect(labels).toContain('News');
    expect(labels).toContain('Community');
    expect(labels).toContain('Contact');

    const community = nav.find((item) => item.label === 'Community');
    expect(community).toBeDefined();
    expect(community?.children).toBeDefined();

    const communityChildren = community?.children?.map((c) => c.label);
    expect(communityChildren).toEqual(['Campus Chapters', 'Student Network', 'Academy']);

    // Critical constraint: Verify Credential is never in header dropdown
    expect(communityChildren).not.toContain('Verify credential');
    expect(communityChildren).not.toContain('Verify Credential');
    expect(labels).not.toContain('Verify Credential');
  });

  it('contains expected URLs for primary items', () => {
    const nav = getPrimaryNav();
    expect(nav.find((i) => i.label === 'About')?.href).toBe('/about');
    expect(nav.find((i) => i.label === 'What We Do')?.href).toBe('/sectors');
    expect(nav.find((i) => i.label === 'Gallery')?.href).toBe('/gallery');
    expect(nav.find((i) => i.label === 'News')?.href).toBe('/news');
    expect(nav.find((i) => i.label === 'Contact')?.href).toBe('/contact');

    const community = nav.find((item) => item.label === 'Community');
    const childMap = Object.fromEntries(community?.children?.map((c) => [c.label, c.href]) || []);
    expect(childMap['Campus Chapters']).toBe('/chapters');
    expect(childMap['Student Network']).toBe('/student-network');
    expect(childMap['Academy']).toBe('/academy');
  });
});
