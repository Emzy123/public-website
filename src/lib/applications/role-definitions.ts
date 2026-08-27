import type { ApplicationRole } from '@/lib/types/membership';
import { ROLE_LABELS } from '@/lib/types/membership';
import { PILLARS, PILLAR_LABELS } from '@/lib/types/membership';

export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'phone' | 'email' | 'url';

export type RoleFieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
};

export type RoleDocumentDef = {
  key: string;
  label: string;
  helpText?: string;
  required: boolean;
  /** Browser accept attribute hint */
  accept: string;
};

export type RoleDefinition = {
  role: ApplicationRole;
  label: string;
  tag: string;
  detail: string;
  fields: RoleFieldDef[];
  documents: RoleDocumentDef[];
};

const PILLAR_OPTIONS = PILLARS.map((p) => PILLAR_LABELS[p]);

const SKILL_OPTIONS = [
  'Community outreach',
  'Event support',
  'Social media',
  'Sales & marketing',
  'Design',
  'Logistics',
  'Operations',
  'Finance & admin',
  'Teaching / facilitation',
  'Research',
];

const AVAILABILITY_OPTIONS = [
  'Weekday mornings',
  'Weekday evenings',
  'Weekends',
  'Flexible / on-call',
];

const PARTNERSHIP_TYPES = [
  'Strategic partnership',
  'Supply / distribution',
  'Investment discussion',
  'Sponsorship',
  'Other collaboration',
];

const EXPERIENCE_OPTIONS = ['Less than 1 year', '1–3 years', '3–5 years', '5+ years'];

const HEAR_ABOUT_OPTIONS = [
  'SINet website',
  'Social media',
  'Friend or colleague',
  'Campus / school',
  'Event',
  'Other',
];

