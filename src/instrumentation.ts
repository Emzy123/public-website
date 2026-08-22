export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { assertProductionSecrets } = await import('./lib/runtime/secrets');
      assertProductionSecrets();
    } catch (error) {
      // Never take down the public site because of a boot-time security check.
      console.error('[security] Production secret validation failed:', error);
    }
  }
}
