/** Escape untrusted values before interpolating them into HTML email templates. */
export function escapeHtml(value: string | undefined | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function firstName(value: string): string {
  return escapeHtml(value.trim().split(/\s+/)[0] || 'there');
}
