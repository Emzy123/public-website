export type HowItWorksIconKey = 'join' | 'verify' | 'invest';

export interface HowItWorksStep {
  number: string;
  title: string;
  description: string;
  iconKey: HowItWorksIconKey;
}

