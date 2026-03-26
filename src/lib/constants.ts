export const empires = [
  {
    id: 'fashion',
    name: 'Fashion & Creative Empire',
    description: 'Fashion, makeup, graphics, media, studios',
    icon: '/images/sectors/fashion-icon.svg',
    subSectors: ['Fashion Design', 'Makeup & Beauty', 'Graphics Design', 'Media Production', 'Creative Studios'],
    investmentFocus: 'Supporting African creatives and fashion brands scaling to global markets.',
  },
  {
    id: 'food',
    name: 'Food & Processing Empire',
    description: 'Bakery, packaged foods, cassava processing, beverages, livestock',
    icon: '/images/sectors/food-icon.svg',
    subSectors: ['Bakery', 'Packaged Foods', 'Cassava Processing', 'Beverages', 'Livestock'],
    investmentFocus: 'Value-added food processing and agricultural transformation.',
  },
  {
    id: 'tech',
    name: 'Tech & Innovation Empire',
    description: 'SINet App, software, AI, fintech, Student Marketplace',
    icon: '/images/sectors/tech-icon.svg',
    subSectors: ['Software Development', 'AI Solutions', 'Fintech', 'Student Marketplace', 'SINet App'],
    investmentFocus: "Building Africa's digital infrastructure and innovation ecosystem.",
  },
  {
    id: 'social',
    name: 'Social Impact & NGO Empire',
    description: 'Grants, partnerships, education, community projects',
    icon: '/images/sectors/social-icon.svg',
    subSectors: ['Grants Management', 'Partnerships', 'Education Programs', 'Community Development'],
    investmentFocus: 'Sustainable development and community empowerment initiatives.',
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Agribusiness Empire',
    description: 'Farming, processing, storage, export, logistics, real estate',
    icon: '/images/sectors/agriculture-icon.svg',
    subSectors: ['Farming', 'Processing', 'Storage', 'Export Logistics', 'Agri-Real Estate'],
    investmentFocus: 'Modernizing African agriculture from farm to export.',
  },
] as const;

export const sectors = ['Agriculture', 'Fashion', 'Tech', 'Real Estate', 'Food Processing', 'Livestock', 'Import/Export', 'Creative Economy'] as const;

export const userTypes = [
  { value: 'investor', label: 'Investor', icon: 'INV', description: 'Ready to invest capital' },
  { value: 'learner', label: 'Learner', icon: 'LRN', description: 'Want to learn first' },
  { value: 'student', label: 'Student', icon: 'STD', description: 'Ready to invest now' },
  { value: 'builder', label: 'Builder', icon: 'BLD', description: 'Want to run projects' },
] as const;

export const investmentInterests = [
  { value: '50000', label: 'NGN 50,000 cycle' },
  { value: '100000+', label: 'NGN 100,000+ (future cycles)' },
  { value: 'learning', label: 'Just learning for now' },
] as const;

function buildAllowedOrigins(): string[] {
  const origins = new Set<string>(['https://sinet.africa', 'https://www.sinet.africa']);

  // Allow local development origins.
  origins.add('http://localhost:3000');
  origins.add('http://127.0.0.1:3000');

  // Allow a configured site URL (helps staging environments).
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) origins.add(siteUrl);

  // Allow Vercel preview/deployment URLs (VERCEL_URL is like: my-app-git-branch.vercel.app)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) origins.add(`https://${vercelUrl}`);

  return Array.from(origins);
}

export const allowedOrigins = buildAllowedOrigins();
