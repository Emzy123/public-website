import { escapeHtml, firstName } from './html';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinet.africa';
const LOGO_URL = `${SITE_URL}/images/sinet-logo.svg`;
const YEAR = new Date().getFullYear();
const CONTACT_EMAIL = process.env.RESEND_CONTACT_TO_EMAIL || 'sinetworkinggobal@gmail.com';

const NAVY = '#0d1a4a';
const TERRACOTTA = '#d9711b';
const CREAM = '#f6f2e8';
const MUTED = '#585146';

function layout(body: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SINet</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:Georgia,'Times New Roman',serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${CREAM};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e4dcc9;">

      <tr>
        <td style="background:${NAVY};padding:28px 32px;text-align:center;">
          <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">
            <img src="${LOGO_URL}" alt="SINet" width="140" style="display:block;margin:0 auto;max-height:44px;" />
          </a>
        </td>
      </tr>
      <tr><td style="height:3px;background:${TERRACOTTA};"></td></tr>

      <tr><td style="padding:36px 32px;font-family:Arial,Helvetica,sans-serif;">${body}</td></tr>

      <tr>
        <td style="background:${NAVY};padding:24px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
          <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">
            <img src="${LOGO_URL}" alt="SINet" width="100" style="display:block;margin:0 auto 12px;max-height:32px;opacity:0.9;" />
          </a>
          <p style="margin:0 0 6px;font-size:12px;color:#9ea8d0;">
            <a href="${SITE_URL}/privacy" style="color:#9ea8d0;text-decoration:underline;">Privacy Policy</a>
            &nbsp;·&nbsp;
            <a href="${SITE_URL}/membership" style="color:#9ea8d0;text-decoration:underline;">Membership</a>
          </p>
          <p style="margin:0;font-size:11px;color:#6b7280;">&copy; ${YEAR} SINet. Kogi State, Nigeria.</p>
        </td>
      </tr>

    </table>
  </td></tr>
  </table>
</body>
</html>`;
}

function btn(href: string, label: string, bg = NAVY, color = '#ffffff'): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
  <tr><td align="center">
    <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${bg};color:${color};font-weight:700;font-size:14px;padding:14px 32px;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">
      ${label}
    </a>
  </td></tr></table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr><td style="padding:10px 16px;border-bottom:1px solid #e4dcc9;">
    <span style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;font-family:Arial,Helvetica,sans-serif;">${label}</span><br/>
    <strong style="font-size:14px;color:${NAVY};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(value)}</strong>
  </td></tr>`;
}

export function applicationReceivedHtml(data: {
  name: string;
  role?: string;
}): string {
  const safeFirstName = firstName(data.name);

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:${TERRACOTTA};font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Application received</p>
    <h1 style="margin:0 0 20px;font-size:26px;color:${NAVY};font-family:Georgia,'Times New Roman',serif;">Thank you, ${safeFirstName}.</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${MUTED};line-height:1.7;">
      We have received your application to join SINet. Our team will review your details and supporting documents carefully.
    </p>

    <div style="background:${CREAM};border-left:3px solid ${TERRACOTTA};padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">Your selection</p>
      <p style="margin:0;font-size:14px;color:${MUTED};"><strong>Role:</strong> ${escapeHtml(data.role || '—')}</p>
    </div>

    <h2 style="margin:0 0 8px;font-size:16px;color:${NAVY};">What happens next?</h2>
    <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;color:${MUTED};line-height:1.8;">
      <li>Our team reviews your application and documents</li>
      <li>You receive a decision by email at the address you provided</li>
      <li>If approved, we confirm your role and share onboarding steps</li>
    </ol>

    <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">
      All registrations are subject to review before role assignment. No further action is needed from you right now.
    </p>

    ${btn(`${SITE_URL}/membership`, 'Learn more about SINet', TERRACOTTA, '#ffffff')}
  `, 'Your SINet application has been received.');
}

export function applicationReceivedText(data: { name: string; role?: string }): string {
  const safeFirstName = data.name.trim().split(/\s+/)[0] || 'there';
  return `Hi ${safeFirstName},\n\nThank you — your SINet application${data.role ? ` for ${data.role}` : ''} has been recorded.\n\nOur team will review it and get back to you by email.\n\n— The SINet Team\n${SITE_URL}`;
}

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
    <p style="margin:0 0 4px;font-size:11px;color:#059669;font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Application approved</p>
    <h1 style="margin:0 0 20px;font-size:26px;color:${NAVY};font-family:Georgia,'Times New Roman',serif;">Welcome aboard, ${safeFirstName}.</h1>
    <p style="margin:0 0 20px;font-size:15px;color:${MUTED};line-height:1.7;">
      ${isLegacyInvestment
        ? 'Your application has been approved. A member of our team will follow up with next steps.'
        : 'Great news — your application has been approved. Welcome to the SINet community.'}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};margin-bottom:24px;">
      ${details.map(([l, v]) => infoRow(l, v)).join('')}
    </table>

    ${data.reviewNote ? `<div style="background:#ecfdf5;border-left:3px solid #059669;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:${MUTED};"><strong>Note from our team:</strong> ${escapeHtml(data.reviewNote)}</p>
    </div>` : ''}

    <p style="margin:0 0 16px;font-size:15px;color:${MUTED};line-height:1.7;">
      A member of our team will reach out shortly with onboarding details for your role. Please watch your inbox (and spam folder) for that message.
    </p>

    ${btn(SITE_URL, 'Visit SINet', NAVY, '#ffffff')}
  `, 'Great news — your SINet application has been approved.');
}

