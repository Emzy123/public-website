import { z } from 'zod';
import { APPLICATION_ROLES } from '@/lib/types/membership';

const contactFields = {
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().min(7, 'Enter a valid phone number').max(30),
};

const communityRoleFields = {
  ...contactFields,
  location: z.string().trim().min(2, 'Enter your state or location').max(120),
  skills: z.array(z.string().trim().min(1).max(60)).min(1, 'Select at least one relevant skill').max(8),
  availability: z.array(z.string().trim().min(1).max(60)).min(1, 'Select your availability'),
  motivation: z.string().trim().min(15, 'Tell us a little more about your interest').max(1_500),
  codeOfConductAccepted: z.literal(true),
};

export const volunteerApplicationSchema = z.object({
  role: z.literal('volunteer'),
  ...communityRoleFields,
});

export const ambassadorApplicationSchema = z.object({
  role: z.literal('ambassador'),
  ...communityRoleFields,
});

export const communityMemberApplicationSchema = z.object({
  role: z.literal('community-member'),
  ...communityRoleFields,
});

export const staffApplicationSchema = z.object({
  role: z.literal('staff'),
  ...communityRoleFields,
});

export const partnershipInterestApplicationSchema = z.object({
  role: z.literal('partnership-interest'),
  ...contactFields,
  organization: z.string().trim().max(200).optional(),
  interestDescription: z.string().trim().min(15, 'Describe your interest').max(2_000),
  codeOfConductAccepted: z.literal(true),
});

export const campaignApplicationSchema = z.discriminatedUnion('role', [
  volunteerApplicationSchema,
  ambassadorApplicationSchema,
  communityMemberApplicationSchema,
  staffApplicationSchema,
  partnershipInterestApplicationSchema,
]);

/** @deprecated Legacy investment pathway — retained for existing records only */
export const investmentApplicationSchema = z.object({
  pathway: z.literal('investment'),
  tier: z.enum(['student', 'growth', 'strategic']),
  plan: z.enum(['quarterly', 'annual']),
  ...contactFields,
  residentialAddress: z.string().trim().min(8).max(300),
  nextOfKinName: z.string().trim().min(2).max(120),
  nextOfKinPhone: z.string().trim().min(7).max(30),
  amount: z.coerce.number().int().positive().max(100_000_000),
  agreementAccepted: z.literal(true),
});

/** @deprecated Legacy get-involved pathway */
export const involvementApplicationSchema = z.object({
  pathway: z.literal('get-involved'),
  role: z.enum(['community-member', 'volunteer', 'ambassador', 'staff-partner']),
  ...contactFields,
  location: z.string().trim().min(2).max(120),
  skills: z.array(z.string().trim().min(1).max(60)).min(1).max(8),
  availability: z.array(z.string().trim().min(1).max(60)).min(1),
  motivation: z.string().trim().min(15).max(1_500),
  codeOfConductAccepted: z.literal(true),
});

export const legacyApplicationSchema = z.discriminatedUnion('pathway', [
  investmentApplicationSchema,
  involvementApplicationSchema,
]);

export type CampaignApplicationInput = z.infer<typeof campaignApplicationSchema>;
export type LegacyApplicationInput = z.infer<typeof legacyApplicationSchema>;

export function roleSchemaFor(role: (typeof APPLICATION_ROLES)[number]) {
  return campaignApplicationSchema.options.find((s) => {
    const shape = s.shape as { role?: { value?: string } };
    return shape.role?.value === role;
  });
}
