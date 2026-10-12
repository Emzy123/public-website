/** CMS content types for the SINet admin dashboard */

export type CtaLink = { label: string; href: string };

export type HeroSlide = {
  id: string;
  bgUrl: string;
  badge: string;
  headline: string;
  headlineAccent: string;
  subheadline: string;
  cta: CtaLink;
  ctaSecondary: CtaLink;
  enabled: boolean;
  sortOrder: number;
};

export type ImpactStat = { value: string; label: string; sub: string };
export type SectorCard = { icon: string; title: string; badge: string | null; href: string };
export type StatBarItem = { value: string; label: string; prefix?: string; suffix?: string };
export type FlywheelNode = { id: string; label: string; sub: string; icon: string; href: string; color: string };
export type EmpirePreview = {
  id: string;
  emoji: string;
  name: string;
  teaser: string;
  status: 'active' | 'building' | 'vision';
  statusLabel: string;
  href: string;
  gradient: string;
};
export type JourneyStep = { number: string; icon: string; title: string; tiers: string[]; color: string };
export type Testimonial = { quote: string; name: string; location: string };
export type NavLink = { label: string; href: string };

export type HomeContent = {
  strategicQuote: string;
  ourImpact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    stats: ImpactStat[];
    bullets: string[];
    tagline: string;
  };
  whatWeDo: {
    eyebrow: string;
    title: string;
    subtitle: string;
    sectors: SectorCard[];
    footerNote: string;
  };
  statsBar: { stats: StatBarItem[]; statusLine: string };
  flywheel: {
    eyebrow: string;
    title: string;
    subtitle: string;
    nodes: FlywheelNode[];
    linkLabel: string;
    linkHref: string;
  };
  empirePreview: {
    eyebrow: string;
    title: string;
    subtitle: string;
    empires: EmpirePreview[];
    ctaLabel: string;
    ctaHref: string;
  };
  investorJourney: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: JourneyStep[];
    ctaLabel: string;
    ctaHref: string;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: Testimonial[];
  };
  homeCta: {
    title: string;
    titleAccent: string;
    subtitle: string;
    whatsappUrl: string;
    whatsappLabel: string;
    secondaryLabel: string;
    secondaryHref: string;
  };
};

export type EmpireDetail = {
  id: string;
  emoji: string;
  name: string;
  color: string;
  active: string;
  building: string[];
  buildingProgress: number;
  vision: string;
  bgImage: string;
};

export type EmpiresPageContent = {
  hero: PageHeroContent;
  empires: EmpireDetail[];
};

export type PageHeroContent = {
  badge: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
};

export type AboutTeamMember = {
  id: string;
  photo: string;
  name: string;
  title: string;
  empire: string;
  empireEmoji: string;
  brief: string;
  quote: string;
  achievement: string;
  bio: string;
  hideContact: boolean;
};

export type AboutContent = {
  hero: PageHeroContent;
  origin: {
    problemEyebrow: string;
    problemTitle: string;
    problemParagraphs: string[];
    sparkEyebrow: string;
    sparkTitle: string;
    sparkParagraphs: string[];
  };
  missionVision: {
    visionEmoji: string;
    visionEyebrow: string;
    visionTitle: string;
    visionText: string;
    missionEmoji: string;
    missionEyebrow: string;
    missionTitle: string;
    missionText: string;
  };
  philosophy: {
    eyebrow: string;
    title: string;
    principles: { icon: string; title: string; desc: string }[];
    beyondReturns: { icon: string; title: string; description: string; bullets: string[] };
  };
  founder: {
    photo: string;
    name: string;
    title: string;
    empires: string[];
    quote: string;
    achievement: string;
    bio: string[];
    hideContact: boolean;
  };
  founderStats: { value: string; label: string }[];
  teamSection: { eyebrow: string; title: string; subtitle: string };
  team: AboutTeamMember[];
  timelineSection: { eyebrow: string; title: string };
  timeline: { date: string; emoji: string; title: string; desc: string }[];
  cta: { eyebrow: string; title: string; titleAccent: string; subtitle: string; buttons: CtaLink[] };
};

export type ImpactContent = {
  hero: PageHeroContent;
  certificateSection: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    paragraphs: string[];
    highlight: string;
    stats: { stat: string; label: string }[];
  };
  ownershipSection: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    items: { icon: string; label: string; desc: string }[];
    closingLine: string;
    closingAccent: string;
  };
  rolesSection: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    roles: { icon: string; title: string; desc: string; cta: string }[];
    ctaLabel: string;
    ctaHref: string;
  };
};

export type InvestmentTier = {
  name: string;
  range: string;
  description: string;
  benefits: string[];
  premium: boolean;
};

export type InvestorJourneyContent = {
  hero: PageHeroContent;
  tiers: InvestmentTier[];
  tiersNote: string;
  timeline: { week: string; title: string; desc: string; icon: string }[];
  withdrawalOptions: { icon: string; title: string; desc: string; bestFor: string }[];
  compoundingRows: { cycle: number; start: string; roi: string; appreciation: string; total: string }[];
};

export type ReturnsContent = {
  hero: PageHeroContent;
  disclaimer: string;
  currentReturns: { metric: string; value: string; highlight: boolean }[];
  statusLine: string;
  mechanicsSteps: { icon: string; title: string; desc: string }[];
  trackRecord: { cycle: string; period: string; result: string; status: string }[];
  futureSection: { paragraphs: string[] };
};

