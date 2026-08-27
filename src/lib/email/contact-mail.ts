import { Resend } from 'resend';
import { escapeHtml, firstName } from './html';

const LOGO_URL = 'https://sinet.africa/images/sinet-logo.svg';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinet.africa';
const WHATSAPP_URL = 'https://wa.me/2349028239706';

function buildContactEmailHtml(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const subject = escapeHtml(data.subject);
  const message = escapeHtml(data.message);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Inquiry – SINet</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F4E9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F8F4E9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header with logo -->
          <tr>
            <td style="background:#0A2342;padding:28px 32px;text-align:center;">
              <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">
                <img src="${LOGO_URL}" alt="SINet" width="140" height="auto" style="display:block;margin:0 auto;max-height:48px;object-fit:contain;" />
              </a>
            </td>
          </tr>

          <!-- Gold accent line -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#D4AF37,#F4D03F,#D4AF37);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#D4AF37;text-transform:uppercase;letter-spacing:0.1em;">New Investor Inquiry</p>
              <h1 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#0A2342;line-height:1.2;">${subject}</h1>

              <!-- Info table -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F8F4E9;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                    <span style="font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Name</span><br/>
                    <span style="font-size:15px;color:#0A2342;font-weight:600;">${name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <span style="font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Email</span><br/>
                    <a href="mailto:${email}" style="font-size:15px;color:#0A2342;font-weight:600;text-decoration:none;">${email}</a>
                  </td>
                </tr>
              </table>

              <!-- Message -->
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Message</p>
              <div style="background:#F8F4E9;border-left:3px solid #D4AF37;border-radius:0 12px 12px 0;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message}</p>
              </div>

              <!-- Reply CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="mailto:${data.email}" style="display:inline-block;background:#D4AF37;color:#0A2342;font-weight:800;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                      Reply to ${name} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0A2342;padding:24px 32px;text-align:center;">
              <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">
                <img src="${LOGO_URL}" alt="SINet" width="100" height="auto" style="display:block;margin:0 auto 12px;max-height:36px;object-fit:contain;opacity:0.9;" />
              </a>
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                <a href="${WHATSAPP_URL}" target="_blank" rel="noopener noreferrer" style="color:#D4AF37;text-decoration:none;">WhatsApp: 0902 823 9706</a>
                &nbsp;·&nbsp;
                <a href="mailto:sinetworkinggobal@gmail.com" style="color:#94a3b8;text-decoration:none;">sinetworkinggobal@gmail.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:#4b5563;">© ${new Date().getFullYear()} SINet. Building Africa's next generation of owners.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildAutoReplyHtml(name: string): string {
  const safeName = firstName(name);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We received your inquiry – SINet</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F4E9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F8F4E9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" role="presentation" style="max-width:620px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">

          <!-- Header with logo -->
          <tr>
            <td style="background:#0A2342;padding:32px;text-align:center;">
              <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">
                <img src="${LOGO_URL}" alt="SINet" width="160" height="auto" style="display:block;margin:0 auto 16px;max-height:56px;object-fit:contain;" />
              </a>
              <p style="margin:0;font-size:12px;color:#D4AF37;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;">Pan-African Investment Ecosystem</p>
            </td>
          </tr>

          <!-- Gold line -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#D4AF37,#F4D03F,#D4AF37);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#0A2342;">Hi ${safeName}, we got your message! 👋</h1>
              <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">
                Thank you for reaching out to SINet. A member of our team will get back to you <strong>within 24 hours</strong>.
              </p>
              <p style="margin:0 0 28px;font-size:16px;color:#374151;line-height:1.7;">
                In the meantime, you can connect with us directly on WhatsApp for the fastest response.
              </p>

              <!-- Stats row -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0A2342;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td width="33%" style="padding:20px;text-align:center;border-right:1px solid #1E3A5F;">
                    <div style="font-size:16px;font-weight:800;color:#D4AF37;">Real Sector</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.08em;">Operations</div>
                  </td>
                  <td width="33%" style="padding:20px;text-align:center;border-right:1px solid #1E3A5F;">
                    <div style="font-size:22px;font-weight:800;color:#D4AF37;">6 Wks</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.08em;">Cycle Duration</div>
                  </td>
                  <td width="33%" style="padding:20px;text-align:center;">
                    <div style="font-size:22px;font-weight:800;color:#D4AF37;">5</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.08em;">Empires Building</div>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${WHATSAPP_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#25D366;color:#ffffff;font-weight:800;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:12px;">
                      💬 Chat on WhatsApp
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${SITE_URL}/membership" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#0d1a4a;color:#ffffff;font-weight:700;font-size:14px;padding:12px 28px;text-decoration:none;">
                      Learn about membership →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0A2342;padding:24px 32px;text-align:center;">
              <a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">
                <img src="${LOGO_URL}" alt="SINet" width="100" height="auto" style="display:block;margin:0 auto 12px;max-height:36px;object-fit:contain;opacity:0.9;" />
              </a>
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">
                <a href="${WHATSAPP_URL}" target="_blank" rel="noopener noreferrer" style="color:#D4AF37;text-decoration:none;">WhatsApp: 0902 823 9706</a>
                &nbsp;·&nbsp;
                <a href="mailto:sinetworkinggobal@gmail.com" style="color:#94a3b8;text-decoration:none;">sinetworkinggobal@gmail.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:#4b5563;">© ${new Date().getFullYear()} SINet. Building Africa's next generation of owners.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.RESEND_CONTACT_TO_EMAIL || 'sinetworkinggobal@gmail.com';

  if (!apiKey || !from) return;

  const resend = new Resend(apiKey);

  // 1. Notify the SINet team
  const { error: notifyError } = await resend.emails.send({
    from,
    to: [to],
    replyTo: data.email,
    subject: `[SINet Inquiry] ${data.subject}`,
    html: buildContactEmailHtml(data),
    text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
  });
  if (notifyError) throw new Error(notifyError.message);

  // 2. Auto-reply to the sender
  const { error: autoReplyError } = await resend.emails.send({
    from,
    to: [data.email],
    subject: `We received your inquiry – SINet`,
    html: buildAutoReplyHtml(data.name),
    text: `Hi ${data.name},\n\nThank you for contacting SINet. We will respond within 24 hours.\n\nFor faster support, reach us on WhatsApp: +234 902 823 9706\n\n— The SINet Team`,
  });
  if (autoReplyError) throw new Error(autoReplyError.message);
}
