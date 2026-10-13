import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Join Student Investment Network — SINet Africa',
  description: 'Apply to join the Student Investment Network across Nigerian university campus chapters.',
};

export default function JoinIndexPage() {
  redirect('/join/student-network');
}
