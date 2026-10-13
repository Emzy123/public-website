import { CONTACT_TOPICS, normalizeContactTopic, ContactSchema } from './schemas/contact.schema';

describe('Contact Topics and Schema', () => {
  it('defines the 7 required contact topics', () => {
    expect(CONTACT_TOPICS).toEqual([
      'Partnership',
      'Press',
      'Student support',
      'Membership/Applications',
      'Payments',
      'Report a problem',
      'General',
    ]);
  });

  it('normalizes topic queries from URL parameter', () => {
    expect(normalizeContactTopic('partnership')).toBe('Partnership');
    expect(normalizeContactTopic('press')).toBe('Press');
    expect(normalizeContactTopic('media')).toBe('Press');
    expect(normalizeContactTopic('student-support')).toBe('Student support');
    expect(normalizeContactTopic('membership')).toBe('Membership/Applications');
    expect(normalizeContactTopic('payments')).toBe('Payments');
    expect(normalizeContactTopic('problem')).toBe('Report a problem');
    expect(normalizeContactTopic('general')).toBe('General');
    expect(normalizeContactTopic('')).toBe('General');
    expect(normalizeContactTopic(null)).toBe('General');
  });

  it('validates contact schema with valid topic', () => {
    const valid = ContactSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      topic: 'Partnership',
      subject: 'Collaboration opportunity',
      message: 'We would love to partner with SINet on agricultural commerce.',
      csrfToken: 'test-csrf-token',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.topic).toBe('Partnership');
    }
  });

  it('defaults topic to General if omitted', () => {
    const valid = ContactSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Inquiry',
      message: 'Hello, I have a quick question about SINet.',
      csrfToken: 'test-csrf-token',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.topic).toBe('General');
    }
  });
});
