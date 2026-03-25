import { Resend } from 'resend';
import { EmailServiceAdapter, WaitlistPayload } from './index';

export class ResendAdapter implements EmailServiceAdapter {
  async addSubscriber(data: WaitlistPayload): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    if (!apiKey || !audienceId) {
      const message = 'RESEND_API_KEY or RESEND_AUDIENCE_ID not provided.';
      // In production, fail loudly so the UI shows an error instead of "success with no subscriber".
      if (process.env.NODE_ENV === 'production') throw new Error(message);
      console.warn(`${message} Subscriber insertion skipped in dev.`);
      return;
    }

    const resend = new Resend(apiKey);

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
  }
}
