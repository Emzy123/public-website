import type {
  AboutContent,
  AcademyContent,
  BlueprintContent,
  CmsDataMap,
  CmsKey,
  ConnectContent,
  ContactPageContent,
  EmpiresPageContent,
  GalleryContent,
  HeroSlide,
  HomeContent,
  ImpactContent,
  InvestorJourneyContent,
  ReturnsContent,
  SectorsPageContent,
  SiteSettings,
  TransparencyContent,
  WaitlistPageContent,
} from '@admin/types/content';
import { DEFAULT_ABOUT_TEAM, DEFAULT_ABOUT_TIMELINE } from './defaults/about-data';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    bgUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=2400&q=80',
    badge: '🔴 LIVE NOW',
    headline: 'Structured Investment.',
    headlineAccent: 'Real Sector Operations.',
    subheadline: 'Active today: Structured 6-week investment cycles through goods trade and agricultural operations.',
    cta: { label: 'See How It Works', href: '/blueprint' },
    ctaSecondary: { label: 'Connect With Us', href: '/investor-journey' },
    enabled: true,
    sortOrder: 0,
  },
  {
    id: 'slide-2',
    bgUrl: 'https://images.unsplash.com/photo-1590859808308-3d2d9c515b1a?auto=format&fit=crop&w=2400&q=80',
    badge: '🏗️ BUILDING NOW',
    headline: '2 Manufacturing Plants',
    headlineAccent: 'Under Construction',
    subheadline: "Funded by Trade Profits. Building Nigeria's Production Capacity.",
    cta: { label: 'Explore Our Assets', href: '/empires' },
    ctaSecondary: { label: 'Join the Movement', href: '/impact' },
    enabled: true,
    sortOrder: 1,
  },
  {
    id: 'slide-3',
    bgUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=2400&q=80',
    badge: '🌍 THE VISION',
    headline: '5 Mega Empires.',
    headlineAccent: 'One Movement.',
    subheadline: 'Fashion • Food Processing • Tech • Real Estate • Agriculture',
    cta: { label: 'Explore the 5 Empires', href: '/empires' },
    ctaSecondary: { label: 'Our Returns', href: '/returns' },
    enabled: true,
    sortOrder: 2,
  },
];

