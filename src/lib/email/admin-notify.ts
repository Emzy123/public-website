import { Resend } from 'resend';
import { escapeHtml } from './html';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinet.africa';
const LOGO_URL = `${SITE_URL}/images/sinet-logo.svg`;

function buildAdminAlertHtml(data: { type: string; label: string; name: string; email: string; subject?: string }): string {
  const label = escapeHtml(data.label);
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const subject = escapeHtml(data.subject || `New ${data.type} submission`);
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f6f2e8;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f2e8;padding:32px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:#fff;border:1px solid #e5e7eb;">
  <tr><td style="background:#0d1a4a;padding:24px 32px;text-align:center;">
    <a href="${SITE_URL}"><img src="${LOGO_URL}" alt="SINet" width="120" style="display:block;margin:0 auto;max-height:40px;" /></a>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(90deg,#D4AF37,#F4D03F,#D4AF37);"></td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 4px;font-size:11px;color:#D4AF37;font-weight:700;text-transform:uppercase;letter-spacing:.15em;">${label}</p>
    <h1 style="margin:0 0 20px;font-size:20px;color:#0d1a4a;">${subject}</h1>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f2e8;margin-bottom:24px;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;"><span style="font-size:11px;color:#9ca3af;text-transform:uppercase;">Name</span><br/><strong style="color:#0d1a4a;">${name}</strong></td></tr>
      <tr><td style="padding:12px 16px;"><span style="font-size:11px;color:#9ca3af;text-transform:uppercase;">Email</span><br/><a href="mailto:${email}" style="color:#0d1a4a;text-decoration:none;">${email}</a></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${SITE_URL}/admin/submissions" style="display:inline-block;background:#0d1a4a;color:#D4AF37;font-weight:700;font-size:14px;padding:12px 28px;text-decoration:none;">View in Admin →</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="background:#0d1a4a;padding:20px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#4b5563;">© ${new Date().getFullYear()} SINet. Kogi State, Nigeria.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

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
    html: buildAdminAlertHtml({ ...data, label }),
    text: `${label} from ${data.name} (${data.email}). View: ${SITE_URL}/admin/submissions`,
  });

  if (error) throw new Error(error.message);
}
