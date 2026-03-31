'use client';

import React, { useState } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

interface FaqAccordionProps {
  categories: FaqCategory[];
}

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className={`font-semibold text-sm md:text-base transition-colors ${open ? 'text-[#D4AF37]' : 'text-[#0A2342] group-hover:text-[#D4AF37]'}`}>
          {item.question}
        </span>
        <span className={`flex-shrink-0 w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition-all duration-200 ${
          open ? 'bg-[#D4AF37] border-[#D4AF37] rotate-45' : 'group-hover:border-[#D4AF37]'
        }`}>
          <svg className={`w-3 h-3 ${open ? 'text-[#0A2342]' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '500px' : '0px' }}
      >
        <p className="text-slate-600 text-sm leading-relaxed pb-5">{item.answer}</p>
      </div>
    </div>
  );
}

export function FaqAccordion({ categories }: FaqAccordionProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat, i) => (
          <button
            key={cat.title}
            onClick={() => setActiveCategory(i)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              i === activeCategory
                ? 'bg-[#0A2342] text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* Active category items */}
      <div className="bg-white rounded-2xl border border-slate-200 px-6 md:px-8">
        {categories[activeCategory]?.items.map((item) => (
          <AccordionItem key={item.question} item={item} />
        ))}
      </div>
    </div>
  );
}
