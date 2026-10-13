import { z } from 'zod';

export const CONTACT_TOPICS = [
  'Partnership',
  'Press',
  'Student support',
  'Membership/Applications',
  'Payments',
  'Report a problem',
  'General',
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export function normalizeContactTopic(raw?: string | null): ContactTopic {
  if (!raw) return 'General';
  const lower = raw.toLowerCase().trim();
  if (lower.includes('partner')) return 'Partnership';
  if (lower.includes('press') || lower.includes('media')) return 'Press';
  if (lower.includes('student') || lower.includes('support')) return 'Student support';
  if (lower.includes('member') || lower.includes('applic')) return 'Membership/Applications';
  if (lower.includes('pay') || lower.includes('bill')) return 'Payments';
  if (lower.includes('problem') || lower.includes('report') || lower.includes('bug')) return 'Report a problem';
  return 'General';
}

export const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email address required'),
  topic: z.enum(CONTACT_TOPICS).default('General'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  csrfToken: z.string().min(1, 'Security verification failed'),
  website: z.string().max(0).optional(),
});

export type ContactFormData = z.infer<typeof ContactSchema>;
