import { Resend } from 'resend';
import { EmailServiceAdapter, WaitlistPayload } from './index';

const LOGO_URL = 'https://sinet.africa/images/logo.jpg';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sinet.africa';
const WHATSAPP_URL = 'https://wa.me/2349028239706';

function buildWaitlistWelcomeEmailHtml(data: {
  fullName: string;
  userType: string;
  sectorInterest: string;
}): string {
  const name = data.fullName.split(' ')[0];
  const sector = data.sectorInterest;
  const userType = data.userType;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to the SINet Waitlist</title>
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
                <img src="${LOGO_URL}" alt="SINet" width="140" height="auto" style="display:block;margin:0 auto 16px;max-height:48px;object-fit:contain;" />
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
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0A2342;">Welcome to the Movement, ${name}! 🌍</h1>
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
                Thank you for joining the SINet waitlist. You have successfully secured your prioritized spot. We're excited to have you on board as we build a youth-driven economic infrastructure across Africa.
              </p>
              
              <div style="background:#F8F4E9;border-left:4px solid #D4AF37;padding:16px 20px;margin-bottom:28px;border-radius:0 12px 12px 0;">
                <h3 style="margin:0 0 8px;font-size:14px;color:#0A2342;font-weight:700;">Waitlist Preferences:</h3>
                <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Role:</strong> ${userType.toUpperCase()}</p>
                <p style="margin:0;font-size:14px;color:#374151;"><strong>Primary Empire Interest:</strong> ${sector}</p>
              </div>

              <h2 style="margin:24px 0 12px;font-size:18px;font-weight:800;color:#0A2342;">What Happens Next?</h2>
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
                Our platform launches in structured phases. As a waitlist member, you'll receive early access to deploy capital, track investment cycles, and review operational progress before the general public.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <a href="${WHATSAPP_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#25D366;color:#ffffff;font-weight:800;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:12px;">
                      💬 Join the Waitlist Community on WhatsApp
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${SITE_URL}/blueprint" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#0A2342;color:#D4AF37;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
                      Read the Blueprint →
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

export class ResendAdapter implements EmailServiceAdapter {
  async addSubscriber(data: WaitlistPayload): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'SINet <noreply@sinet.africa>';

    if (!apiKey || !audienceId) {
      const message = 'RESEND_API_KEY or RESEND_AUDIENCE_ID not provided.';
      // In production, fail loudly so the UI shows an error instead of "success with no subscriber".
      if (process.env.NODE_ENV === 'production') throw new Error(message);
      console.warn(`${message} Subscriber insertion skipped in dev.`);
      return;
    }

    const resend = new Resend(apiKey);

    // 1. Add contact to the Resend audience list
    const { error } = await resend.contacts.create({
      email: data.email,
      unsubscribed: false,
      audienceId,
      firstName: data.fullName.split(' ')[0],
      lastName: data.fullName.split(' ').slice(1).join(' '),
    });

    if (error) {
      throw new Error(`Resend adapter error: ${error.message}`);
    }

    // 2. Send the branded welcome transactional email
    try {
      await resend.emails.send({
        from: fromEmail,
        to: [data.email],
        subject: 'Welcome to the SINet Waitlist! 🌍',
        html: buildWaitlistWelcomeEmailHtml({
          fullName: data.fullName,
          userType: data.userType,
          sectorInterest: data.sectorInterest,
        }),
        text: `Hi ${data.fullName.split(' ')[0]},\n\nThank you for joining the SINet waitlist. You have secured your spot!\n\nPreferences:\nRole: ${data.userType.toUpperCase()}\nEmpire: ${data.sectorInterest}\n\nJoin us on WhatsApp: ${WHATSAPP_URL}\n\n— The SINet Team`,
      });
    } catch (emailErr: any) {
      console.warn('Welcome email failed to send:', emailErr);
      // Don't fail the entire submission if welcome email send fails (non-blocking)
    }
  }
}
