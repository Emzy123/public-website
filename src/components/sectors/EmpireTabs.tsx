'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvestmentCard } from './InvestmentCard';
import type { Empire } from '@/types';

function EmpireTabsContent({ empires }: { empires: Empire[] }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(empires[0]?.id ?? '');

  useEffect(() => {
    if (tabParam && empires.some(e => e.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, empires]);

  const activeEmpire = empires.find(e => e.id === activeTab) || empires[0];

  if (!empires.length || !activeEmpire) {
    return (
      <div className="w-full max-w-7xl mx-auto bg-slate-50 rounded-2xl p-10 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No sectors available</h2>
        <p className="text-slate-600">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex md:flex-wrap overflow-x-auto gap-3 pb-4 mb-8 hide-scrollbar scroll-smooth" role="tablist">
        {empires.map(empire => (
          <button
            key={empire.id}
            onClick={() => setActiveTab(empire.id)}
            className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-medium transition-colors ${
              activeTab === empire.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
            aria-selected={activeTab === empire.id}
            role="tab"
          >
            {empire.name}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 md:p-10 border border-slate-200 animate-fade-in-up" key={activeTab}>
        <div className="mb-10 max-w-3xl">
          <div className="w-16 h-16 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 text-2xl font-bold">
            {activeEmpire.name.charAt(0)}
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">{activeEmpire.name}</h2>
          <p className="text-lg text-slate-600">{activeEmpire.description}</p>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Available Sub-Sectors</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {activeEmpire.subSectors.map((subSector, idx) => (
            <InvestmentCard 
              key={`${activeEmpire.id}-${idx}`} 
              subSector={subSector} 
              empireName={activeEmpire.name} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EmpireTabs({ empires }: { empires: Empire[] }) {
  return (
    <Suspense fallback={
      <div className="w-full max-w-7xl mx-auto bg-slate-50 rounded-2xl p-10 border border-slate-200 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    }>
      <EmpireTabsContent empires={empires} />
    </Suspense>
  );
}
