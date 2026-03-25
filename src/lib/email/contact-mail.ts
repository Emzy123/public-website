import { Resend } from 'resend';

export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.RESEND_CONTACT_TO_EMAIL || 'contact@sinet.africa';

  if (!apiKey || !from) return;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: data.email,
    subject: `[SINet Contact] ${data.subject}`,
    text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
  });

  if (error) throw new Error(error.message);
}
