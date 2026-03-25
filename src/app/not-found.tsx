import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-slate-50">
      <div className="text-7xl font-extrabold text-blue-200 mb-6">404</div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Page Not Found</h2>
      <p className="text-slate-600 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved. Check the URL or return home.
      </p>
      <Link href="/" tabIndex={-1}>
        <Button variant="primary" className="px-8">
          Return to Home
        </Button>
      </Link>
    </div>
  );
}
