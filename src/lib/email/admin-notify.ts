import { Resend } from 'resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinet.africa';

export async function sendAdminSubmissionAlert(data: {
  type: 'contact' | 'academy';
  name: string;
  email: string;
  subject?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.ADMIN_NOTIFY_EMAIL || process.env.RESEND_CONTACT_TO_EMAIL;

  if (!apiKey || !from || !to) return;

  const resend = new Resend(apiKey);
  const label = data.type === 'contact' ? 'Contact form' : 'Academy interest';
  const subjectLine = data.subject ? `${label}: ${data.subject}` : `${label} from ${data.name}`;

  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject: `[SINet Admin] ${subjectLine}`,
    html: `<p><strong>${label}</strong> from <strong>${data.name}</strong> (${data.email})</p>
<p><a href="${SITE_URL}/admin/submissions">View in admin inbox →</a></p>`,
    text: `${label} from ${data.name} (${data.email}). View: ${SITE_URL}/admin/submissions`,
  });

  if (error) throw new Error(error.message);
}