export function applicationApprovedText(data: { name: string; role?: string; reviewNote?: string }): string {
  const safeFirstName = data.name.trim().split(/\s+/)[0] || 'there';
  return `Hi ${safeFirstName},\n\nGreat news — your SINet application${data.role ? ` for ${data.role}` : ''} has been approved.\n\n${data.reviewNote ? `Note from our team: ${data.reviewNote}\n\n` : ''}We will follow up with onboarding next steps.\n\n— The SINet Team\n${SITE_URL}`;
}

export function applicationDeclinedHtml(data: {
  name: string;
  reviewNote?: string;
}): string {
  const safeFirstName = firstName(data.name);

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:${TERRACOTTA};font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Application update</p>
    <h1 style="margin:0 0 20px;font-size:26px;color:${NAVY};font-family:Georgia,'Times New Roman',serif;">Hi ${safeFirstName},</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${MUTED};line-height:1.7;">
      Thank you for your interest in SINet and for taking the time to apply. After careful review, we are unable to approve your application at this time.
    </p>

    ${data.reviewNote ? `<div style="background:#fef3e2;border-left:3px solid ${TERRACOTTA};padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:${MUTED};"><strong>Feedback:</strong> ${escapeHtml(data.reviewNote)}</p>
    </div>` : ''}

    <p style="margin:0 0 16px;font-size:15px;color:${MUTED};line-height:1.7;">
      This does not prevent you from applying again when a relevant application period opens. If you believe this decision was made in error, please contact us.
    </p>

    ${btn(`mailto:${CONTACT_EMAIL}`, 'Contact us', TERRACOTTA, '#ffffff')}
  `, 'An update on your SINet application.');
}

export function applicationDeclinedText(data: { name: string; reviewNote?: string }): string {
  const safeFirstName = data.name.trim().split(/\s+/)[0] || 'there';
  return `Hi ${safeFirstName},\n\nThank you for your interest in SINet. After reviewing your application, we are unable to approve it at this time.\n\n${data.reviewNote ? `Feedback: ${data.reviewNote}\n\n` : ''}You are welcome to apply again when applications reopen.\n\n— The SINet Team\n${SITE_URL}`;
}

export function applicationUnderReviewHtml(data: {
  name: string;
}): string {
  const safeFirstName = firstName(data.name);

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:${TERRACOTTA};font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Under review</p>
    <h1 style="margin:0 0 20px;font-size:26px;color:${NAVY};font-family:Georgia,'Times New Roman',serif;">Hi ${safeFirstName}, we&apos;re reviewing your application.</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${MUTED};line-height:1.7;">
      Your application is now being actively reviewed by our team, including any documents you submitted. We will notify you of the outcome by email.
    </p>
    <p style="margin:0;font-size:13px;color:#6b7280;">No action is needed from you at this time.</p>
  `, 'Your SINet application is now under review.');
}

export function applicationUnderReviewText(data: { name: string }): string {
  const safeFirstName = data.name.trim().split(/\s+/)[0] || 'there';
  return `Hi ${safeFirstName},\n\nYour SINet application is now under active review. We will notify you of the outcome by email.\n\nNo action is needed from you at this time.\n\n— The SINet Team\n${SITE_URL}`;
}

export function customApplicantEmailHtml(data: {
  applicantName: string;
  message: string;
}): string {
  const safeFirstName = firstName(data.applicantName);
  const paragraphs = data.message
    .split('\n')
    .map((p) => `<p style="margin:0 0 12px;font-size:15px;color:${MUTED};line-height:1.7;">${escapeHtml(p)}</p>`)
    .join('');

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:${TERRACOTTA};font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Message from SINet</p>
    <h1 style="margin:0 0 20px;font-size:26px;color:${NAVY};font-family:Georgia,'Times New Roman',serif;">Hi ${safeFirstName},</h1>
    ${paragraphs}
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">— The SINet Team</p>
  `, 'A message from the SINet team about your application.');
}

export function customApplicantEmailText(data: { applicantName: string; message: string }): string {
  const safeFirstName = data.applicantName.trim().split(/\s+/)[0] || 'there';
  return `Hi ${safeFirstName},\n\n${data.message}\n\n— The SINet Team\n${SITE_URL}`;
}

export function newsletterWelcomeHtml(data: { name: string }): string {
  const safeFirstName = firstName(data.name);

  return layout(`
    <p style="margin:0 0 4px;font-size:11px;color:${TERRACOTTA};font-weight:700;text-transform:uppercase;letter-spacing:.15em;">Welcome</p>
    <h1 style="margin:0 0 20px;font-size:26px;color:${NAVY};font-family:Georgia,'Times New Roman',serif;">You&apos;re on the list, ${safeFirstName}.</h1>
    <p style="margin:0 0 16px;font-size:15px;color:${MUTED};line-height:1.7;">
      Thank you for joining the SINet mailing list. You&apos;ll receive updates on our progress, community activities, and opportunities across our pillars.
    </p>

    <div style="background:${CREAM};border-left:3px solid ${TERRACOTTA};padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;font-weight:700;text-transform:uppercase;">What to expect</p>
      <p style="margin:0;font-size:14px;color:${MUTED};line-height:1.6;">Updates on projects, sector developments, and membership opportunities — not spam.</p>
    </div>

    ${btn(`${SITE_URL}/sectors`, 'See what we do', TERRACOTTA, '#ffffff')}
  `, `Welcome to SINet — you're on the list.`);
}

export function newsletterWelcomeText(data: { name: string }): string {
  const safeFirstName = data.name.trim().split(/\s+/)[0] || 'there';
  return `Hi ${safeFirstName},\n\nThank you for joining the SINet mailing list. You'll receive updates on our progress, community activities, and opportunities.\n\nExplore: ${SITE_URL}/sectors\n\n— The SINet Team`;
}
