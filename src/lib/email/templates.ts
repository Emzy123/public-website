import { escapeHtml, firstName } from './html';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinet.africa';
const LOGO_URL = `${SITE_URL}/images/sinet-logo.svg`;
const YEAR = new Date().getFullYear();

function layout(body: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SINet</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f6f2e8;font-family:Inter,Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f6f2e8;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e5e7eb;">

      <!-- Header -->
      <tr>
        <td style="background:#0d1a4a;padding:28px 32px;text-align:center;">
          <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">
            <img src="${LOGO_URL}" alt="SINet" width="140" style="display:block;margin:0 auto;max-height:44px;" />
          </a>
        </td>
      </tr>
      <tr><td style="height:3px;background:linear-gradient(90deg,#D4AF37,#F4D03F,#D4AF37);"></td></tr>

      <!-- Body -->
      <tr><td style="padding:36px 32px;">${body}</td></tr>

      <!-- Footer -->
      <tr>
        <td style="background:#0d1a4a;padding:24px 32px;text-align:center;">
          <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">
            <img src="${LOGO_URL}" alt="SINet" width="100" style="display:block;margin:0 auto 12px;max-height:32px;opacity:0.9;" />
          </a>
          <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
            <a href="${SITE_URL}/privacy" style="color:#94a3b8;text-decoration:underline;">Privacy Policy</a>
          </p>
          <p style="margin:0;font-size:11px;color:#4b5563;">&copy; ${YEAR} SINet. Kogi State, Nigeria.</p>
        </td>
      </tr>

    </table>
  </td></tr>
  </table>
</body>
</html>`;
}

function btn(href: string, label: string, bg = '#0d1a4a', color = '#D4AF37'): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
  <tr><td align="center">
    <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${bg};color:${color};font-weight:700;font-size:14px;padding:14px 32px;text-decoration:none;">
      ${label}
    </a>
  </td></tr></table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr><td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;">
    <span style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;">${label}</span><br/>
    <strong style="font-size:14px;color:#0d1a4a;">${escapeHtml(value)}</strong>
  </td></tr>`;
}

// ─── Application Received ────────────────────────────────────────────

export function applicationReceivedHtml(data: {
  name: string;
  role?: string;
}): string {
  const safeFirstName = firstName(data.name);

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:#D4AF37;font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Application received</p>
    <h1 style="margin:0 0 20px;font-size:24px;color:#0d1a4a;">Thank you, ${safeFirstName}.</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      Your application has been recorded. Our team will review it and get back to you by email.
    </p>

    <div style="background:#f6f2e8;border-left:3px solid #D4AF37;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Your selection</p>
      <p style="margin:0;font-size:14px;color:#374151;"><strong>Role:</strong> ${escapeHtml(data.role || '—')}</p>
    </div>

    <h2 style="margin:0 0 8px;font-size:16px;color:#0d1a4a;">What happens next?</h2>
    <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
      <li>Our team reviews your application</li>
      <li>You receive a decision by email</li>
      <li>If approved, your role is confirmed and onboarding begins</li>
    </ol>

    <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">
      All registrations are subject to review before role assignment.
    </p>

    ${btn(`${SITE_URL}/membership`, 'Learn More About SINet')}
  `, 'Your SINet application has been received.');
}

export function applicationReceivedText(data: { name: string }): string {
  const safeFirstName = data.name.trim().split(/\s+/)[0] || 'there';
  return `Hi ${safeFirstName},\n\nThank you — your SINet application has been recorded.\n\nOur team will review it and get back to you by email.\n\n— The SINet Team\n${SITE_URL}`;
}

// ─── Application Approved ────────────────────────────────────────────

export function applicationApprovedHtml(data: {
  name: string;
  pathway?: string;
  role?: string;
  reviewNote?: string;
}): string {
  const safeFirstName = firstName(data.name);
  const isLegacyInvestment = data.pathway === 'investment';

  const details = [['Role', data.role || '—']];

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:#10b981;font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Application approved</p>
    <h1 style="margin:0 0 20px;font-size:24px;color:#0d1a4a;">Welcome aboard, ${safeFirstName}.</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
      ${isLegacyInvestment
        ? 'Your application has been approved. A member of our team will follow up with next steps.'
        : 'Your application has been approved. Welcome to the SINet community.'}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f2e8;margin-bottom:24px;">
      ${details.map(([l, v]) => infoRow(l, v)).join('')}
    </table>

    ${data.reviewNote ? `<div style="background:#f0fdf4;border-left:3px solid #10b981;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#374151;"><strong>Note from our team:</strong> ${escapeHtml(data.reviewNote)}</p>
    </div>` : ''}

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      A member of our team will reach out with onboarding details for your role.
    </p>

    ${btn(`${SITE_URL}`, 'Visit SINet', '#0d1a4a', '#D4AF37')}
  `, 'Great news — your SINet application has been approved.');
}

