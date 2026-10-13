export type SubmissionType = 'contact' | 'academy';

export type ContactSubmission = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
  readAt?: string;
  isTest?: boolean;
};

export type AcademySubmission = {
  _id: string;
  fullName: string;
  email: string;
  createdAt?: string;
  readAt?: string;
  isTest?: boolean;
};

export type SubmissionCounts = {
  contacts: { total: number; unread: number };
  academy: { total: number; unread: number };
};

export function matchesSearch(
  type: SubmissionType,
  item: ContactSubmission | AcademySubmission,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (type === 'contact') {
    const c = item as ContactSubmission;
    return [c.name, c.email, c.subject, c.message].some((v) => v.toLowerCase().includes(q));
  }

  const a = item as AcademySubmission;
  return [a.fullName, a.email].some((v) => v.toLowerCase().includes(q));
}

export function isUnread(item: { readAt?: string }): boolean {
  return !item.readAt;
}

export function submissionReplyMailto(type: SubmissionType, item: ContactSubmission | AcademySubmission): string {
  if (type === 'contact') {
    const c = item as ContactSubmission;
    const subject = encodeURIComponent(`Re: ${c.subject}`);
    const body = encodeURIComponent(
      `Hi ${c.name},\n\nThank you for contacting SINet.\n\n---\nOriginal message:\n${c.message}`
    );
    return `mailto:${c.email}?subject=${subject}&body=${body}`;
  }

  const a = item as AcademySubmission;
  const subject = encodeURIComponent('Re: SINet Academy interest');
  const body = encodeURIComponent(`Hi ${a.fullName},\n\nThank you for your interest in SINet Academy.\n\n`);
  return `mailto:${a.email}?subject=${subject}&body=${body}`;
}

export function exportSingleContactCsv(contact: ContactSubmission): void {
  exportSubmissionsCsv([contact], []);
}

export function exportSingleAcademyCsv(academy: AcademySubmission): void {
  exportSubmissionsCsv([], [academy]);
}

export function exportSubmissionsCsv(contacts: ContactSubmission[], academy: AcademySubmission[]): void {
  const rows: string[][] = [
    ['Type', 'Name', 'Email', 'Subject', 'Message', 'Submitted', 'Read'],
  ];

  for (const c of contacts) {
    rows.push([
      'Contact',
      c.name,
      c.email,
      c.subject,
      c.message,
      c.createdAt ? new Date(c.createdAt).toISOString() : '',
      c.readAt ? new Date(c.readAt).toISOString() : '',
    ]);
  }

  for (const a of academy) {
    rows.push([
      'Academy',
      a.fullName,
      a.email,
      '',
      '',
      a.createdAt ? new Date(a.createdAt).toISOString() : '',
      a.readAt ? new Date(a.readAt).toISOString() : '',
    ]);
  }

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sinet-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
