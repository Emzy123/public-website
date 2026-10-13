import {
  memberApplicationSchema,
  campaignWaitlistSchema,
  STUDENT_DIVISIONS,
} from './member-application.schema';

describe('Member Application Validation Schema', () => {
  const validData = {
    fullName: 'Chinedu Eze',
    email: 'chinedu.eze@fulokoja.edu.ng',
    phone: '+2348031234567',
    universityId: '21d1971c-4594-4b34-a114-39b614033b62',
    programme: 'B.Sc Economics',
    level: '300' as const,
    division: 'student_finance' as const,
    contributionPitch: 'I wish to lead financial modeling workshops and teach equity research.',
    photoUrl: '/images/avatar-placeholder.png',
    referredByCode: 'SIN78XYZ',
    codeOfConductAccepted: true as const,
  };

  it('accepts valid student application payload', () => {
    const result = memberApplicationSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe('Chinedu Eze');
      expect(result.data.division).toBe('student_finance');
      expect(result.data.level).toBe('300');
    }
  });

  it('accepts all 3 student ecosystem divisions', () => {
    for (const div of STUDENT_DIVISIONS) {
      const res = memberApplicationSchema.safeParse({
        ...validData,
        division: div,
      });
      expect(res.success).toBe(true);
    }
  });

  it('rejects invalid student division', () => {
    const res = memberApplicationSchema.safeParse({
      ...validData,
      division: 'investment_banker',
    });
    expect(res.success).toBe(false);
  });

  it('rejects invalid or non-uuid university id', () => {
    const res = memberApplicationSchema.safeParse({
      ...validData,
      universityId: 'not-a-uuid',
    });
    expect(res.success).toBe(false);
  });

  it('rejects pitch shorter than 15 characters', () => {
    const res = memberApplicationSchema.safeParse({
      ...validData,
      contributionPitch: 'Too short',
    });
    expect(res.success).toBe(false);
  });

  it('rejects if code of conduct is not accepted', () => {
    const res = memberApplicationSchema.safeParse({
      ...validData,
      codeOfConductAccepted: false,
    });
    expect(res.success).toBe(false);
  });

  it('validates campaign waitlist schema', () => {
    const validWaitlist = campaignWaitlistSchema.safeParse({
      email: 'student@fulokoja.edu.ng',
      consent: true,
    });
    expect(validWaitlist.success).toBe(true);

    const invalidEmail = campaignWaitlistSchema.safeParse({
      email: 'not-an-email',
      consent: true,
    });
    expect(invalidEmail.success).toBe(false);

    const missingConsent = campaignWaitlistSchema.safeParse({
      email: 'student@fulokoja.edu.ng',
      consent: false,
    });
    expect(missingConsent.success).toBe(false);
  });
});
