'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ─────────────────────────── DATA ─────────────────────────── */

const founder = {
  photo: '/images/team/adams-ochekwu.jpg',
  name: 'Adams Ochekwu',
  title: 'Founder & Chief Executive Officer',
  empires: ['Fashion & Creative', 'Food & Processing', 'Tech & Innovation', 'Social Impact', 'Agriculture'],
  quote: 'We are not just building businesses; we are building systems that will outlive us.',
  achievement: 'Built and scaled SINet from inception into a multi-campus investment platform engaging over 280 students across 16 universities. Within three months, generated over ₦11.8 million in cash flow through organized goods distribution, market participation, and grassroots capital mobilization.',
  bio: [
    'Adams Ochekwu is the Founder and Chief Executive Officer of the Student Investment Network (SINet), a youth-driven investment platform building systems of wealth creation across Africa. He provides strategic leadership and overall direction for the organization\'s vision, growth, and operations, designing and driving SINet\'s long-term mission of empowering students to build sustainable wealth systems.',
    'In his role, Adams leads the development and execution of investment strategies across multiple sectors, including agriculture, processing, real estate, energy, and digital innovation. He oversees partnerships, capital mobilization, and the coordination of teams, ensuring that all activities align with SINet\'s broader objective of economic transformation and generational impact.',
    'He also plays a key role in building structures, systems, and frameworks that enable scalability, accountability, and long-term sustainability within the network. Through leadership, mentorship, and strategic planning, he mobilizes and equips students to participate actively in wealth creation and enterprise development.',
    'As CEO, Adams represents SINet in engagements with stakeholders, institutions, and collaborators, positioning the platform as a growing force in youth-driven investment and innovation across Africa.',
  ],
  hideContact: true,
};

