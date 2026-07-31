'use server';

import { waitlistSchema, WaitlistFormData } from '@/lib/schemas/waitlist.schema';
import { ContactSchema, ContactFormData } from '@/lib/schemas/contact.schema';

export type ActionResult<T = unknown> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function submitWaitlistAction(data: WaitlistFormData): Promise<ActionResult> {
  try {
    const parseResult = waitlistSchema.safeParse(data);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      return {
        success: false,
        error: 'Validation failed. Please check your inputs.',
        fieldErrors: flattened.fieldErrors,
      };
    }

    // Honeypot bot protection check
    if (data.website && data.website.length > 0) {
      return { success: true, message: 'Submission received.' };
    }

    // Process waitlist submission securely on the server
    return {
      success: true,
      message: 'Thank you for joining the waitlist! We will be in touch soon.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}

export async function submitContactAction(data: ContactFormData): Promise<ActionResult> {
  try {
    const parseResult = ContactSchema.safeParse(data);
    if (!parseResult.success) {
      const flattened = parseResult.error.flatten();
      return {
        success: false,
        error: 'Validation failed. Please check your inputs.',
        fieldErrors: flattened.fieldErrors,
      };
    }

    if (data.website && data.website.length > 0) {
      return { success: true, message: 'Message sent successfully.' };
    }

    return {
      success: true,
      message: 'Your message has been received. Our team will contact you shortly.',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred.',
    };
  }
}
