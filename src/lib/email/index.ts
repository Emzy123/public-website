import { ResendAdapter } from './resend';
import { UserType } from '../schemas/waitlist.schema';

export interface WaitlistPayload {
  fullName: string;
  email: string;
  phoneNumber?: string;
  country: string;
  userType: UserType;
  sectorInterest: string;
  investmentInterest: string;
  hearAbout: string;
  tags: string[];        // ['waitlist', userType, sectorInterest]
}

export interface EmailServiceAdapter {
  addSubscriber(data: WaitlistPayload): Promise<void>;
}

export function getEmailServiceAdapter(): EmailServiceAdapter {
  const serviceType = process.env.EMAIL_SERVICE || 'resend';
  switch (serviceType.toLowerCase()) {
    case 'resend':
      return new ResendAdapter();
    // other providers can be added here
    default:
      return new ResendAdapter();
  }
}