export const DEFAULT_HOME: HomeContent = {
  strategicQuote:
    'SINet is building a youth-driven economic infrastructure that connects students to capital, production, and ownership across Africa.',
  ourImpact: {
    eyebrow: 'Measurable Results',
    title: 'Our Impact',
    subtitle:
      'SINet is building a structured system that translates student potential into real economic value — measured in capital, communities, and production capacity.',
    stats: [
      { value: '₦11.8M+', label: 'Capital Mobilized', sub: 'Deployed into active trade and agriculture' },
      { value: 'Multiple', label: 'Campuses', sub: 'Growing network of student investors' },
      { value: 'Active', label: 'Investment Cycles', sub: 'Agriculture and goods trade operations' },
    ],
    bullets: [
      'Ongoing development of processing and manufacturing systems',
      'Building a scalable model for youth-driven economic participation in Africa',
    ],
    tagline:
      'SINet is not just creating returns — we are building ownership, production, and long-term economic systems.',
  },
  whatWeDo: {
    eyebrow: 'Sector Operations',
    title: 'What We Do',
    subtitle:
      'SINet operates across key sectors to build a complete, interconnected economic system — from farm to factory to financial network.',
    sectors: [
      { icon: '🌾', title: 'Agriculture & Processing', badge: null, href: '/empires#agriculture' },
      { icon: '📦', title: 'Trade & Distribution', badge: null, href: '/blueprint' },
      { icon: '🏭', title: 'Manufacturing', badge: 'Developing', href: '/empires#food' },
      { icon: '💻', title: 'Technology & Innovation', badge: 'Developing', href: '/empires#tech' },
      { icon: '🤝', title: 'Enterprise & Investment Network', badge: null, href: '/investor-journey' },
    ],
    footerNote: 'Each sector feeds the others — creating a self-reinforcing economic engine for Africa.',
  },
  statsBar: {
    stats: [
      { value: '2M', label: 'Capital Deployed', prefix: '₦', suffix: '+' },
      { value: '6', label: 'Weeks Cycle' },
      { value: '5', label: 'Empires Building' },
      { value: 'Real Sector', label: 'Operations' },
    ],
    statusLine: 'Capital currently deployed in active goods trade',
  },
  flywheel: {
    eyebrow: 'The Engine',
    title: 'The SINet Flywheel',
    subtitle:
      'Each cycle feeds the next. Trade profits build manufacturing. Manufacturing profits build empires. Your capital compounds at every stage.',
    nodes: [
      { id: 'trade', label: 'Goods Trade', sub: 'Active Now', icon: '📦', href: '/blueprint', color: '#D4AF37' },
      { id: 'roi', label: 'Profits Generated', sub: 'Every 6 Weeks', icon: '📈', href: '/returns', color: '#F4D03F' },
      { id: 'manufacturing', label: 'Reinvested into Manufacturing', sub: '2 Plants Building', icon: '🏭', href: '/empires#food', color: '#D4AF37' },
      { id: 'hostel', label: 'Long-Term Asset Growth', sub: '5,000-Bed Vision', icon: '🏘️', href: '/empires#realestate', color: '#F4D03F' },
      { id: 'empires', label: '5 Mega Empires', sub: 'Pan-African Future', icon: '🌍', href: '/empires', color: '#D4AF37' },
    ],
    linkLabel: 'Learn how the model works',
    linkHref: '/blueprint',
  },
  empirePreview: {
    eyebrow: 'Building Africa',
    title: 'The 5 Mega Empires',
    subtitle: 'Five sectors. One ecosystem. From active trade to long-term ownership — your capital is always working.',
    empires: [
      { id: 'food', emoji: '🍲', name: 'Food & Processing', teaser: '2 manufacturing plants under construction', status: 'building', statusLabel: 'Building Now', href: '/empires#food', gradient: 'from-orange-600/20 to-orange-900/10' },
      { id: 'tech', emoji: '💻', name: 'Tech & Innovation', teaser: 'Investor portal in active development', status: 'building', statusLabel: 'In Development', href: '/empires#tech', gradient: 'from-blue-600/20 to-blue-900/10' },
      { id: 'fashion', emoji: '👗', name: 'Fashion & Creative', teaser: 'Textile trade active across Nigeria', status: 'active', statusLabel: 'Active Now', href: '/empires#fashion', gradient: 'from-purple-600/20 to-purple-900/10' },
      { id: 'realestate', emoji: '🏗️', name: 'Real Estate', teaser: '5,000-bed student hostel estate planned', status: 'vision', statusLabel: 'Planning Phase', href: '/empires#realestate', gradient: 'from-green-600/20 to-green-900/10' },
      { id: 'agriculture', emoji: '🌾', name: 'Agriculture', teaser: 'Seasonal crop cycles funded & active', status: 'active', statusLabel: 'Active Now', href: '/empires#agriculture', gradient: 'from-yellow-600/20 to-yellow-900/10' },
    ],
    ctaLabel: 'Deep-Dive Into All 5 Empires',
    ctaHref: '/empires',
  },
  investorJourney: {
    eyebrow: 'Simple Process',
    title: 'How to Get Started',
    subtitle: 'Three steps. Six weeks. Real returns. No complexity.',
    steps: [
      { number: '01', icon: '💰', title: 'Choose Your Entry', tiers: ['Student Tier (₦50k - ₦100k)', 'Investor Tiers (₦150k - ₦1M)', 'Strategic Tier (₦1M+)'], color: 'border-[#D4AF37]' },
      { number: '02', icon: '📦', title: '6-Week Cycle', tiers: ['Capital deployed to goods trade', 'High-demand markets', 'Zero idle time'], color: 'border-[#1E3A5F]' },
      { number: '03', icon: '📈', title: 'Reinvest or Withdraw', tiers: ['Structured 6-week investment cycle', 'Returns generated through active goods trade', 'Profits distributed at end of each cycle'], color: 'border-[#D4AF37]' },
    ],
    ctaLabel: 'Start Your Journey',
    ctaHref: '/investor-journey',
  },
  testimonials: {
    eyebrow: 'Social Proof',
    title: 'Investors Are Already Winning',
    items: [
      { quote: 'I started with ₦50,000. Six weeks later, I had ₦60,000. SINet delivered exactly what they promised.', name: 'Investor', location: 'Lagos' },
      { quote: 'What I love is knowing my money is buying real goods, not just sitting somewhere. I can see the impact.', name: 'Investor', location: 'Abuja' },
      { quote: 'The compounding potential here is incredible. Third cycle in and my capital has grown significantly.', name: 'Investor', location: 'Port Harcourt' },
    ],
  },
  homeCta: {
    title: "Ready to Build Africa's Future?",
    titleAccent: "Africa's Future?",
    subtitle: 'Talk to our team. No pressure. Just clarity. Join a structured 6-week investment cycle.',
    whatsappUrl: 'https://wa.me/2349028239706',
    whatsappLabel: 'Connect on WhatsApp',
    secondaryLabel: 'Send an Inquiry',
    secondaryHref: '/connect',
  },
};

