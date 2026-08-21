import { ApplicationWizard } from '@/components/applications/ApplicationWizard';

export const metadata = { title: 'Start Investing | SINet', description: 'Submit an investment application to begin SINet review.' };
export default function StartInvestingPage() { return <ApplicationWizard flow="investment" />; }
