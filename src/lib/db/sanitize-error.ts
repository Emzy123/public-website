/**
 * Sanitizes raw database connection/query errors into safe, high-level diagnosis strings.
 * Security guarantee: NEVER exposes URLs, hosts, ports, IP addresses, users, or credentials.
 * Preserved from commit 8a09f8b.
 */
export function sanitizeDatabaseError(err: unknown): string {
  if (!err) return 'unknown error';
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string | number })?.code ? String((err as { code?: string | number }).code) : '';
  const combined = `${msg} ${code}`.toLowerCase();

  if (
    combined.includes('econnrefused') ||
    combined.includes('connection refused') ||
    combined.includes('connect refused')
  ) {
    return 'connection refused';
  }
  if (
    combined.includes('password authentication failed') ||
    combined.includes('authentication failed') ||
    combined.includes('auth failed') ||
    combined.includes('bad auth') ||
    combined.includes('28p01') ||
    combined.includes('28000')
  ) {
    return 'auth failed';
  }
  if (
    combined.includes('ssl') ||
    combined.includes('tls') ||
    combined.includes('encryption') ||
    combined.includes('certificate') ||
    combined.includes('no pg_hba.conf entry')
  ) {
    return 'SSL required';
  }
  if (
    combined.includes('etimedout') ||
    combined.includes('timeout') ||
    combined.includes('timed out') ||
    combined.includes('connect_timeout')
  ) {
    return 'timeout';
  }
  if (
    combined.includes('enotfound') ||
    combined.includes('getaddrinfo') ||
    combined.includes('dns')
  ) {
    return 'host not found (DNS lookup failed)';
  }
  if (combined.includes('database') && combined.includes('does not exist')) {
    return 'database does not exist';
  }
  if (combined.includes('relation') && combined.includes('does not exist')) {
    return 'relation or schema missing';
  }
  if (combined.includes('does not exist')) {
    return 'resource does not exist';
  }
  if (combined.includes('duplicate key') || combined.includes('23505')) {
    return 'unique constraint violation';
  }
  if (combined.includes('syntax error') || combined.includes('42601')) {
    return 'query syntax error';
  }
  if (combined.includes('read-only') || combined.includes('25006')) {
    return 'database is read-only';
  }
  if (combined.includes('remaining connection slots') || combined.includes('too many clients') || combined.includes('53300')) {
    return 'connection limit exceeded';
  }

  // Strip hostnames, IPs, ports, and connection URIs from uncategorized errors
  return msg
    .replace(/postgresql:\/\/[^@]+@/gi, 'postgresql://***:***@')
    .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, 'mongodb://***:***@')
    .replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[redacted-ip]')
    .replace(/:\d{2,5}\b/g, ':[redacted-port]')
    .replace(/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/g, '[redacted-host]')
    .slice(0, 120)
    .trim() || 'database error';
}
