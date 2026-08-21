import { escapeHtml, firstName } from './html';

describe('email HTML sanitization', () => {
  it('escapes every HTML-significant character', () => {
    expect(escapeHtml(`<img src="x" onerror='bad'>&`)).toBe('&lt;img src=&quot;x&quot; onerror=&#39;bad&#39;&gt;&amp;');
  });

  it('returns an escaped first name with a safe fallback', () => {
    expect(firstName('  <Ada> Okonkwo ')).toBe('&lt;Ada&gt;');
    expect(firstName('   ')).toBe('there');
  });
});
