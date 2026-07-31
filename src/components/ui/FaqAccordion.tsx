'use client';

import React, { useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { motion, AnimatePresence } from 'framer-motion';
import { CmsMarkdown } from '@/components/cms/CmsMarkdown';

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
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
              i === activeCategory
                ? 'bg-sinet-blue text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* Active category items using Radix Accordion */}
      <Accordion.Root type="single" collapsible className="bg-white rounded-2xl border border-slate-200 px-6 md:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {categories[activeCategory]?.items.map((item, index) => (
              <Accordion.Item
                key={item.question}
                value={`item-${index}`}
                className="border-b border-slate-200 last:border-0"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="w-full flex items-center justify-between gap-4 py-5 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-main rounded-sm">
                    <span className="font-semibold text-sm md:text-base text-sinet-blue group-hover:text-gold-main group-data-[state=open]:text-gold-main transition-colors">
                      {item.question}
                    </span>
                    <span className="flex-shrink-0 w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition-transform duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:bg-gold-main group-data-[state=open]:border-gold-main">
                      <svg className="w-3 h-3 text-slate-400 group-data-[state=open]:text-sinet-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>

                <Accordion.Content className="overflow-hidden transition-all data-[state=open]:animate-fade-in">
                  <div className="text-slate-600 text-sm leading-relaxed pb-5">
                    <CmsMarkdown content={item.answer} />
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </motion.div>
        </AnimatePresence>
      </Accordion.Root>
    </div>
  );
}