export const ROLE_DEFINITIONS: Record<ApplicationRole, RoleDefinition> = {
  volunteer: {
    role: 'volunteer',
    label: ROLE_LABELS.volunteer,
    tag: 'FIELD',
    detail: 'Support outreach, events, and on-ground community programs.',
    fields: [
      {
        key: 'location',
        label: 'State / location',
        type: 'text',
        required: true,
        minLength: 2,
        maxLength: 120,
      },
      {
        key: 'pillarInterest',
        label: 'Which pillars interest you most?',
        type: 'multiselect',
        required: true,
        options: PILLAR_OPTIONS,
        minItems: 1,
        maxItems: 3,
      },
      {
        key: 'skills',
        label: 'Relevant skills',
        type: 'multiselect',
        required: true,
        options: SKILL_OPTIONS,
        minItems: 1,
        maxItems: 8,
      },
      {
        key: 'availability',
        label: 'Weekly availability',
        type: 'multiselect',
        required: true,
        options: AVAILABILITY_OPTIONS,
        minItems: 1,
        maxItems: 4,
      },
      {
        key: 'experienceYears',
        label: 'Relevant experience',
        type: 'select',
        required: true,
        options: EXPERIENCE_OPTIONS,
      },
      {
        key: 'motivation',
        label: 'Why do you want to volunteer with SINet?',
        type: 'textarea',
        required: true,
        minLength: 40,
        maxLength: 1_500,
      },
      {
        key: 'hearAbout',
        label: 'How did you hear about SINet?',
        type: 'select',
        required: true,
        options: HEAR_ABOUT_OPTIONS,
      },
    ],
    documents: [
      {
        key: 'resume',
        label: 'CV / resume or experience summary',
        helpText: 'PDF preferred. Summarise relevant community or field experience.',
        required: true,
        accept: '.pdf,.doc,.docx,application/pdf,image/jpeg,image/png',
      },
    ],
  },

  staff: {
    role: 'staff',
    label: ROLE_LABELS.staff,
    tag: 'INTERNAL',
    detail: 'Apply for an internal role with SINet.',
    fields: [
      {
        key: 'location',
        label: 'State / location',
        type: 'text',
        required: true,
        minLength: 2,
        maxLength: 120,
      },
      {
        key: 'education',
        label: 'Highest education / credentials',
        type: 'text',
        required: true,
        minLength: 2,
        maxLength: 200,
      },
      {
        key: 'experienceYears',
        label: 'Years of professional experience',
        type: 'select',
        required: true,
        options: EXPERIENCE_OPTIONS,
      },
      {
        key: 'skills',
        label: 'Core skills',
        type: 'multiselect',
        required: true,
        options: SKILL_OPTIONS,
        minItems: 1,
        maxItems: 8,
      },
      {
        key: 'availability',
        label: 'Availability',
        type: 'multiselect',
        required: true,
        options: AVAILABILITY_OPTIONS,
        minItems: 1,
        maxItems: 4,
      },
      {
        key: 'linkedinUrl',
        label: 'LinkedIn or portfolio URL',
        type: 'url',
        required: false,
        maxLength: 300,
      },
      {
        key: 'emergencyContact',
        label: 'Emergency contact (name & phone)',
        type: 'text',
        required: true,
        minLength: 5,
        maxLength: 200,
      },
      {
        key: 'motivation',
        label: 'Why do you want to join the SINet team?',
        type: 'textarea',
        required: true,
        minLength: 40,
        maxLength: 2_000,
      },
      {
        key: 'hearAbout',
        label: 'How did you hear about this role?',
        type: 'select',
        required: true,
        options: HEAR_ABOUT_OPTIONS,
      },
    ],
    documents: [
      {
        key: 'resume',
        label: 'CV / resume',
        helpText: 'PDF preferred.',
        required: true,
        accept: '.pdf,.doc,.docx,application/pdf',
      },
      {
        key: 'coverLetter',
        label: 'Cover letter',
        helpText: 'PDF or DOCX explaining your fit for an internal role.',
        required: true,
        accept: '.pdf,.doc,.docx,application/pdf',
      },
    ],
  },

  'community-member': {
    role: 'community-member',
    label: ROLE_LABELS['community-member'],
    tag: 'COMMUNITY',
    detail: 'Join the SINet network, events, resources, and updates.',
    fields: [
      {
        key: 'location',
        label: 'State / location',
        type: 'text',
        required: true,
        minLength: 2,
        maxLength: 120,
      },
      {
        key: 'pillarInterest',
        label: 'Which pillars interest you?',
        type: 'multiselect',
        required: true,
        options: PILLAR_OPTIONS,
        minItems: 1,
        maxItems: 3,
      },
      {
        key: 'skills',
        label: 'Skills you can contribute',
        type: 'multiselect',
        required: true,
        options: SKILL_OPTIONS,
        minItems: 1,
        maxItems: 8,
      },
      {
        key: 'availability',
        label: 'Availability for community activities',
        type: 'multiselect',
        required: true,
        options: AVAILABILITY_OPTIONS,
        minItems: 1,
        maxItems: 4,
      },
      {
        key: 'motivation',
        label: 'What do you hope to gain or contribute as a community member?',
        type: 'textarea',
        required: true,
        minLength: 30,
        maxLength: 1_500,
      },
      {
        key: 'hearAbout',
        label: 'How did you hear about SINet?',
        type: 'select',
        required: true,
        options: HEAR_ABOUT_OPTIONS,
      },
    ],
    documents: [
      {
        key: 'profile',
        label: 'Short profile PDF or government-issued ID',
        helpText: 'One PDF or clear photo of a valid ID or a one-page profile.',
        required: true,
        accept: '.pdf,application/pdf,image/jpeg,image/png',
      },
    ],
  },

  ambassador: {
    role: 'ambassador',
    label: ROLE_LABELS.ambassador,
    tag: 'GROWTH',
    detail: 'Represent SINet on campus or in your region.',
    fields: [
      {
        key: 'location',
        label: 'State / location',
        type: 'text',
        required: true,
        minLength: 2,
        maxLength: 120,
      },
      {
        key: 'campusOrRegion',
        label: 'Campus, school, or region you will represent',
        type: 'text',
        required: true,
        minLength: 2,
        maxLength: 200,
      },
      {
        key: 'pillarInterest',
        label: 'Pillars you will champion',
        type: 'multiselect',
        required: true,
        options: PILLAR_OPTIONS,
        minItems: 1,
        maxItems: 3,
      },
      {
        key: 'skills',
        label: 'Relevant skills',
        type: 'multiselect',
        required: true,
        options: SKILL_OPTIONS,
        minItems: 1,
        maxItems: 8,
      },
      {
        key: 'availability',
        label: 'Availability',
        type: 'multiselect',
        required: true,
        options: AVAILABILITY_OPTIONS,
        minItems: 1,
        maxItems: 4,
      },
      {
        key: 'socialReach',
        label: 'Approximate community or social reach',
        type: 'text',
        required: true,
        helpText: 'e.g. campus club size, followers, or networks you can activate.',
        minLength: 5,
        maxLength: 300,
      },
      {
        key: 'motivation',
        label: 'Why do you want to be a SINet ambassador?',
        type: 'textarea',
        required: true,
        minLength: 40,
        maxLength: 1_500,
      },
      {
        key: 'hearAbout',
        label: 'How did you hear about SINet?',
        type: 'select',
        required: true,
        options: HEAR_ABOUT_OPTIONS,
      },
    ],
    documents: [
      {
        key: 'resume',
        label: 'CV / resume',
        required: true,
        accept: '.pdf,.doc,.docx,application/pdf',
      },
      {
        key: 'recommendation',
        label: 'Campus / org ID or recommendation letter',
        helpText: 'Student ID, org membership proof, or a short recommendation PDF.',
        required: true,
        accept: '.pdf,.doc,.docx,application/pdf,image/jpeg,image/png',
      },
    ],
  },

  'partnership-interest': {
    role: 'partnership-interest',
    label: ROLE_LABELS['partnership-interest'],
    tag: 'PARTNERSHIP',
    detail: 'Express interest in a business partnership — our team will follow up directly.',
    fields: [
      {
        key: 'organization',
        label: 'Organization name',
        type: 'text',
        required: true,
        minLength: 2,
        maxLength: 200,
      },
      {
        key: 'jobTitle',
        label: 'Your role / title',
        type: 'text',
        required: true,
        minLength: 2,
        maxLength: 120,
      },
      {
        key: 'organizationWebsite',
        label: 'Organization website',
        type: 'url',
        required: false,
        maxLength: 300,
      },
      {
        key: 'partnershipType',
        label: 'Type of partnership interest',
        type: 'select',
        required: true,
        options: PARTNERSHIP_TYPES,
      },
      {
        key: 'pillarInterest',
        label: 'Relevant SINet pillars',
        type: 'multiselect',
        required: true,
        options: PILLAR_OPTIONS,
        minItems: 1,
        maxItems: 3,
      },
      {
        key: 'interestDescription',
        label: 'Describe your partnership interest',
        type: 'textarea',
        required: true,
        minLength: 40,
        maxLength: 2_000,
      },
      {
        key: 'hearAbout',
        label: 'How did you hear about SINet?',
        type: 'select',
        required: true,
        options: HEAR_ABOUT_OPTIONS,
      },
    ],
    documents: [
      {
        key: 'companyProfile',
        label: 'Company profile or pitch deck',
        helpText: 'PDF preferred (profile, deck, or capability statement).',
        required: true,
        accept: '.pdf,.doc,.docx,application/pdf',
      },
      {
        key: 'brochure',
        label: 'Brochure or supporting material (optional)',
        required: false,
        accept: '.pdf,.doc,.docx,application/pdf,image/jpeg,image/png',
      },
    ],
  },
};

export function getRoleDefinition(role: ApplicationRole): RoleDefinition {
  return ROLE_DEFINITIONS[role];
}

export function fieldLabelFor(role: ApplicationRole, key: string): string {
  const def = ROLE_DEFINITIONS[role];
  const field = def.fields.find((f) => f.key === key);
  if (field) return field.label;
  const contactLabels: Record<string, string> = {
    fullName: 'Full name',
    email: 'Email',
    phone: 'Phone',
    role: 'Role',
    codeOfConductAccepted: 'Code of conduct',
  };
  return contactLabels[key] || key;
}

export function documentLabelFor(role: ApplicationRole, key: string): string {
  return ROLE_DEFINITIONS[role].documents.find((d) => d.key === key)?.label || key;
}

export const WIZARD_STEP_LABELS = [
  'Choose Role',
  'Your Details',
  'Role Questions',
  'Documents',
  'Verification',
  'Review & Submit',
] as const;