export function applicationApprovedText(data: { name: string; reviewNote?: string }): string {
  const safeFirstName = data.name.trim().split(/\s+/)[0] || 'there';
  return `Hi ${safeFirstName},\n\nGreat news — your SINet application has been approved.\n\n${data.reviewNote ? `Note from our team: ${data.reviewNote}\n\n` : ''}We will follow up with next steps.\n\n— The SINet Team\n${SITE_URL}`;
}

// ─── Application Declined ────────────────────────────────────────────

export function applicationDeclinedHtml(data: {
  name: string;
  reviewNote?: string;
}): string {
  const safeFirstName = firstName(data.name);

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:#d9711b;font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Application update</p>
    <h1 style="margin:0 0 20px;font-size:24px;color:#0d1a4a;">Hi ${safeFirstName},</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      Thank you for your interest in SINet. After reviewing your application, we are unable to approve it at this time.
    </p>

    ${data.reviewNote ? `<div style="background:#fef3e2;border-left:3px solid #d9711b;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#374151;"><strong>Feedback:</strong> ${escapeHtml(data.reviewNote)}</p>
    </div>` : ''}

    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      This does not prevent you from applying again when a relevant application period opens. If you believe this decision was made in error, please contact us.
    </p>

    ${btn(`mailto:sinetworkinggobal@gmail.com`, 'Contact Us', '#d9711b', '#ffffff')}
  `, 'An update on your SINet application.');
}

export function applicationDeclinedText(data: { name: string; reviewNote?: string }): string {
  const safeFirstName = data.name.trim().split(/\s+/)[0] || 'there';
  return `Hi ${safeFirstName},\n\nThank you for your interest in SINet. After reviewing your application, we are unable to approve it at this time.\n\n${data.reviewNote ? `Feedback: ${data.reviewNote}\n\n` : ''}You are welcome to apply again when applications reopen.\n\n— The SINet Team\n${SITE_URL}`;
}

// ─── Application Under Review ────────────────────────────────────────

export function applicationUnderReviewHtml(data: {
  name: string;
}): string {
  const safeFirstName = firstName(data.name);

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:#D4AF37;font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Under review</p>
    <h1 style="margin:0 0 20px;font-size:24px;color:#0d1a4a;">Hi ${safeFirstName}, we're reviewing your application.</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      Your application is now being actively reviewed by our team. We will notify you of the outcome by email.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      This review ensures all community members meet our standards and values.
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;">No action is needed from you at this time.</p>
  `, 'Your SINet application is now under review.');
}

export function applicationUnderReviewText(data: { name: string }): string {
  const firstName = data.name.split(' ')[0];
  return `Hi ${firstName},\n\nYour SINet application is now under active review. We will notify you of the outcome by email.\n\nNo action is needed from you at this time.\n\n— The SINet Team\n${SITE_URL}`;
}

// ─── Custom applicant email ──────────────────────────────────────────

export function customApplicantEmailHtml(data: {
  applicantName: string;
  message: string;
}): string {
  const safeFirstName = firstName(data.applicantName);
  const paragraphs = data.message.split('\n').map((p) => `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.7;">${escapeHtml(p)}</p>`).join('');

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:#D4AF37;font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Message from SINet</p>
    <h1 style="margin:0 0 20px;font-size:24px;color:#0d1a4a;">Hi ${safeFirstName},</h1>
    ${paragraphs}
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">— The SINet Team</p>
  `, 'A message from the SINet team about your application.');
}

export function customApplicantEmailText(data: { applicantName: string; message: string }): string {
  const safeFirstName = data.applicantName.trim().split(/\s+/)[0] || 'there';
  return `Hi ${safeFirstName},\n\n${data.message}\n\n— The SINet Team\n${SITE_URL}`;
}

// ─── Newsletter Welcome (waitlist/email capture) ─────────────────────

export function newsletterWelcomeHtml(data: { name: string }): string {
  const firstName = data.name.split(' ')[0];

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:#D4AF37;font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Welcome</p>
    <h1 style="margin:0 0 20px;font-size:24px;color:#0d1a4a;">You're on the list, ${firstName}.</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
      Thank you for joining the SINet mailing list. You'll receive updates on our progress, community activities, and business opportunities.
    </p>

    <div style="background:#f6f2e8;border-left:3px solid #D4AF37;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">What to expect</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">Updates on projects, sector developments, and membership opportunities — not spam.</p>
    </div>

    ${btn(`${SITE_URL}/products`, 'View Products')}
    ${btn(`${SITE_URL}/sectors`, 'See What We Do', '#ffffff', '#0d1a4a')}
  `, `Welcome to SINet — you're on the list.`);
}

export function newsletterWelcomeText(data: { name: string }): string {
  const firstName = data.name.split(' ')[0];
  return `Hi ${firstName},\n\nThank you for joining the SINet mailing list. You'll receive updates on our progress, community activities, and business opportunities.\n\nExplore: ${SITE_URL}/products\n\n— The SINet Team`;
}
