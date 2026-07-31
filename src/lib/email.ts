import type { WaitlistFormData } from '@/lib/schemas/waitlist.schema';
import { getEmailServiceAdapter } from './email/index';

export async function sendWaitlistContact(data: WaitlistFormData): Promise<void> {
  // Use provider-specific adapter (currently defaults to Resend).
  // This keeps the waitlist endpoint independent from provider API details.
  const adapter = getEmailServiceAdapter();

  await adapter.addSubscriber({
    fullName: data.fullName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    country: data.country,
    userType: data.userType,
    sectorInterest: data.sectorInterest,
    investmentInterest: data.investmentInterest ?? '',
    hearAbout: data.hearAbout ?? '',
    tags: ['waitlist', data.userType, data.sectorInterest],
  });
}
