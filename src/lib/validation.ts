import { z } from 'zod';

export const waitlistSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().optional(),
  country: z.string().min(1, 'Please select your country'),
  userType: z.enum(['investor', 'learner', 'student', 'builder'], {
    error: 'Please select how you want to join',
  }),
  sectorInterest: z.string().min(1, 'Please select a sector'),
  investmentInterest: z.enum(['50000', '100000+', 'learning']).optional(),
  hearAbout: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to receive updates',
  }),
  recaptchaToken: z.string().min(1, 'reCAPTCHA verification required'),
  csrfToken: z.string().min(1, 'Security verification failed'),
  website: z.string().optional(),
});

export type WaitlistFormData = z.infer<typeof waitlistSchema>;
