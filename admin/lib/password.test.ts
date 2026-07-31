import { hashPassword, verifyPassword, verifyPlainPassword } from '@admin/lib/password';

describe('password helpers', () => {
  it('hashes and verifies a password', () => {
    const stored = hashPassword('secret-pass');
    expect(stored).toContain(':');
    expect(verifyPassword('secret-pass', stored)).toBe(true);
    expect(verifyPassword('wrong-pass', stored)).toBe(false);
  });

  it('compares plain passwords safely', () => {
    expect(verifyPlainPassword('abc', 'abc')).toBe(true);
    expect(verifyPlainPassword('abc', 'abd')).toBe(false);
  });
});
