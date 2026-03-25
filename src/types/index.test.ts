import { NavLink } from './index';

describe('Dummy Type Test', () => {
  it('should construct NavLink type properly', () => {
    const link: NavLink = { label: 'Test', href: '/test' };
    expect(link.label).toBe('Test');
  });
});
