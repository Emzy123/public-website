import { z } from 'zod';

const contactFields = {
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().min(7, 'Enter a valid phone number').max(30),
};

export const investmentApplicationSchema = z.object({
  pathway: z.literal('investment'),
  tier: z.enum(['student', 'growth', 'strategic']),
  plan: z.enum(['quarterly', 'annual']),
  ...contactFields,
  residentialAddress: z.string().trim().min(8, 'Enter your residential address').max(300),
  nextOfKinName: z.string().trim().min(2, 'Enter your next of kin name').max(120),
  nextOfKinPhone: z.string().trim().min(7, 'Enter your next of kin phone number').max(30),
  amount: z.coerce.number().int().positive().max(100_000_000),
  agreementAccepted: z.literal(true),
});

export const involvementApplicationSchema = z.object({
  pathway: z.literal('get-involved'),
  role: z.enum(['community-member', 'volunteer', 'ambassador', 'staff-partner']),
  ...contactFields,
  location: z.string().trim().min(2, 'Enter your state or location').max(120),
  skills: z.array(z.string().trim().min(1).max(60)).min(1, 'Select at least one relevant skill').max(8),
  availability: z.array(z.string().trim().min(1).max(60)).min(1, 'Select your availability'),
  motivation: z.string().trim().min(15, 'Tell us a little more about your interest').max(1_500),
  codeOfConductAccepted: z.literal(true),
});

export const applicationSchema = z.discriminatedUnion('pathway', [investmentApplicationSchema, involvementApplicationSchema]);
export type InvestmentApplicationInput = z.infer<typeof investmentApplicationSchema>;
export type InvolvementApplicationInput = z.infer<typeof involvementApplicationSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
