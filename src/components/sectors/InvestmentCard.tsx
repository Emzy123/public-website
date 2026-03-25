import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Link from 'next/link';
import { SubSector } from '@/types';

interface InvestmentCardProps {
  subSector: SubSector;
  empireName: string;
}

export function InvestmentCard({ subSector, empireName }: InvestmentCardProps) {
  return (
    <Card className="flex flex-col h-full bg-white hover:shadow-lg transition-shadow border-t-2 border-t-blue-500 p-6">
      <div className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-2">
        {empireName}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{subSector.name}</h3>
      <p className="text-slate-600 mb-6 flex-grow">{subSector.description}</p>
      
      <div className="pt-4 border-t border-slate-100 mb-6 mt-auto">
        <div className="text-sm text-slate-500 mb-1">Minimum Investment</div>
        <div className="text-2xl font-bold text-slate-900">
          ₦{subSector.minInvestment.toLocaleString()}
        </div>
      </div>
      
      <Link href="/waitlist" className="w-full mt-auto" tabIndex={-1}>
        <Button variant="secondary" className="w-full">
          Learn More
        </Button>
      </Link>
    </Card>
  );
}