export const DEFAULT_EMPIRES_PAGE: EmpiresPageContent = {
  hero: {
    badge: 'The 5 Mega Empires',
    title: 'Building Africa\'s',
    titleAccent: 'Economic Future',
    subtitle: 'Five interconnected sectors. One ecosystem. From active trade today to continental ownership tomorrow.',
  },
  empires: [
    { id: 'food', emoji: '🍲', name: 'Food & Processing', color: 'orange', active: 'Trading essential food commodities across Nigeria — rice, beans, cassava, cooking oil. 6-week cycles with consistent off-take.', building: ['2 manufacturing plants processing raw crops into finished consumer goods', 'Location: Nigeria | Target completion in progress', 'Funded entirely by trade profits — no outside debt'], buildingProgress: 35, vision: 'A fully integrated Pan-African food supply chain. From farm to table across all 54 African nations. Students as food entrepreneurs and supply chain owners.', bgImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=70' },
    { id: 'tech', emoji: '💻', name: 'Tech & Innovation', color: 'blue', active: 'Developing the SINet digital portal for seamless investor management, cycle tracking, and returns transparency.', building: ['Fintech solutions for cross-border capital flow for African students', 'Investor dashboard with real-time cycle tracking', 'Mobile-first platform for the African student investor'], buildingProgress: 20, vision: 'The "Digital Backbone" for African student-led startups and ventures. A continental fintech layer connecting capital to opportunity across borders.', bgImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=70' },
    { id: 'fashion', emoji: '👗', name: 'Fashion & Creative', color: 'purple', active: 'Sourcing and distributing high-quality African textiles at scale. Active trade generating consistent returns in the creative goods market.', building: ['Creative hubs for young designers to scale their production capacity', 'Partnerships with Nigerian fashion schools and design institutes', 'Distribution networks for African-made goods to global markets'], buildingProgress: 15, vision: 'Global distribution for "Made in Africa" fashion brands. Nigerian and Pan-African fashion as a continental export industry worth billions.', bgImage: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=70' },
    { id: 'realestate', emoji: '🏗️', name: 'Real Estate', color: 'green', active: 'Strategic land acquisition in high-growth student corridors across Nigerian university towns.', building: ['Modern, secure student housing — 5,000-bed hostel estate planned', 'Mixed-use student communities with co-working spaces', "Locations targeting Nigeria's largest university cities"], buildingProgress: 10, vision: 'A network of "SINet Cities" — student-centric urban developments across Africa. Safe, affordable, connected communities for the next generation of African builders.', bgImage: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=70' },
    { id: 'agriculture', emoji: '🌾', name: 'Agriculture', color: 'yellow', active: 'Funding seasonal crop cycles with guaranteed off-take agreements. Active partnerships with smallholder farmers across Nigeria.', building: ['Smart-farming infrastructure and precision agriculture technology', 'Cold-storage facilities to reduce post-harvest losses', 'Partnerships with agri-input suppliers for discounted supply chains'], buildingProgress: 25, vision: "Continental food security through student-led agricultural innovation. Nigeria as Africa's breadbasket, owned and operated by a new generation of agro-entrepreneurs.", bgImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=70' },
  ],
};

export const DEFAULT_ABOUT: AboutContent = {
  hero: {
    badge: 'Our Story',
    title: 'From Student Dreams to',
    titleAccent: 'Pan-African Movement',
    subtitle: 'SINet began in March 2025 with a simple question. Today, we\'re building Africa\'s future.',
  },
  origin: {
    problemEyebrow: 'The Problem',
    problemTitle: 'Why SINet Exists',
    problemParagraphs: [
      'Every year across Africa, thousands of brilliant students graduate with knowledge but without capital. Without ownership. Without systems. They leave university knowing what to build, but with no resources to build it.',
      'The traditional path demanded they wait — wait for a job, wait for savings, wait for someone else to give them a chance. SINet was created because African students cannot afford to wait any longer.',
    ],
    sparkEyebrow: 'The Spark',
    sparkTitle: 'How It Began',
    sparkParagraphs: [
      'In March 2025, Adams Ochekwu asked a single question that changed everything: "What if students didn\'t have to wait until they graduated to start building wealth?"',
      'The idea was simple — deploy real capital into real goods trade, generate real returns, and use those profits to build real assets. Within three months, SINet had engaged 280+ students across 16 universities and generated over ₦11.8 million in cash flow.',
    ],
  },
  missionVision: {
    visionEmoji: '👁️',
    visionEyebrow: 'Vision',
    visionTitle: 'Ownership, Not Hustle',
    visionText: 'Raise a generation of system builders and investors who shape industries, influence global markets, and position Africa as a leading force in the world economy — through ownership, not hustle.',
    missionEmoji: '🎯',
    missionEyebrow: 'Mission',
    missionTitle: 'Build. Connect. Scale.',
    missionText: 'Build a dynamic network that funds ideas, executes strategic investments, and connects talent across key sectors — using collaboration, technology, and global opportunities to create wealth and lasting economic systems.',
  },
  philosophy: {
    eyebrow: 'Our Principles',
    title: 'The SINet Philosophy',
    principles: [
      { icon: '🏦', title: 'Ownership, Not Hustle', desc: 'We design for long-term equity and compounding. Not side hustles. Not speculation. Real ownership of real assets that grow over time.' },
      { icon: '🔨', title: 'Students as Builders', desc: 'Students are not just consumers of the economy — they are its builders. SINet provides the tools, capital, and systems to make this real.' },
      { icon: '🔄', title: 'Today Funds Tomorrow', desc: 'Every 6-week trade cycle generates returns that fund manufacturing plants, hostels, and empires. The flywheel turns — and compounds.' },
    ],
    beyondReturns: {
      icon: '🌍',
      title: 'Beyond Returns: Building Systems',
      description: 'SINet is not just an investment platform. We are building the economic infrastructure that will define Africa\'s next generation of ownership and production.',
      bullets: ['Youth-driven economic infrastructure', 'Job creation through manufacturing', 'Production systems and value chains', 'Student ownership and leadership'],
    },
  },
  founder: {
    photo: '/images/team/adams-ochekwu.jpg',
    name: 'Adams Ochekwu',
    title: 'Founder & Chief Executive Officer',
    empires: ['Fashion & Creative', 'Food & Processing', 'Tech & Innovation', 'Social Impact', 'Agriculture'],
    quote: 'We are not just building businesses; we are building systems that will outlive us.',
    achievement: 'Built and scaled SINet from inception into a multi-campus investment platform engaging over 280 students across 16 universities. Within three months, generated over ₦11.8 million in cash flow through organized goods distribution, market participation, and grassroots capital mobilization.',
    bio: [
      'Adams Ochekwu is the Founder and Chief Executive Officer of the Student Investment Network (SINet), a youth-driven investment platform building systems of wealth creation across Africa.',
      'He provides strategic leadership and overall direction for the organization\'s vision, growth, and operations, designing and driving SINet\'s long-term mission of empowering students to build sustainable wealth systems.',
      'In his role, Adams leads the development and execution of investment strategies across multiple sectors, including agriculture, processing, real estate, energy, and digital innovation.',
      'As CEO, Adams represents SINet in engagements with stakeholders, institutions, and collaborators, positioning the platform as a growing force in youth-driven investment and innovation across Africa.',
    ],
    hideContact: true,
  },
  founderStats: [
    { value: '280+', label: 'Students Engaged' },
    { value: '₦11.8M', label: 'Cash Flow (3 months)' },
  ],
  teamSection: { eyebrow: 'The Builders', title: 'Leadership Team', subtitle: 'Click any card to read the full profile.' },
  team: DEFAULT_ABOUT_TEAM,
  timelineSection: { eyebrow: 'The Journey', title: 'Our Journey So Far' },
  timeline: DEFAULT_ABOUT_TIMELINE,
  cta: {
    eyebrow: 'Be Part of History',
    title: 'Join the',
    titleAccent: 'Movement',
    subtitle: 'Whether you want to invest, build, create, or connect — there is a place for you in SINet. Africa is waiting for its builders.',
    buttons: [
      { label: 'Explore membership →', href: '/membership' },
      { label: 'See what we do', href: '/sectors' },
      { label: 'Contact us', href: '/contact' },
    ],
  },
};

export const DEFAULT_IMPACT: ImpactContent = {
  hero: { badge: 'The Mission', title: 'Impact & The', titleAccent: 'Student Movement', subtitle: 'Every year, thousands of African students graduate with degrees but no capital, no network, no platform. SINet changes that.' },
  certificateSection: {
    eyebrow: 'The Problem',
    title: 'From Certificate',
    titleAccent: 'to Capital',
    paragraphs: [
      'Every year, thousands of African students graduate with degrees but no capital, no network, no platform to fund their visions.',
      'They graduate knowing what to do — in theory. But with no resources to do it. No seed capital. No connections. No institutional support.',
      'SINet changes that.',
      'We believe every student should graduate with more than a certificate. They should graduate with a Portfolio — ownership in real businesses, manufacturing, real estate, and technology.',
    ],
    highlight: 'This is not charity. This is empowerment.',
    stats: [
      { stat: '₦50,000', label: 'Minimum to start building ownership' },
      { stat: '6 Weeks', label: 'To your first returns. No waiting years.' },
      { stat: '5 Empires', label: 'Real sectors. Real assets. Real ownership.' },
      { stat: '1 Movement', label: 'Pan-African. Student-powered. Built to last.' },
    ],
  },
  ownershipSection: {
    eyebrow: 'The Shift',
    title: 'Building African',
    titleAccent: 'Owners',
    subtitle: 'When you invest in SINet, you are not just "investing." You are Owning.',
    items: [
      { icon: '📦', label: 'Goods Inventory', desc: 'The physical goods in our active trade cycles' },
      { icon: '🏭', label: 'Manufacturing Plants', desc: 'The 2 plants currently being built' },
      { icon: '🏘️', label: 'Student Hostels', desc: 'Serving thousands of students across Nigeria' },
      { icon: '💻', label: 'Tech Infrastructure', desc: 'The digital backbone of African student business' },
    ],
    closingLine: 'We are not creating investors. We are creating',
    closingAccent: 'Owners.',
  },
  rolesSection: {
    eyebrow: 'Join Us',
    title: 'Become a',
    titleAccent: 'Builder',
    subtitle: 'SINet is built by students, for students. Join in any capacity — every role matters.',
    roles: [
      { icon: '🎓', title: 'Campus Ambassador', desc: 'Lead the SINet movement on your campus. Educate peers, recruit investors, and earn commission on referrals.', cta: 'Apply as Ambassador' },
      { icon: '🏗️', title: 'Student Builder', desc: 'Run real projects within our 5 Empires. Gain hands-on experience in trade, real estate, tech, and manufacturing.', cta: 'Become a Builder' },
      { icon: '📱', title: 'Content Creator', desc: 'Tell the SINet story. Create content that inspires the next generation of African investors and owners.', cta: 'Create With Us' },
    ],
    ctaLabel: 'Join the Movement →',
    ctaHref: '/connect',
  },
};

export const DEFAULT_INVESTOR_JOURNEY: InvestorJourneyContent = {
  hero: { badge: 'Your Roadmap', title: 'The Investor', titleAccent: 'Journey', subtitle: "Start a structured 6-week investment cycle. Build ownership in Africa's fastest-growing investment ecosystem." },
  tiers: [
    { name: 'Student Tier', range: '₦50,000 – ₦100,000', description: 'Flexible entry within this range to accommodate different levels of participation.', benefits: ['6-week investment cycles', 'Real sector operations (goods trade, agriculture)', 'Profits distributed at cycle end'], premium: false },
    { name: 'Investor Tier', range: '₦150,000 – ₦500,000', description: 'For those ready to scale their participation.', benefits: ['6-week investment cycles', 'Real sector operations (goods trade, agriculture)', 'Profits distributed at cycle end'], premium: false },
    { name: 'Advanced Investor Tier', range: '₦500,000 – ₦1,000,000', description: 'Strategic participation with enhanced engagement.', benefits: ['6-week investment cycles', 'Real sector operations (goods trade, agriculture)', 'Profits distributed at cycle end'], premium: false },
    { name: 'Strategic Investor Tier', range: '₦1,000,000 – ₦10,000,000+', description: 'For larger investments (₦10M+), kindly contact us directly.', benefits: ['6-week investment cycles', 'Real sector operations (goods trade, agriculture)', 'Profits distributed at cycle end', 'Direct engagement with leadership'], premium: true },
  ],
  tiersNote: 'All tiers participate in the same structured cycles. Returns are generated through active goods trade and agricultural operations, with profits distributed at the end of each 6-week cycle.',
  timeline: [
    { week: 'Week 0', title: 'You Invest', desc: 'Capital deployed immediately into active operations', icon: '📥' },
    { week: 'Weeks 1–5', title: 'Capital Works', desc: 'Real sector operations: trade routes activated, agricultural processes', icon: '⚙️' },
    { week: 'Week 6', title: 'Profits Generated', desc: 'Profits credited. Choose to reinvest or withdraw.', icon: '💰' },
  ],
  withdrawalOptions: [
    { icon: '💸', title: 'Withdraw ROI', desc: 'Take your profits every cycle. Your capital stays invested for the next cycle.', bestFor: 'Regular income' },
    { icon: '🔄', title: 'Withdraw All', desc: 'Take both ROI and capital at cycle end. Clean exit with full returns.', bestFor: 'Short-term needs' },
    { icon: '📈', title: 'Compound & Reinvest', desc: 'Reinvest returns. Next cycle grows on a larger base. Maximum wealth building.', bestFor: 'Long-term wealth' },
  ],
  compoundingRows: [
    { cycle: 1, start: '₦50,000', roi: '₦7,500', appreciation: '₦2,500', total: '₦60,000' },
    { cycle: 2, start: '₦60,000', roi: '₦9,000', appreciation: '₦3,000', total: '₦72,000' },
    { cycle: 3, start: '₦72,000', roi: '₦10,800', appreciation: '₦3,600', total: '₦86,400' },
    { cycle: 4, start: '₦86,400', roi: '₦12,960', appreciation: '₦4,320', total: '₦103,680' },
  ],
};

export const DEFAULT_RETURNS: ReturnsContent = {
  hero: { badge: 'Full Transparency', title: 'Returns &', titleAccent: 'Track Record', subtitle: 'Structured 6-week investment cycle with returns generated through active goods trade and agricultural operations. No speculation.' },
  disclaimer: 'All investments carry risk. Returns may vary based on market conditions and operational performance.',
  currentReturns: [
    { metric: 'Minimum Entry', value: '₦50,000', highlight: false },
    { metric: 'Investment Structure', value: 'Trade & Agribusiness', highlight: true },
    { metric: 'Cycle Duration', value: '6 Weeks', highlight: false },
    { metric: 'Payout Timing', value: 'End of each cycle', highlight: false },
    { metric: 'Current Status', value: '✅ Open – Capital deployed', highlight: false },
  ],
  statusLine: 'Currently accepting new investors — capital is being deployed in active trade cycles',
  mechanicsSteps: [
    { icon: '🛒', title: 'Capital Deployed', desc: 'Funds purchase of high-demand consumer goods at wholesale.' },
    { icon: '🚚', title: 'Trade Executed', desc: 'Goods moved through verified trade routes across Nigeria.' },
    { icon: '💵', title: 'Sales Converted', desc: 'Revenue realized within the 6-week window.' },
    { icon: '✅', title: 'Profits Distributed', desc: 'Profits credited to your account. Choose to reinvest or withdraw.' },
  ],
  trackRecord: [
    { cycle: 'Cycle 4', period: 'Date – Date', result: 'Profits Distributed', status: 'Completed' },
    { cycle: 'Cycle 3', period: 'Date – Date', result: 'Profits Distributed', status: 'Completed' },
    { cycle: 'Cycle 2', period: 'Date – Date', result: 'Profits Distributed', status: 'Completed' },
    { cycle: 'Cycle 1', period: 'Date – Date', result: 'Profits Distributed', status: 'Completed' },
  ],
  futureSection: {
    paragraphs: [
      'As SINet scales from trade → manufacturing → real estate, return potential grows. Manufacturing assets will create new revenue streams. The 5,000-bed hostel estate will generate long-term passive income. Your capital grows with us.',
      'Investors who join early co-own the assets being built today. Early participation means maximum upside as the empires scale.',
    ],
  },
};

export const DEFAULT_ACADEMY: AcademyContent = {
  hero: { badge: 'COMING SOON', title: 'Investor Academy – Coming Soon', subtitle: 'Build conviction with structured learning—so when the portal opens, you invest with clarity and discipline.' },
  learnItems: [
    { icon: '📚', title: 'Investment fundamentals', body: 'Risk, reward, and portfolio design for African markets.' },
    { icon: '✅', title: 'Due diligence', body: 'Financials, founders, and red flags—practical frameworks you can reuse.' },
    { icon: '🏛️', title: 'Sector deep dives', body: 'Empire-level nuance—from agribusiness to creative economies.' },
    { icon: '⚖️', title: 'Regulatory navigation', body: 'Compliance, tax, and cross-border considerations explained clearly.' },
  ],
  pathSteps: [
    { number: '1', title: 'Foundations', body: 'Self-paced modules on literacy, markets, and mindset.' },
    { number: '2', title: 'Masterclasses', body: 'Live sessions with operators, founders, and experts.' },
    { number: '3', title: 'Practical simulation', body: 'Term sheets, decks, and mock investment committees.' },
    { number: '4', title: 'Portfolio readiness', body: 'Templates and checkpoints before you deploy capital in Phase 1.' },
  ],
};

export const DEFAULT_CONNECT: ConnectContent = {
  hero: { badge: 'Get In Touch', title: 'Connect', titleAccent: 'With SINet', subtitle: 'Have questions about investing? Want to join as a builder or ambassador? We\'re here.' },
  investmentOptions: [
    { value: 'student', label: 'Student Tier (₦50,000 – ₦100,000)' },
    { value: 'investor', label: 'Investor Tier (₦150,000 – ₦500,000)' },
    { value: 'advanced', label: 'Advanced Investor Tier (₦500,000 – ₦1,000,000)' },
    { value: 'strategic', label: 'Strategic Investor Tier (₦1,000,000 – ₦10,000,000+)' },
    { value: 'learning', label: 'Just learning for now (Academy interest)' },
  ],
  formTitle: 'Send an Inquiry',
  formSubtitle: 'Fill out the form and our team will respond within 24 hours.',
};

export const DEFAULT_BLUEPRINT: BlueprintContent = {
  hero: {
    badge: 'The Model',
    title: 'The SINet',
    titleAccent: 'Blueprint',
    subtitle: 'How active goods trade powers a structured 6-week investment cycle — and funds the 5 Mega Empires being built across Africa.',
  },
  cycleSteps: [
    { icon: '📦', number: '01', title: 'Capital Deployed', desc: 'Your capital is used to purchase high-demand consumer goods — essential commodities with guaranteed market demand.' },
    { icon: '🤝', number: '02', title: 'Goods Sold', desc: 'Goods are sold through established trade routes within 6 weeks. SINet cuts out middlemen for maximum margin.' },
    { icon: '📈', number: '03', title: 'Profits Distributed', desc: 'Profits are distributed at the end of each cycle, generated from active goods trade and agricultural operations.' },
    { icon: '🏭', number: '04', title: 'SINet Reinvests', desc: 'A portion of trade profits is reinvested into long-term infrastructure — manufacturing plants, hostel estates, tech.' },
    { icon: '🌍', number: '05', title: 'Empires Grow', desc: 'As SINet scales from trade to manufacturing to real estate, return potential and asset value increase for all investors.' },
  ],
  whyPoints: [
    { icon: '⚡', title: 'Speed', desc: '6-week cycles vs. traditional 12–24 month investment horizons. Your money never idles.' },
    { icon: '🧱', title: 'Tangibility', desc: 'Your capital buys physical goods — not speculation, not derivatives. Real inventory. Real trade.' },
    { icon: '👁️', title: 'Transparency', desc: 'You see where money goes at every stage. Regular updates on trade cycles and project milestones.' },
  ],
};

export const DEFAULT_TRANSPARENCY: TransparencyContent = {
  hero: {
    badge: 'Governance',
    title: 'Transparency',
    titleAccent: '& Governance',
    subtitle: "SINet's No-Fail Commitment. Full transparency on operations, risk, and returns.",
  },
  commitments: [
    { icon: '👁️', title: 'Operational Transparency', desc: 'Regular updates on trade cycles, project milestones, and financial performance. You always know where your money is.' },
    { icon: '🛡️', title: 'Risk Mitigation', desc: 'Focus on high-demand, quick-turnover goods minimizes market exposure. Diversified goods portfolio reduces single-point failure.' },
    { icon: '☎️', title: 'Direct Access', desc: 'WhatsApp, email, and phone — human support always available. No chatbots. No automated responses for critical queries.' },
    { icon: '🏦', title: 'Capital Backing', desc: 'Your capital is backed by physical inventory and tangible assets in our Empires. Real goods. Real land. Real value.' },
  ],
  faqCategories: [
    {
      title: 'Money Safety',
      items: [
        { question: 'Is my money safe?', answer: 'Your capital is backed by physical inventory in our goods trade and tangible assets in our Empires. We do not speculate in currencies, crypto, or derivatives.' },
        { question: 'What happens if a cycle has lower-than-expected returns?', answer: 'Our conservative inventory management and diversified goods portfolio minimize risk significantly.' },
      ],
    },
    {
      title: 'ROI & Returns',
      items: [
        { question: 'How are returns generated within 6 weeks?', answer: 'We cut out middlemen in the supply chain and trade directly in high-demand markets.' },
        { question: 'Are returns guaranteed?', answer: 'Returns are based on actual trade and agricultural performance. Our track record shows consistent delivery across all completed cycles.' },
      ],
    },
  ],
};

export const DEFAULT_SECTORS_PAGE: SectorsPageContent = {
  hero: {
    badge: '',
    title: 'Our Investment Empires',
    subtitle:
      'Discover scalable, impactful, and thoroughly vetted investment opportunities across Africa’s most critical sectors.',
  },
};

export const DEFAULT_GALLERY: GalleryContent = {
  hero: {
    badge: 'Gallery',
    title: 'Real activity across our pillars.',
    subtitle:
      'Authentic photos from farms, warehouses, deliveries, markets, and properties — organized by sector, not as one mixed feed.',
  },
  items: [],
};

export const DEFAULT_WAITLIST_PAGE: WaitlistPageContent = {
  title: 'Secure Your Early Access',
  subtitle: 'Tell us about your investment goals and secure your prioritized spot on the SINet waitlist.',
};

export const DEFAULT_CONTACT_PAGE: ContactPageContent = {
  title: 'Get in Touch',
  subtitle:
    "Have questions about the platform, our investment empires, or partnership opportunities? We're here to help.",
  emailLabel: 'Email Us',
  connectLabel: 'Connect',
};

export const DEFAULT_PAGE_SEO: SiteSettings['pageSeo'] = {
  home: {
    title: 'SINet - Pan-African Investment Ecosystem',
    description:
      "SINet connects investors, students, and projects across Africa's most promising sectors. Join the waitlist for Phase 1 launching soon.",
  },
  about: {
    title: 'About SINet',
    description:
      'From Student Dreams to Pan-African Movement. Founded in March 2025. Meet the founder, the leadership team, and learn how SINet is building 5 Mega Empires across Africa.',
  },
  blueprint: {
    title: 'The SINet Blueprint',
    description: 'Learn how SINet turns structured trade cycles into long-term asset ownership across Africa.',
  },
  empires: {
    title: 'The 5 Empires | SINet',
    description: 'Explore SINet’s five investment empires — fashion, food processing, tech, real estate, and agriculture.',
  },
  sectors: {
    title: 'Investment Sectors | SINet',
    description: "Explore SINet's five investment Empires and their sub-sectors.",
  },
  'investor-journey': {
    title: 'Investor Journey | SINet',
    description: 'Understand investment tiers, timelines, and how capital compounds through SINet cycles.',
  },
  returns: {
    title: 'Returns & Track Record | SINet',
    description: 'See SINet’s completed cycle results, mechanics, and performance metrics.',
  },
  impact: {
    title: 'Impact & Movement | SINet',
    description: 'How SINet mobilizes students and communities into real economic ownership across Africa.',
  },
  transparency: {
    title: 'Transparency & FAQ | SINet',
    description: 'Our commitments, FAQs, and answers about safety, returns, and how SINet operates.',
  },
  academy: {
    title: 'SINet Academy',
    description: 'Learn the skills behind trade, agriculture, and empire-building with SINet Academy.',
  },
  connect: {
    title: 'Connect With SINet',
    description: 'Get in touch with SINet. Investment inquiries, campus ambassador applications, and general questions.',
  },
  contact: {
    title: 'Contact Us | SINet',
    description: 'Get in touch with the SINet team for inquiries, partnerships, or support.',
  },
  waitlist: {
    title: 'Join the Waitlist | SINet',
    description: 'Apply to join the SINet Pan-African investment platform waitlist.',
  },
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  contact: {
    whatsapp: 'https://wa.me/2349028239706',
    whatsappDisplay: '0902 823 9706',
    phone: 'tel:+2349164107049',
    phoneDisplay: '0916 410 7049',
    email: 'sinetworkinggobal@gmail.com',
    address: 'Kogi State, Nigeria',
    businessHours: 'Monday – Friday, 9am – 6pm WAT',
  },
  social: {
    whatsapp: 'https://wa.me/2349028239706',
    instagram: 'https://instagram.com/sinet.africa',
    linkedin: 'https://linkedin.com/company/sinet-africa',
    x: 'https://twitter.com/SINet_Africa',
    facebook: 'https://facebook.com/sinet.africa',
  },
  footer: {
    brandCopy: "Build Africa's future. Invest in active goods trade with our structured 6-week investment cycles while co-owning Africa's next great institutions.",
    columns: [
      {
        title: 'Platform',
        links: [
          { label: 'Home', href: '/' },
          { label: 'The SINet Blueprint', href: '/blueprint' },
          { label: 'The 5 Empires', href: '/empires' },
          { label: 'Membership', href: '/membership' },
          { label: 'What We Do', href: '/sectors' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'Impact & Movement', href: '/impact' },
          { label: 'Transparency & FAQ', href: '/transparency' },
          { label: 'Connect With Us', href: '/connect' },
          { label: 'About SINet', href: '/about' },
        ],
      },
    ],
  },
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Blueprint', href: '/blueprint' },
    { label: 'Empires', href: '/empires' },
    { label: 'Membership', href: '/membership' },
    { label: 'Impact', href: '/impact' },
    { label: 'Connect', href: '/connect' },
  ],
  seo: {
    defaultTitle: 'SINet - Pan-African Investment Ecosystem',
    defaultDescription: "SINet connects investors, students, and projects across Africa's most promising sectors.",
  },
  pageSeo: DEFAULT_PAGE_SEO,
  logoUrl: '/images/logo.jpg',
  footerLogoUrl: '/images/logo.jpg',
};

const DEFAULTS: CmsDataMap = {
  'hero-slides': DEFAULT_HERO_SLIDES,
  home: DEFAULT_HOME,
  'empires-page': DEFAULT_EMPIRES_PAGE,
  about: DEFAULT_ABOUT,
  blueprint: DEFAULT_BLUEPRINT,
  transparency: DEFAULT_TRANSPARENCY,
  impact: DEFAULT_IMPACT,
  'investor-journey': DEFAULT_INVESTOR_JOURNEY,
  returns: DEFAULT_RETURNS,
  academy: DEFAULT_ACADEMY,
  connect: DEFAULT_CONNECT,
  'sectors-page': DEFAULT_SECTORS_PAGE,
  gallery: DEFAULT_GALLERY,
  'waitlist-page': DEFAULT_WAITLIST_PAGE,
  'contact-page': DEFAULT_CONTACT_PAGE,
  'site-settings': DEFAULT_SITE_SETTINGS,
};

export function getDefaultContent<K extends CmsKey>(key: K): CmsDataMap[K] {
  return structuredClone(DEFAULTS[key]);
}

export function normalizeGalleryContent(data: Partial<GalleryContent> | undefined): GalleryContent {
  const defaults = DEFAULT_GALLERY;
  if (!data) return structuredClone(defaults);

  const items = Array.isArray(data.items)
    ? data.items
        .filter((item) => item && typeof item === 'object')
        .map((item, index) => ({
          id: String(item.id || `gallery-${index}`),
          pillar: (['agriculture', 'trade-distribution', 'real-estate'].includes(item.pillar)
            ? item.pillar
            : 'agriculture') as GalleryContent['items'][number]['pillar'],
          imageUrl: String(item.imageUrl || ''),
          caption: String(item.caption || ''),
          sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
        }))
    : [];

  return {
    hero: {
      badge: data.hero?.badge ?? defaults.hero.badge,
      title: data.hero?.title ?? defaults.hero.title,
      subtitle: data.hero?.subtitle ?? defaults.hero.subtitle,
      titleAccent: data.hero?.titleAccent,
    },
    items,
  };
}

export function normalizeSiteSettings(data: Partial<SiteSettings> | undefined): SiteSettings {
  const defaults = DEFAULT_SITE_SETTINGS;
  if (!data) return structuredClone(defaults);

  return {
    contact: { ...defaults.contact, ...data.contact },
    social: { ...defaults.social, ...data.social },
    footer: {
      brandCopy: data.footer?.brandCopy ?? defaults.footer.brandCopy,
      columns: data.footer?.columns?.length ? data.footer.columns : defaults.footer.columns,
    },
    navigation: data.navigation?.length ? data.navigation : defaults.navigation,
    seo: { ...defaults.seo, ...data.seo },
    pageSeo: { ...defaults.pageSeo, ...data.pageSeo },
    logoUrl: data.logoUrl ?? defaults.logoUrl,
    footerLogoUrl: data.footerLogoUrl ?? defaults.footerLogoUrl,
  };
}
