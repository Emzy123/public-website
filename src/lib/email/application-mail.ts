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
} from './templates';

export async function sendApplicationStatusEmail(data: {
  email: string;
  name: string;
  pathway: 'investment' | 'get-involved';
  status: string;
  tier?: string;
  plan?: string;
  role?: string;
  reviewNote?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'SINet <noreply@sinet.africa>';

  if (!apiKey || !data.email) return;

  const resend = new Resend(apiKey);

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
      subject = 'Update on your SINet application';
      html = applicationDeclinedHtml(data);
      text = applicationDeclinedText(data);
      break;
    default:
      return;
  }

  const { error } = await resend.emails.send({ from, to: [data.email], subject, html, text });
  if (error) throw new Error(error.message);
}

export async function sendApplicationReceivedEmail(data: {
  email: string;
  name: string;
  pathway: 'investment' | 'get-involved';
  tier?: string;
  plan?: string;
  role?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'SINet <noreply@sinet.africa>';

  if (!apiKey || !data.email) return;

  const resend = new Resend(apiKey);
  const isInvestment = data.pathway === 'investment';

  const { error } = await resend.emails.send({
    from,
    to: [data.email],
    subject: `Your ${isInvestment ? 'investment application' : 'community registration'} has been received — SINet`,
    html: applicationReceivedHtml(data),
    text: applicationReceivedText(data),
  });

  if (error) throw new Error(error.message);
}
