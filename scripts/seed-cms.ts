import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

for (const file of ['.env', '.env.local']) {
  const envPath = resolve(process.cwd(), file);
  if (existsSync(envPath)) {
    config({ path: envPath, override: true });
  }
}
import { seedAllCmsContent } from '../admin/lib/cms/repository';

async function main() {
  console.log('Seeding CMS content to MongoDB…');
  const results = await seedAllCmsContent();

  for (const [key, seeded] of Object.entries(results)) {
    console.log(`  ${seeded ? '✓ seeded' : '○ skipped (exists)'}: ${key}`);
  }

  console.log('\nCMS seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
