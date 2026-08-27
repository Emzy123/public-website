import { campaignApplicationSchema } from '../schemas/application.schema';
import { ROLE_DEFINITIONS } from './role-definitions';

describe('role-driven campaignApplicationSchema', () => {
  const baseContact = {
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: '+2348012345678',
    codeOfConductAccepted: true as const,
  };

  const validDocId = '507f1f77bcf86cd799439011';

  it('accepts a complete staff application with required documents', () => {
    const parsed = campaignApplicationSchema.parse({
      role: 'staff',
      ...baseContact,
      location: 'Kogi',
      education: 'B.Sc Computer Science',
      experienceYears: '3–5 years',
      skills: ['Operations', 'Finance & admin'],
      availability: ['Weekday mornings'],
      emergencyContact: 'Grace Hopper +2348099999999',
      motivation: 'I want to help build durable institutional capacity across SINet pillars and operations.',
      hearAbout: 'SINet website',
      documents: {
        resume: validDocId,
        coverLetter: validDocId,
      },
    });
    expect(parsed.role).toBe('staff');
    expect(parsed.documents.resume).toBe(validDocId);
  });

  it('rejects staff application missing cover letter', () => {
    expect(() =>
      campaignApplicationSchema.parse({
        role: 'staff',
        ...baseContact,
        location: 'Kogi',
        education: 'B.Sc',
        experienceYears: '1–3 years',
        skills: ['Operations'],
        availability: ['Weekends'],
        emergencyContact: 'Contact +2348011111111',
        motivation: 'I want to help build durable institutional capacity across SINet pillars.',
        hearAbout: 'Friend or colleague',
        documents: { resume: validDocId },
      })
    ).toThrow();
  });

  it('accepts partnership interest with required company profile', () => {
    const parsed = campaignApplicationSchema.parse({
      role: 'partnership-interest',
      ...baseContact,
      organization: 'Acme Farms Ltd',
      jobTitle: 'CEO',
      partnershipType: 'Strategic partnership',
      pillarInterest: ['Agriculture'],
      interestDescription:
        'We would like to explore distribution partnerships across trade corridors in the middle belt.',
      hearAbout: 'Event',
      documents: { companyProfile: validDocId },
    });
    expect(parsed.role).toBe('partnership-interest');
  });

  it('defines required documents for every role', () => {
    for (const def of Object.values(ROLE_DEFINITIONS)) {
      expect(def.documents.some((d) => d.required)).toBe(true);
      expect(def.fields.length).toBeGreaterThan(0);
    }
  });
});
