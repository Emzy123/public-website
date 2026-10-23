export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { assertProductionSecrets } = await import('./lib/runtime/secrets');
      assertProductionSecrets();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith('Fatal:')) {
        throw error;
      }
      console.error('[security] Production secret validation failed:', error);
    }
  }
}
