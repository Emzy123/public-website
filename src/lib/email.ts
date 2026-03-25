import type { WaitlistFormData } from '@/lib/validation';

export async function sendWaitlistContact(data: WaitlistFormData): Promise<void> {
  const endpoint = process.env.EMAIL_SERVICE_API;
  const apiKey = process.env.EMAIL_SERVICE_KEY;
  const listId = process.env.EMAIL_LIST_ID;

  if (!endpoint || !apiKey || !listId) {
    throw new Error('Email service env vars missing');
  }

  await fetch(`${endpoint.replace(/\/$/, '')}/lists/${listId}/members`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: data.email,
      status: 'subscribed',
      merge_fields: {
        FNAME: data.fullName,
        PHONE: data.phoneNumber ?? '',
        COUNTRY: data.country,
        UTYPE: data.userType,
        SECTOR: data.sectorInterest,
        INVEST: data.investmentInterest ?? '',
      },
      tags: ['sinet', 'waitlist'],
    }),
  });
}
