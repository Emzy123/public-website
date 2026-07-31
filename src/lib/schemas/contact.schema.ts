import { z } from 'zod';

export const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email address required'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  csrfToken: z.string().min(1, 'Security verification failed'),
  website: z.string().max(0).optional(),
});

export type ContactFormData = z.infer<typeof ContactSchema>;
