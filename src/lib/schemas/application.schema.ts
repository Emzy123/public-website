import { z } from 'zod';
import { APPLICATION_ROLES, type ApplicationRole } from '@/lib/types/membership';
import {
  ROLE_DEFINITIONS,
  type RoleFieldDef,
  type RoleDocumentDef,
} from '@/lib/applications/role-definitions';

const contactFields = {
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().min(7, 'Enter a valid phone number').max(30),
};

/** 24-char hex ObjectId without importing mongodb (keeps schema testable). */
const objectIdString = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid document reference');

function fieldSchema(field: RoleFieldDef): z.ZodTypeAny {
  const required = field.required !== false;

  switch (field.type) {
    case 'multiselect': {
      let arr = z.array(z.string().trim().min(1).max(120));
      if (field.minItems != null) arr = arr.min(field.minItems, `Select at least ${field.minItems}`);
      if (field.maxItems != null) arr = arr.max(field.maxItems);
      if (field.options?.length) {
        const allowed = new Set(field.options);
        arr = arr.superRefine((vals, ctx) => {
          for (const v of vals) {
            if (!allowed.has(v)) {
              ctx.addIssue({ code: 'custom', message: `Invalid option: ${v}` });
            }
          }
        }) as typeof arr;
      }
      return required ? arr : arr.optional().default([]);
    }
    case 'select': {
      if (field.options?.length) {
        const enumSchema = z.enum(field.options as [string, ...string[]]);
        return required ? enumSchema : enumSchema.optional();
      }
      let s = z.string().trim();
      if (required) s = s.min(1);
      return required ? s : s.optional();
    }
    case 'textarea':
    case 'text':
    case 'phone': {
      let s = z.string().trim();
      if (required) s = s.min(field.minLength ?? 1, `${field.label} is required`);
      else if (field.minLength) s = s.min(field.minLength);
      if (field.maxLength) s = s.max(field.maxLength);
      return required ? s : s.optional().or(z.literal(''));
    }
    case 'email': {
      const s = z.string().trim().email();
      return required ? s : s.optional().or(z.literal(''));
    }
    case 'url': {
      const s = z
        .string()
        .trim()
        .max(field.maxLength ?? 300)
        .refine((v) => !v || /^https?:\/\//i.test(v), { message: 'Enter a valid URL starting with http:// or https://' });
      return required ? s.min(1) : s.optional().or(z.literal(''));
    }
    default:
      return z.string().optional();
  }
}

function documentsSchema(docs: RoleDocumentDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const doc of docs) {
    shape[doc.key] = doc.required
      ? objectIdString
      : objectIdString.optional().or(z.literal('')).transform((v) => (v ? v : undefined));
  }
  return z.object(shape);
}

function buildRoleSchema(role: ApplicationRole) {
  const def = ROLE_DEFINITIONS[role];
  const roleFields: Record<string, z.ZodTypeAny> = {};
  for (const field of def.fields) {
    roleFields[field.key] = fieldSchema(field);
  }

  return z.object({
    role: z.literal(role),
    ...contactFields,
    ...roleFields,
    documents: documentsSchema(def.documents),
    codeOfConductAccepted: z.literal(true),
    website: z.string().max(0).optional(),
  });
}

export const volunteerApplicationSchema = buildRoleSchema('volunteer');
export const ambassadorApplicationSchema = buildRoleSchema('ambassador');
export const communityMemberApplicationSchema = buildRoleSchema('community-member');
export const staffApplicationSchema = buildRoleSchema('staff');
export const partnershipInterestApplicationSchema = buildRoleSchema('partnership-interest');

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
