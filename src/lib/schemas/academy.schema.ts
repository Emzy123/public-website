import { z } from 'zod';

export const AcademyInterestSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email address required'),
  csrfToken: z.string().min(1, 'Security verification failed'),
  website: z.string().max(0).optional(),
});

export type AcademyInterestFormData = z.infer<typeof AcademyInterestSchema>;
