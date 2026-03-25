import type { Empire } from '../../types/index.ts';

export const empires: Empire[] = [
  {
    id: 'fashion',
    name: 'Fashion & Creative',
    icon: 'fashion-icon',
    description: 'Empowering African creatives to scale globally.',
    subSectors: [{ name: 'Textiles', description: 'Sustainable fabric manufacturing.', minInvestment: 50000 }]
  },
  {
    id: 'food',
    name: 'Food & Processing',
    icon: 'food-icon',
    description: 'Ensuring food security through efficient processing.',
    subSectors: [{ name: 'Agro-processing', description: 'Value addition to raw crops.', minInvestment: 100000 }]
  },
  {
    id: 'tech',
    name: 'Tech & Innovation',
    icon: 'tech-icon',
    description: 'Funding the next generation of African digital solutions.',
    subSectors: [{ name: 'Fintech', description: 'Innovative financial services.', minInvestment: 500000 }]
  },
  {
    id: 'social',
    name: 'Social Impact',
    icon: 'social-icon',
    description: 'Investments focused on community development.',
    subSectors: [{ name: 'Education', description: 'EdTech and modern schools.', minInvestment: 75000 }]
  },
  {
    id: 'agric',
    name: 'Agriculture & Agribusiness',
    icon: 'agric-icon',
    description: 'Modernising African agriculture for global markets.',
    subSectors: [{ name: 'Farming Tech', description: 'Precision agriculture solutions.', minInvestment: 60000 }]
  }
];
