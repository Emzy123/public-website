import { db } from '../src/lib/db';
import { universities, chapters, badges } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const KOGI_UNIVERSITIES = [
  {
    name: 'Federal University, Lokoja',
    shortName: 'FULOKOJA',
    campusCode: 'FULOKOJA',
    state: 'Kogi',
    slug: 'fulokoja',
    description: 'Federal University Lokoja Chapter of the Student Investment Network.',
  },
  {
    name: 'Prince Abubakar Audu University, Anyigba',
    shortName: 'PAAU',
    campusCode: 'PAAU',
    state: 'Kogi',
    slug: 'paau',
    description: 'Prince Abubakar Audu University (Anyigba) Chapter of the Student Investment Network.',
  },
  {
    name: 'Confluence University of Science and Technology, Osara',
    shortName: 'CUSTECH',
    campusCode: 'CUSTECH',
    state: 'Kogi',
    slug: 'custech',
    description: 'Confluence University of Science & Technology (Osara) Chapter.',
  },
  {
    name: 'Kogi State University, Kabba',
    shortName: 'KSUK',
    campusCode: 'KSUK',
    state: 'Kogi',
    slug: 'ksuk',
    description: 'Kogi State University Kabba Chapter of the Student Investment Network.',
  },
  {
    name: 'Salem University, Lokoja',
    shortName: 'SALEM',
    campusCode: 'SALEM',
    state: 'Kogi',
    slug: 'salem',
    description: 'Salem University Lokoja Chapter of the Student Investment Network.',
  },
  {
    name: 'Al-Bayan University, Ankpa',
    shortName: 'ALBAYAN',
    campusCode: 'ALBAYAN',
    state: 'Kogi',
    slug: 'albayan',
    description: 'Al-Bayan University Ankpa Chapter of the Student Investment Network.',
  },
];

const INITIAL_BADGES = [
  {
    id: 'verified_member',
    name: 'Verified Member',
    description: 'Officially reviewed and issued a digital SINet Member ID.',
    iconName: 'shield-check',
  },
  {
    id: 'profile_complete',
    name: 'Profile Complete',
    description: 'Completed 100% of member profile, university details, and photo.',
    iconName: 'user-check',
  },
  {
    id: 'first_referral',
    name: 'Community Builder',
    description: 'Invited a fellow student who joined the Student Network.',
    iconName: 'users',
  },
  {
    id: 'chapter_lead',
    name: 'Chapter Lead',
    description: 'Appointed leader or ambassador representing SINet on campus.',
    iconName: 'star',
  },
];

export async function seedMembersDatabase() {
  console.log('Seeding initial Kogi State universities and chapters...');

  for (const uniData of KOGI_UNIVERSITIES) {
    // Check if university already exists
    const [existingUni] = await db
      .select()
      .from(universities)
      .where(eq(universities.campusCode, uniData.campusCode));

    let uniId = existingUni?.id;

    if (!uniId) {
      const [insertedUni] = await db
        .insert(universities)
        .values({
          name: uniData.name,
          shortName: uniData.shortName,
          campusCode: uniData.campusCode,
          state: uniData.state,
        })
        .returning({ id: universities.id });
      uniId = insertedUni.id;
      console.log(`+ University created: ${uniData.name} (${uniData.campusCode})`);
    }

    // Check if chapter exists
    const [existingChapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.slug, uniData.slug));

    if (!existingChapter) {
      await db.insert(chapters).values({
        universityId: uniId,
        slug: uniData.slug,
        name: `SINet ${uniData.shortName} Chapter`,
        description: uniData.description,
      });
      console.log(`+ Chapter created: SINet ${uniData.shortName} Chapter (/chapters/${uniData.slug})`);
    }
  }

  console.log('Seeding initial badges...');
  for (const badgeData of INITIAL_BADGES) {
    const [existingBadge] = await db
      .select()
      .from(badges)
      .where(eq(badges.id, badgeData.id));

    if (!existingBadge) {
      await db.insert(badges).values(badgeData);
      console.log(`+ Badge created: ${badgeData.name} (${badgeData.id})`);
    }
  }

  console.log('Seed completed successfully.');
}

if (require.main === module) {
  seedMembersDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