const team = [
  {
    id: 'joy',
    photo: '/images/team/joy-ahoyiza-sule.jpg',
    name: 'Joy Ahoyiza Sule',
    title: 'Fashion Designer & Creative Lead',
    empire: 'Fashion & Creative',
    empireEmoji: '👗',
    brief: 'Turning creative ideas into beautifully crafted garments, combining creativity with precision to create stylish, timeless pieces.',
    quote: 'I create stylish, well-crafted outfits that tell stories of growth, passion, and precision.',
    achievement: 'Turning creative ideas into tangible, high-quality fashion pieces through her brand, Jaylani\'s Clothing, and initiatives like The Thrive Tribe.',
    bio: 'I\'m Joy Ahoyiza Sule, a fashion designer and sewing enthusiast who loves turning ideas into beautifully crafted garments. Over the years, I\'ve learned to combine creativity with precision, working with fabrics, patterns, and designs to create pieces that are not just stylish, but also practical and timeless. Fashion isn\'t just what I do, it\'s who I am. From bespoke tailoring and garment alterations to experimenting with new styles and textures, I\'m always exploring ways to push my craft forward. I also love sharing what I know, mentoring aspiring designers and sewing enthusiasts, and helping them bring their own ideas to life. Through my brand, Jaylani\'s Clothing, and initiatives like The Thrive Tribe, I\'ve been able to combine my love for fashion with entrepreneurship, creating spaces for collaboration, learning, and growth. Whether I\'m designing a custom piece or teaching someone a new technique, my goal is always the same: to inspire confidence, creativity, and excellence through fashion.',
    hideContact: false,
  },
  {
    id: 'cornelius',
    photo: '/images/team/bamigbade-cornelius.jpeg',
    name: 'Bamigbade Cornelius',
    title: 'Operational Manager',
    empire: 'Food & Processing, Tech & Innovation, Agriculture',
    empireEmoji: '⚙️',
    brief: 'Student of Sociology at Federal University Lokoja, aspiring medical sociologist, dedicated to operational excellence and social impact.',
    quote: 'Life is not in its duration, but in its donation.',
    achievement: 'Certificate of Dusom — recognized leadership and community service.',
    bio: 'My name is Bamigbade Cornelius, a student of Federal University Lokoja. Born in March 2002 into a middle-class family in Ibadan, Oyo State, Nigeria. Currently studying Sociology in the university, I intend to become a medical sociologist. My passion lies in understanding the intersection of health, society, and community development. At SINet, I apply my organizational skills and commitment to service to ensure operations run smoothly across multiple Empires.',
    hideContact: false,
  },
  {
    id: 'emmanuel-o',
    photo: '/images/team/emmanuel-ocheme.png',
    name: 'Emmanuel Ocheme',
    title: 'Technical Director',
    empire: 'Tech & Innovation',
    empireEmoji: '💻',
    brief: 'Full-stack developer building scalable platforms, AI systems, and digital infrastructure for economic growth across Africa.',
    quote: 'Building the future isn\'t about ideas alone — it\'s about turning vision into systems that create real impact.',
    achievement: 'Successfully developed and tested an AI-powered Forex signal system, demonstrating the ability to design, build, and refine intelligent, real-world financial technology solutions.',
    bio: 'Emmanuel Ocheme is a technology-driven software developer passionate about building scalable solutions that drive economic growth across Africa. With a strong full-stack background in modern web technologies, he specializes in developing innovative platforms powered by artificial intelligence, analytics, and secure digital systems. He has built and continues to refine solutions such as an AI-powered Forex signal system and digital platforms tailored to student and enterprise needs. His work reflects a blend of technical expertise, strategic thinking, and a commitment to solving real-world problems through technology. Beyond his technical pursuits, Emmanuel is actively engaged in leadership and community development, contributing to student-focused and faith-based initiatives. At SINet, Emmanuel brings an innovation-driven approach and a strong commitment to leveraging technology and strategic partnerships to support sustainable investment and economic empowerment across the continent.',
    hideContact: false,
  },
  {
    id: 'aishat',
    photo: '/images/team/aishat-abdulaziz.jpeg',
    name: 'Aishat Abdulaziz',
    title: 'Branding & Visibility Manager',
    empire: 'Social Impact',
    empireEmoji: '🎬',
    brief: 'Video editor and content creator with 3 years of professional experience, crafting brand-focused stories and shareable content.',
    quote: 'Cut, frame, live — I treat every day like a storyboard.',
    achievement: 'Best Videographer Award at Tee Concept Academy.',
    bio: 'I\'m Aishat Abdulaziz — a video editor with three years of professional experience and a year spent influencing and creating brand-focused content. I love researching trends, crafting video templates, and turning raw footage into tight, shareable stories. When I\'m not at the desk, I\'m out exploring or hunting down fresh ideas for the next project. At SINet, I bring stories to life — showing the world the movement we\'re building through visuals that resonate.',
    hideContact: false,
  },
  {
    id: 'peter',
    photo: '/images/team/peter-sule.jpg',
    name: 'Peter Sule',
    title: 'Deputy CEO',
    empire: 'Tech & Innovation, Agriculture',
    empireEmoji: '🤝',
    brief: 'Professional photo retoucher and operations leader, ensuring smooth daily activities and organizational standards.',
    quote: 'Regardless.',
    achievement: 'Successfully delivered high-quality retouching projects for multiple clients, helping improve their brand image across Nigeria and internationally over 4 years.',
    bio: 'I\'m a professional photo retoucher with a strong eye for detail and quality. As the Deputy CEO, I oversee daily operations and supervise all activities within the organization to ensure everything runs smoothly and meets our standards. I\'m passionate about creativity, teamwork, and delivering excellent results. My work bridges the gap between artistic vision and operational excellence.',
    hideContact: false,
  },
  {
    id: 'blessing',
    photo: '/images/team/blessing-samuel.jpg',
    name: 'Blessing Samuel',
    title: 'Treasurer',
    empire: 'Food & Processing',
    empireEmoji: '💰',
    brief: 'Financial steward maintaining up-to-date reports enabling informed decision-making by leadership.',
    quote: 'Accountability today builds trust for tomorrow.',
    achievement: 'Improved budgeting and financial reporting processes across SINet\'s operations.',
    bio: 'As Treasurer of SINet, I maintain up-to-date financial reports, enabling informed decision-making by leadership. My work ensures that every naira is accounted for and deployed effectively. I believe that accountability today builds trust for tomorrow, and I bring this philosophy to every financial decision I make for the community.',
    hideContact: true,
  },
  {
    id: 'omajali',
    photo: '/images/team/emmanuel-omajali.jpg',
    name: 'Emmanuel Omajali',
    title: 'Media & Graphics Manager',
    empire: 'Fashion & Creative',
    empireEmoji: '🎨',
    brief: 'Creative professional with expertise in graphic design, video editing, and visual storytelling for brands and projects.',
    quote: 'I don\'t just dress well, I carry purpose. Built with vision, driven by purpose. Silent moves, loud results.',
    achievement: 'Graphic design and video editing skills have solved real problems for clients, generated consistent income, and built a growing portfolio of creative projects.',
    bio: 'Emmanuel Ojoadonejonu Omajali is a highly motivated and purpose-driven individual with a strong commitment to leadership, personal development, and impactful service. He possesses a growing expertise in creativity, media, and community engagement, leveraging these strengths to drive meaningful initiatives and inspire positive change. At SINet, he brings visual storytelling to life — ensuring the movement\'s message reaches far and wide.',
    hideContact: true,
  },
];

