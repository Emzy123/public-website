import type { TeamMember } from '../../types/index.ts';

export const teamMembers: TeamMember[] = [
  // Team photos are assigned during DB seed from public/images/team.
  { id: '1', name: 'Ade', title: 'Founder & CEO', photoUrl: null },
  { id: '2', name: 'Chioma', title: 'Chief Operating Officer', photoUrl: null },
  { id: '3', name: 'Musa', title: 'Chief Technology Officer', photoUrl: null },
];