export type AcademyContent = {
  hero: { badge: string; title: string; subtitle: string };
  learnItems: { icon: string; title: string; body: string }[];
  pathSteps: { number: string; title: string; body: string }[];
};

export type ConnectContent = {
  hero: PageHeroContent;
  investmentOptions: { value: string; label: string }[];
  formTitle: string;
  formSubtitle: string;
};

export type FaqItem = { question: string; answer: string };
export type FaqCategory = { title: string; items: FaqItem[] };

export type BlueprintContent = {
  hero: PageHeroContent;
  cycleSteps: { icon: string; number: string; title: string; desc: string }[];
  whyPoints: { icon: string; title: string; desc: string }[];
};

export type TransparencyContent = {
  hero: PageHeroContent;
  commitments: { icon: string; title: string; desc: string }[];
  faqCategories: FaqCategory[];
};

export type PageSeoKey =
  | 'home'
  | 'about'
  | 'blueprint'
  | 'empires'
  | 'sectors'
  | 'investor-journey'
  | 'returns'
  | 'impact'
  | 'transparency'
  | 'academy'
  | 'connect'
  | 'contact'
  | 'waitlist';

export type PageSeoEntry = { title: string; description: string };
export type PageSeoMap = Record<PageSeoKey, PageSeoEntry>;

export type FooterLinkColumn = {
  title: string;
  links: NavLink[];
};

export type SiteSettings = {
  contact: {
    whatsapp: string;
    whatsappDisplay: string;
    phone: string;
    phoneDisplay: string;
    email: string;
    address: string;
    businessHours: string;
  };
  social: { whatsapp: string; instagram: string; linkedin: string; x: string; facebook: string };
  footer: {
    brandCopy: string;
    columns: FooterLinkColumn[];
  };
  navigation: NavLink[];
  seo: { defaultTitle: string; defaultDescription: string };
  pageSeo: PageSeoMap;
  logoUrl?: string;
  footerLogoUrl?: string;
};

export type SectorsPageContent = {
  hero: PageHeroContent;
};

export type WaitlistPageContent = {
  title: string;
  subtitle: string;
};

export type ContactPageContent = {
  title: string;
  subtitle: string;
  emailLabel: string;
  connectLabel: string;
};

export type GalleryPillar = 'agriculture' | 'trade-distribution' | 'real-estate';

export type GalleryItem = {
  id: string;
  pillar: GalleryPillar;
  imageUrl: string;
  caption: string;
  alt?: string;
  sortOrder: number;
};

export type GalleryContent = {
  hero: PageHeroContent;
  items: GalleryItem[];
};

export type NewsPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  publishedAt: string;
  published: boolean;
  sortOrder: number;
};

export type NewsContent = {
  hero: PageHeroContent;
  posts: NewsPost[];
};

export type CatalogPillar = GalleryPillar | 'general';

export type ProductItem = {
  id: string;
  title: string;
  body: string;
  pillar: CatalogPillar;
  imageUrl: string;
  href: string;
  available: boolean;
  sortOrder: number;
};

export type ProductsPageContent = {
  hero: PageHeroContent;
  items: ProductItem[];
};

export type PartnerItem = {
  id: string;
  name: string;
  body: string;
  pillar: CatalogPillar;
  logoUrl: string;
  href: string;
  sortOrder: number;
};

export type PartnersPageContent = {
  hero: PageHeroContent;
  items: PartnerItem[];
  ctaTitle: string;
  ctaBody: string;
  ctaLabel: string;
  ctaHref: string;
};

/** Site-wide event flyers, adverts, and special-activity promos */
export type AdvertItem = {
  id: string;
  title: string;
  eyebrow: string;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  enabled: boolean;
  /** Open the flyer modal for first-time visitors while this advert is active */
  showModal: boolean;
  startsAt: string;
  endsAt: string;
  sortOrder: number;
};

export type AdvertsContent = {
  items: AdvertItem[];
};

export type CmsKey =
  | 'hero-slides'
  | 'home'
  | 'empires-page'
  | 'about'
  | 'blueprint'
  | 'transparency'
  | 'impact'
  | 'investor-journey'
  | 'returns'
  | 'academy'
  | 'connect'
  | 'sectors-page'
  | 'gallery'
  | 'news'
  | 'products-page'
  | 'partners-page'
  | 'adverts'
  | 'waitlist-page'
  | 'contact-page'
  | 'site-settings';

export type CmsDataMap = {
  'hero-slides': HeroSlide[];
  home: HomeContent;
  'empires-page': EmpiresPageContent;
  about: AboutContent;
  blueprint: BlueprintContent;
  transparency: TransparencyContent;
  impact: ImpactContent;
  'investor-journey': InvestorJourneyContent;
  returns: ReturnsContent;
  academy: AcademyContent;
  connect: ConnectContent;
  'sectors-page': SectorsPageContent;
  gallery: GalleryContent;
  news: NewsContent;
  'products-page': ProductsPageContent;
  'partners-page': PartnersPageContent;
  adverts: AdvertsContent;
  'waitlist-page': WaitlistPageContent;
  'contact-page': ContactPageContent;
  'site-settings': SiteSettings;
};

export type CmsDocument<K extends CmsKey = CmsKey> = {
  key: K;
  data: CmsDataMap[K];
  updatedAt: string;
  updatedBy?: string;
};
