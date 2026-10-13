import { z } from 'zod';

export const STUDENT_DIVISIONS = [
  'student_finance',
  'student_enterprise',
  'governance_records',
] as const;

export type StudentDivision = (typeof STUDENT_DIVISIONS)[number];

export const STUDENT_DIVISION_INFO: Record<
  StudentDivision,
  { name: string; description: string; focus: string }
> = {
  student_finance: {
    name: 'Student Finance Division',
    description: 'Financial literacy, capital markets, investment research, and personal wealth mastery.',
    focus: 'Investment clubs, trading simulations, equity analysis, and campus venture funds.',
  },
  student_enterprise: {
    name: 'Student Enterprise Division',
    description: 'Campus venture creation, entrepreneurship sprints, pitch showcases, and SME growth.',
    focus: 'Student start-ups, business modeling, commercial incubation, and corporate internships.',
  },
  governance_records: {
    name: 'Governance & Records Division',
    description: 'Chapter operations, student advocacy, treasury oversight, and institutional record-keeping.',
    focus: 'Leadership accountability, campus chapter administration, and executive coordination.',
  },
};

export const memberApplicationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your legal or student full name')
    .max(120, 'Full name cannot exceed 120 characters'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid student or personal email address'),
  phone: z
    .string()
    .trim()
    .min(7, 'Please enter a valid phone number')
    .max(25, 'Phone number cannot exceed 25 characters')
    .regex(/^[0-9+() -]+$/, 'Phone number contains invalid characters'),
  universityId: z
    .string()
    .trim()
    .uuid('Please select your accredited tertiary institution'),
  programme: z
    .string()
    .trim()
    .min(2, 'Enter your course or degree programme (e.g. B.Sc Economics)')
    .max(120),
  level: z.enum(['100', '200', '300', '400', '500'], {
    message: 'Please select your current study year / level',
  }),
  division: z.enum(STUDENT_DIVISIONS, {
    message: 'Please choose one of the three student ecosystem divisions',
  }),
  contributionPitch: z
    .string()
    .trim()
    .min(15, 'Please tell us in at least 15 characters why you wish to join and what you will contribute')
    .max(1500, 'Pitch cannot exceed 1500 characters'),
  photoUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .default('/images/avatar-placeholder.png'),
  referredByCode: z
    .string()
    .trim()
    .max(32)
    .optional()
    .or(z.literal('')),
  codeOfConductAccepted: z.literal(true, {
    message: 'You must accept the SINet Community Code of Conduct',
  }),
});

export const campaignWaitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  consent: z.literal(true, {
    message: 'You must confirm consent to receive email updates',
  }),
});

export type MemberApplicationInput = z.input<typeof memberApplicationSchema>;
export type MemberApplicationOutput = z.infer<typeof memberApplicationSchema>;
export type CampaignWaitlistInput = z.infer<typeof campaignWaitlistSchema>;
