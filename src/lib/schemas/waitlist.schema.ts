import { z } from 'zod';

export const UserTypeEnum = z.enum(['investor', 'learner', 'student', 'builder']);
export type UserType = z.infer<typeof UserTypeEnum>;

export const WaitlistSchema = z.object({
  fullName:           z.string().min(1, 'Full name is required'),
  email:              z.string().email('Valid email address required'),
  phoneNumber:        z.string().optional(),
  country:            z.string().min(1, 'Country is required'),
  userType:           UserTypeEnum,
  sectorInterest:     z.string().min(1, 'Sector interest is required'),
  investmentInterest: z.string().min(1, 'Investment interest is required'),
  hearAbout:          z.string().min(1, 'Please tell us how you heard about us'),
  consent:            z.literal(true, { message: 'You must consent to continue' }),
  website:            z.string().max(0).optional(),
});

export type WaitlistFormData = z.infer<typeof WaitlistSchema>;
