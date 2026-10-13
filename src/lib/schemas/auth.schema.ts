import { z } from 'zod';

export const RequestOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .toLowerCase(),
  mode: z.enum(['otp', 'magic_link']).default('otp'),
  recaptchaToken: z.string().optional(),
});

export const VerifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .toLowerCase(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit verification code'),
});

export const Verify2faSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit authenticator code'),
});

export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type Verify2faInput = z.infer<typeof Verify2faSchema>;
