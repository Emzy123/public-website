import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Empire } from '@/types';
import { Card } from '../ui/Card';

const sectorBackgroundByName: Record<string, string> = {
  'Fashion & Creative': '/images/sectors/fashion-creative.svg',
  'Food & Processing': '/images/sectors/food-processing.svg',
  'Tech & Innovation': '/images/sectors/tech-innovation.svg',
  'Social Impact': '/images/sectors/social-impact.svg',
  'Agriculture & Agribusiness': '/images/sectors/agriculture-agribusiness.svg',
};

export function FiveEmpiresGrid({ empires }: { empires: Empire[] }) {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">The Five Empires</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our curated investment verticals are designed to capture value across Africa's most resilient and high-growth sectors.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {empires.map((empire) => {
            const bgImage = sectorBackgroundByName[empire.name] || '/images/sectors/generic-sector.svg';
            const previewText = empire.description.length > 76 ? `${empire.description.slice(0, 76)}...` : empire.description;

            return (
            <Card
              key={empire.id}
              className="group relative overflow-hidden p-8 hover:shadow-xl transition-all duration-300 border-t-4 border-t-blue-600 min-h-[270px]"
            >
              <Image
                src={bgImage}
                alt={`${empire.name} themed background`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover opacity-25 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/88 to-white/94" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-lg bg-blue-50/95 text-blue-600 flex items-center justify-center mb-6 relative overflow-hidden">
                <Image
                  src="/images/empire-badge.svg"
                  alt={`${empire.name} badge`}
                  fill
                  sizes="56px"
                  className="object-contain opacity-90"
                />
                <span className="relative z-10 font-bold text-xl text-blue-700">
                  {empire.name.charAt(0)}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{empire.name}</h3>
              <p className="text-slate-600 mb-6 transition-opacity duration-300 group-hover:opacity-0">{previewText}</p>
              <div className="text-sm font-medium text-blue-700">{empire.subSectors.length} Sub-sectors</div>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-20 p-5 bg-slate-950/88 text-white translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-sm text-slate-100 mb-2 line-clamp-2">{empire.description}</p>
                <p className="text-xs text-slate-300 mb-3">
                  {empire.subSectors.slice(0, 2).map((s) => s.name).join(' • ')}
                </p>
                <Link href="/sectors" className="text-sm font-semibold text-sinet-gold hover:text-sinet-gold-light transition-colors">
                  Learn more about this sector &rarr;
                </Link>
              </div>
            </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