const timeline = [
  {
    date: 'March 2025',
    emoji: '🌱',
    title: 'The Beginning',
    desc: 'Adams Ochekwu founded SINet with a simple question: why can\'t students participate in real wealth creation now? The first cycle began.',
  },
  {
    date: '2025 – Active Operations',
    emoji: '⚡',
    title: 'Launch & Growth',
    desc: '280+ students across 16 universities joined. ₦11.8 million in cash flow generated in the first three months of structured goods trade.',
  },
  {
    date: '2026 – Public Launch',
    emoji: '🌍',
    title: 'Digital Platform Goes Live',
    desc: 'sinet.africa launches publicly. Investor portal, full transparency, and the 5 Empires framework revealed to the world.',
  },
  {
    date: '2026–2027 – Building Now',
    emoji: '🏭',
    title: 'Manufacturing Begins',
    desc: '2 manufacturing plants under development. The 5,000-bed hostel estate planned. Trade profits fund real infrastructure.',
  },
  {
    date: '2027+ – The 5 Empires',
    emoji: '👑',
    title: 'Pan-African Expansion',
    desc: 'Five sectors. 54 nations. Students owning the food supply chains, tech platforms, fashion hubs, real estate, and agriculture networks of tomorrow\'s Africa.',
  },
];

/* ─────────────────────────── COMPONENTS ─────────────────────────── */

type TeamMember = typeof team[0];

function TeamModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0A2342] rounded-t-3xl p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#D4AF37] flex-shrink-0">
              <Image src={member.photo} alt={member.name} fill className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">{member.name}</h2>
              <p className="text-[#D4AF37] font-semibold text-sm">{member.title}</p>
              <p className="text-slate-300 text-xs mt-1">{member.empireEmoji} {member.empire}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          {/* Bio */}
          <div>
            <h3 className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest mb-2">About</h3>
            <p className="text-slate-600 leading-relaxed text-sm">{member.bio}</p>
          </div>

          {/* Quote */}
          <div className="bg-[#F8F4E9] rounded-2xl p-5 border-l-4 border-[#D4AF37]">
            <p className="italic text-[#0A2342] font-medium leading-relaxed">&ldquo;{member.quote}&rdquo;</p>
          </div>

          {/* Achievement */}
          <div className="bg-[#0A2342] rounded-2xl p-5">
            <h3 className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest mb-2">Key Achievement</h3>
            <p className="text-slate-200 text-sm leading-relaxed">{member.achievement}</p>
          </div>

          {/* CTA */}
          {!member.hideContact ? (
            <a
              href="https://wa.me/2349028239706"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Connect on WhatsApp
            </a>
          ) : (
            <div className="flex items-center gap-3 w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-400 text-sm">Reach this team member via SINet WhatsApp:</span>
              <a
                href="https://wa.me/2349028239706"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#D4AF37] hover:text-[#0A2342] transition-colors text-sm whitespace-nowrap"
              >
                0902 823 9706
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── MAIN PAGE ─────────────────────────── */

export default function AboutClient() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <div className="pt-20">
      {/* ── 1. HERO ── */}
      <section className="bg-[#0A2342] pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(212,175,55,0.12)_0%,_transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center relative z-10">
          <span className="inline-block text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-6">
            Our Story
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            From Student Dreams to<br /><span className="text-[#D4AF37]">Pan-African Movement</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            SINet began in <strong className="text-white">March 2025</strong> with a simple question. Today, we&rsquo;re building Africa&rsquo;s future.
          </p>
        </div>
      </section>

      {/* ── 2. ORIGIN STORY ── */}
      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold">The Problem</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0A2342] mt-2 mb-4">Why SINet Exists</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Every year across Africa, thousands of brilliant students graduate with knowledge but without capital. Without ownership. Without systems. They leave university knowing <em>what</em> to build, but with no resources to build it.
              </p>
              <p className="text-slate-600 leading-relaxed">
                The traditional path demanded they wait — wait for a job, wait for savings, wait for someone else to give them a chance. SINet was created because African students cannot afford to wait any longer.
              </p>
            </div>
            <div>
              <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold">The Spark</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0A2342] mt-2 mb-4">How It Began</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                In <strong>March 2025</strong>, Adams Ochekwu asked a single question that changed everything: <em>&ldquo;What if students didn&rsquo;t have to wait until they graduated to start building wealth?&rdquo;</em>
              </p>
              <p className="text-slate-600 leading-relaxed">
                The idea was simple — deploy real capital into real goods trade, generate real returns, and use those profits to build real assets. Within three months, SINet had engaged <strong>280+ students across 16 universities</strong> and generated over <strong>₦11.8 million in cash flow</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. MISSION & VISION ── */}
      <section className="py-20 bg-[#0A2342]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Vision */}
            <div className="bg-[#0A1929] rounded-2xl p-8 md:p-10 border border-[#D4AF37]/20 relative overflow-hidden group hover:border-[#D4AF37]/40 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-full" />
              <div className="text-4xl mb-4">👁️</div>
              <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold">Vision</span>
              <h2 className="text-2xl font-extrabold text-white mt-2 mb-4">Ownership, Not Hustle</h2>
              <p className="text-slate-300 leading-relaxed text-sm">
                Raise a generation of system builders and investors who shape industries, influence global markets, and position Africa as a leading force in the world economy — through ownership, not hustle.
              </p>
            </div>
            {/* Mission */}
            <div className="bg-[#D4AF37] rounded-2xl p-8 md:p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
              <div className="text-4xl mb-4">🎯</div>
              <span className="text-xs text-[#0A2342]/70 uppercase tracking-widest font-bold">Mission</span>
              <h2 className="text-2xl font-extrabold text-[#0A2342] mt-2 mb-4">Build. Connect. Scale.</h2>
              <p className="text-[#0A2342]/80 leading-relaxed text-sm">
                Build a dynamic network that funds ideas, executes strategic investments, and connects talent across key sectors — using collaboration, technology, and global opportunities to create wealth and lasting economic systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PHILOSOPHY ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold">Our Principles</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3">The SINet Philosophy</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🏦', title: 'Ownership, Not Hustle', desc: 'We design for long-term equity and compounding. Not side hustles. Not speculation. Real ownership of real assets that grow over time.' },
              { icon: '🔨', title: 'Students as Builders', desc: 'Students are not just consumers of the economy — they are its builders. SINet provides the tools, capital, and systems to make this real.' },
              { icon: '🔄', title: 'Today Funds Tomorrow', desc: 'Every 6-week trade cycle generates returns that fund manufacturing plants, hostels, and empires. The flywheel turns — and compounds.' },
            ].map((p) => (
              <div key={p.title} className="text-center p-8 rounded-2xl border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:-translate-y-1 transition-all duration-300 group">
                <div className="text-5xl mb-4">{p.icon}</div>
                <h3 className="text-xl font-extrabold text-[#0A2342] mb-3 group-hover:text-[#D4AF37] transition-colors">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* ── Beyond Returns subsection ── */}
          <div className="mt-12 p-8 bg-[#0A2342]/5 rounded-2xl border border-[#D4AF37]/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#0A2342] font-extrabold text-lg flex-shrink-0">🌍</span>
              <h3 className="text-xl font-extrabold text-[#0A2342]">Beyond Returns: Building Systems</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">
              SINet is not just an investment platform. We are building the economic
              infrastructure that will define Africa&rsquo;s next generation of ownership
              and production.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Youth-driven economic infrastructure',
                'Job creation through manufacturing',
                'Production systems and value chains',
                'Student ownership and leadership',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="text-[#D4AF37] font-bold text-lg mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-slate-700 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FOUNDER PROFILE ── */}
      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold">The Visionary</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3">Meet Our Founder</h2>
          </div>

          <div className="grid md:grid-cols-5 gap-10 md:gap-16 items-start">
            {/* Photo column */}
            <div className="md:col-span-2 flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-2xl opacity-20 scale-110" />
                <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-[#D4AF37] shadow-2xl">
                  <Image src={founder.photo} alt={founder.name} fill className="object-cover" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-[#0A2342]">{founder.name}</h3>
              <p className="text-[#D4AF37] font-semibold text-sm mb-3">{founder.title}</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {founder.empires.map((e) => (
                  <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-[#0A2342]/10 text-[#0A2342] font-medium">{e}</span>
                ))}
              </div>
            </div>

            {/* Bio column */}
            <div className="md:col-span-3 space-y-4">
              {founder.bio.map((p, i) => (
                <p key={i} className="text-slate-600 leading-relaxed text-sm">{p}</p>
              ))}
            </div>
          </div>

          {/* Quote + Achievement */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            <div className="bg-[#0A2342] rounded-2xl p-8 text-white">
              <svg className="w-10 h-10 text-[#D4AF37] mb-4 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-lg md:text-xl italic leading-relaxed mb-4">&ldquo;{founder.quote}&rdquo;</p>
              <p className="text-[#D4AF37] font-semibold text-sm">— {founder.name}</p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#0A2342] font-extrabold text-lg">★</span>
                <h4 className="font-extrabold text-[#0A2342] text-lg">Key Achievement</h4>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{founder.achievement}</p>
              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="text-center p-3 bg-[#F8F4E9] rounded-xl">
                  <div className="text-2xl font-extrabold text-[#D4AF37]">280+</div>
                  <div className="text-xs text-slate-500">Students Engaged</div>
                </div>
                <div className="text-center p-3 bg-[#F8F4E9] rounded-xl">
                  <div className="text-2xl font-extrabold text-[#D4AF37]">₦11.8M</div>
                  <div className="text-xs text-slate-500">Cash Flow (3 months)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. LEADERSHIP TEAM ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold">The Builders</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3">Leadership Team</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm">Click any card to read the full profile.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {team.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="group text-left bg-[#F8F4E9] rounded-2xl overflow-hidden border border-slate-200 hover:border-[#D4AF37]/60 hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                {/* Photo */}
                <div className="relative h-52 overflow-hidden bg-slate-200">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Empire badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0A2342]/80 backdrop-blur-sm text-white text-xs font-semibold border border-[#D4AF37]/30">
                    <span>{member.empireEmoji}</span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-[#0A2342]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-2">View Profile</p>
                    <p className="text-white text-xs leading-relaxed">{member.brief}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="font-extrabold text-[#0A2342] text-base group-hover:text-[#D4AF37] transition-colors">{member.name}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{member.title}</p>
                  <p className="text-slate-400 text-xs mt-2 line-clamp-2 italic">&ldquo;{member.quote}&rdquo;</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TIMELINE ── */}
      <section className="py-20 bg-[#0A2342]">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold">The Journey</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3">Our Journey So Far</h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[#D4AF37]/20 md:left-1/2" />

            <div className="space-y-10">
              {timeline.map((item, i) => (
                <div key={item.date} className={`flex gap-6 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Content */}
                  <div className={`flex-1 md:w-5/12 ${i % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div className="bg-[#0A1929] rounded-2xl p-6 border border-slate-700/50 hover:border-[#D4AF37]/30 transition-colors ml-10 md:ml-0">
                      <p className="text-[#D4AF37] text-xs font-mono font-bold uppercase tracking-widest mb-1">{item.date}</p>
                      <h3 className="text-white font-extrabold text-base mb-2">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="flex-shrink-0 absolute left-0 md:static md:flex md:w-14 md:justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center text-xl shadow-lg shadow-[#D4AF37]/30 border-4 border-[#0A2342]">
                      {item.emoji}
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="hidden md:block flex-1 md:w-5/12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. CTA ── */}
      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold">Be Part of History</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3 mb-4">
            Join the <span className="text-[#D4AF37]">Movement</span>
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto">
            Whether you want to invest, build, create, or connect — there is a place for you in SINet. Africa is waiting for its builders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/investor-journey" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] font-bold rounded-xl transition-all duration-200 shadow-lg">
              Start Investing →
            </Link>
            <Link href="/empires" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0A2342] hover:bg-[#1E3A5F] text-white font-bold rounded-xl transition-all duration-200">
              Explore the 5 Empires
            </Link>
            <Link href="/connect" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-[#0A2342] hover:bg-[#0A2342]/5 text-[#0A2342] font-bold rounded-xl transition-all duration-200">
              Connect With Us
            </Link>
          </div>
        </div>
      </section>

      {/* Modal */}
      {selectedMember && (
        <TeamModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  );
}
