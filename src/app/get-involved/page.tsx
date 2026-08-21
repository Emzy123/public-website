import { ApplicationWizard } from '@/components/applications/ApplicationWizard';

export const metadata = { title: 'Get Involved | SINet', description: 'Join SINet as a community member, volunteer, ambassador, staff member, or partner.' };
export default function GetInvolvedPage() { return <ApplicationWizard flow="get-involved" />; }
