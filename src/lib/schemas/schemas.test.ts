import { ContactSchema } from './contact.schema';
import { AcademyInterestSchema } from './academy.schema';
import { waitlistSchema } from './waitlist.schema';

describe('ContactSchema', () => {
  const valid = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'Partnership',
    message: 'I would like to learn more about SINet.',
    csrfToken: 'test-csrf-token',
  };

  it('accepts valid contact data', () => {
    expect(ContactSchema.parse(valid)).toMatchObject({
      name: valid.name,
      email: valid.email,
      subject: valid.subject,
      message: valid.message,
    });
  });

  it('rejects short messages', () => {
    expect(() =>
      ContactSchema.parse({ ...valid, message: 'short' })
    ).toThrow();
  });

  it('rejects honeypot values', () => {
    expect(() =>
      ContactSchema.parse({ ...valid, website: 'spam-bot' })
    ).toThrow();
  });

  it('rejects missing csrfToken', () => {
    const { csrfToken: _, ...withoutCsrf } = valid;
    expect(() => ContactSchema.parse(withoutCsrf)).toThrow();
  });
});

describe('AcademyInterestSchema', () => {
  const valid = { fullName: 'John Smith', email: 'john@example.com', csrfToken: 'test-csrf-token' };

  it('accepts valid academy interest', () => {
    expect(AcademyInterestSchema.parse(valid)).toMatchObject({
      fullName: valid.fullName,
      email: valid.email,
    });
  });

  it('rejects invalid email', () => {
    expect(() =>
      AcademyInterestSchema.parse({ ...valid, email: 'not-an-email' })
    ).toThrow();
  });

  it('rejects missing csrfToken', () => {
    const { csrfToken: _, ...withoutCsrf } = valid;
    expect(() => AcademyInterestSchema.parse(withoutCsrf)).toThrow();
  });
});

describe('waitlistSchema', () => {
  const valid = {
    fullName: 'Jane Investor',
    email: 'jane@example.com',
    country: 'Nigeria',
    userType: 'investor' as const,
    sectorInterest: 'Agriculture',
    consent: true,
    recaptchaToken: 'token',
    csrfToken: 'csrf',
  };

  it('accepts valid waitlist data', () => {
    expect(waitlistSchema.parse(valid)).toMatchObject(valid);
  });

  it('requires consent', () => {
    expect(() =>
      waitlistSchema.parse({ ...valid, consent: false })
    ).toThrow();
  });

  it('requires valid user type', () => {
    expect(() =>
      waitlistSchema.parse({ ...valid, userType: 'invalid' })
    ).toThrow();
  });
});
