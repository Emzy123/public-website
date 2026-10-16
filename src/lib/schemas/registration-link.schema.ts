import { z } from 'zod';
import { ALL_APPLICATION_ROLES } from '@/lib/types/membership';

export const RESERVED_LINK_SLUGS = new Set([
  'student-network',
  'campus-ambassadors-2026',
]);

export function isReservedLinkSlug(slug?: string | null): boolean {
  if (!slug) return false;
  return RESERVED_LINK_SLUGS.has(slug.toLowerCase().trim());
}

export const createRegistrationLinkSchema = z.object({
  name: z.string().trim().min(2, 'Enter an internal name').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine((s) => !RESERVED_LINK_SLUGS.has(s), {
      message: 'This link slug is reserved for legacy route redirection and cannot be assigned to new links.',
    })
    .optional(),
  roles: z.array(z.enum(ALL_APPLICATION_ROLES)).min(1, 'Select at least one role'),
  expiresAt: z.string().datetime().optional().nullable(),
  quota: z.coerce.number().int().positive().max(10_000).optional().nullable(),
});

export const updateRegistrationLinkSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(120).optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine((s) => !RESERVED_LINK_SLUGS.has(s), {
      message: 'This link slug is reserved for legacy route redirection and cannot be assigned to new links.',
    })
    .optional(),
  roles: z.array(z.enum(ALL_APPLICATION_ROLES)).min(1).optional(),
  isOpen: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  quota: z.coerce.number().int().positive().max(10_000).optional().nullable(),
});

export const waitlistSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  consent: z.literal(true, { message: 'Please confirm you agree to be contacted when applications reopen.' }),
});
