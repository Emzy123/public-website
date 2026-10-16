import { Resend } from 'resend';
import {
  applicationReceivedHtml,
  applicationReceivedText,
  applicationApprovedHtml,
  applicationApprovedText,
  applicationDeclinedHtml,
  applicationDeclinedText,
  applicationUnderReviewHtml,
  applicationUnderReviewText,
  customApplicantEmailHtml,
  customApplicantEmailText,
} from './templates';

export async function sendApplicationStatusEmail(data: {
  email: string;
  name: string;
  pathway: string;
  status: string;
  role?: string;
  reviewNote?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'SINet <no-reply@sinet.africa>';

  if (!data.email) return;

  let subject: string;
  let html: string;
  let text: string;

  switch (data.status) {
    case 'under_review':
      subject = 'Your SINet application is under review';
      html = applicationUnderReviewHtml(data);
      text = applicationUnderReviewText(data);
      break;
    case 'approved':
      subject = 'Your SINet application has been approved';
      html = applicationApprovedHtml(data);
      text = applicationApprovedText(data);
      break;
    case 'declined':
    case 'rejected':
      subject = 'Update on your SINet application';
      html = applicationDeclinedHtml(data);
      text = applicationDeclinedText(data);
      break;
    default:
      return;
  }

  if (!apiKey || apiKey.includes('placeholder')) {
    console.log(`[DEV EMAIL MOCK] To: ${data.email} | Subject: "${subject}" | Status: ${data.status} | Note: "${data.reviewNote || 'none'}"`);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to: [data.email], subject, html, text });
    if (error) console.error('Resend status email error:', error.message);
  } catch (err) {
    console.error('Failed to send status email:', err);
  }
}

export async function sendApplicationReceivedEmail(data: {
  email: string;
  name: string;
  role?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'SINet <no-reply@sinet.africa>';

  if (!data.email) return;

  const subject = 'Your SINet application has been received';
  const html = applicationReceivedHtml(data);
  const text = applicationReceivedText(data);

  if (!apiKey || apiKey.includes('placeholder')) {
    console.log(`[DEV EMAIL MOCK] To: ${data.email} | Subject: "${subject}" | Role: ${data.role || 'Member'}`);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to: [data.email], subject, html, text });
    if (error) console.error('Resend application received email error:', error.message);
  } catch (err) {
    console.error('Failed to send application received email:', err);
  }
}

export async function sendCustomApplicantEmail(data: {
  to: string;
  subject: string;
  message: string;
  applicantName: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'SINet <no-reply@sinet.africa>';

  if (!apiKey || !data.to) return;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [data.to],
    subject: data.subject,
    html: customApplicantEmailHtml(data),
    text: customApplicantEmailText(data),
  });

  if (error) throw new Error(error.message);
}
