/**
 * Generate a scrypt hash for ADMIN_PASSWORD_HASH.
 * Run: npx tsx scripts/hash-admin-password.ts "your-password"
 */
import { hashPassword } from '../admin/lib/password';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npx tsx scripts/hash-admin-password.ts "your-password"');
  process.exit(1);
}

console.log('\nAdd to .env.local:\n');
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(password)}\n`);
console.log('Remove or unset ADMIN_PASSWORD after setting the hash.\n');
