import fs from 'fs';
import path from 'path';
import { OFFICIAL_LEGAL_NAME, SITE_NAME } from './site-config';

describe('Legal Name and Placeholder Build Verification', () => {
  it('has OFFICIAL_LEGAL_NAME set strictly to Sinetwork Global Ltd.', () => {
    expect(OFFICIAL_LEGAL_NAME).toBe('Sinetwork Global Ltd.');
    expect(SITE_NAME).toBe('SINet');
  });

  it('ensures no public pages or layout components contain the "______" placeholder', () => {
    const srcDir = path.resolve(__dirname, '..');
    const targetDirs = [
      path.join(srcDir, 'app'),
      path.join(srcDir, 'components'),
      path.join(srcDir, 'lib'),
    ];

    const violations: { file: string; line: number; snippet: string }[] = [];

    function scanDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip node_modules, build directories, or git
          if (entry.name !== 'node_modules' && entry.name !== '.next') {
            scanDir(fullPath);
          }
        } else if (
          (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) &&
          !entry.name.includes('.test.')
        ) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('______')) {
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              if (line.includes('______')) {
                violations.push({
                  file: path.relative(srcDir, fullPath),
                  line: idx + 1,
                  snippet: line.trim(),
                });
              }
            });
          }
        }
      }
    }

    for (const dir of targetDirs) {
      scanDir(dir);
    }

    expect(violations).toEqual([]);
  });
});
