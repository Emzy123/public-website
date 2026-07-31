'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { AboutContent, AboutTeamMember } from '@admin/types/content';

function TeamModal({
  member,
  whatsappUrl,
  whatsappDisplay,
  onClose,
}: {
  member: AboutTeamMember;
  whatsappUrl: string;
  whatsappDisplay: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest mb-2">About</h3>
            <p className="text-slate-600 leading-relaxed text-sm">{member.bio}</p>
          </div>

          <div className="bg-[#F8F4E9] rounded-2xl p-5 border-l-4 border-[#D4AF37]">
            <p className="italic text-[#0A2342] font-medium leading-relaxed">&ldquo;{member.quote}&rdquo;</p>
          </div>

          <div className="bg-[#0A2342] rounded-2xl p-5">
            <h3 className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest mb-2">Key Achievement</h3>
            <p className="text-slate-200 text-sm leading-relaxed">{member.achievement}</p>
          </div>

          {!member.hideContact ? (
            <a
              href={whatsappUrl}
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
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#D4AF37] hover:text-[#0A2342] transition-colors text-sm whitespace-nowrap"
              >
                {whatsappDisplay}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AboutClient({
  content,
  whatsappUrl,
  whatsappDisplay,
}: {
  content: AboutContent;
  whatsappUrl: string;
  whatsappDisplay: string;
}) {
  const [selectedMember, setSelectedMember] = useState<AboutTeamMember | null>(null);
  const { hero, origin, missionVision, philosophy, founder, founderStats, teamSection, team, timelineSection, timeline, cta } = content;

  return (
    <div className="pt-20">
      <section className="bg-[#0A2342] pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(212,175,55,0.12)_0%,_transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center relative z-10">
          <span className="inline-block text-xs text-[#D4AF37] uppercase tracking-[0.3em] font-semibold px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-6">
            {hero.badge}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            {hero.title}<br /><span className="text-[#D4AF37]">{hero.titleAccent}</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {hero.subtitle}
          </p>
        </div>
      </section>

      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold">{origin.problemEyebrow}</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0A2342] mt-2 mb-4">{origin.problemTitle}</h2>
              {origin.problemParagraphs.map((p, i) => (
                <p key={i} className="text-slate-600 leading-relaxed mb-4">{p}</p>
              ))}
            </div>
            <div>
              <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold">{origin.sparkEyebrow}</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#0A2342] mt-2 mb-4">{origin.sparkTitle}</h2>
              {origin.sparkParagraphs.map((p, i) => (
                <p key={i} className="text-slate-600 leading-relaxed mb-4">{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A2342]">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#0A1929] rounded-2xl p-8 md:p-10 border border-[#D4AF37]/20 relative overflow-hidden group hover:border-[#D4AF37]/40 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-full" />
              <div className="text-4xl mb-4">{missionVision.visionEmoji}</div>
              <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold">{missionVision.visionEyebrow}</span>
              <h2 className="text-2xl font-extrabold text-white mt-2 mb-4">{missionVision.visionTitle}</h2>
              <p className="text-slate-300 leading-relaxed text-sm">{missionVision.visionText}</p>
            </div>
            <div className="bg-[#D4AF37] rounded-2xl p-8 md:p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
              <div className="text-4xl mb-4">{missionVision.missionEmoji}</div>
              <span className="text-xs text-[#0A2342]/70 uppercase tracking-widest font-bold">{missionVision.missionEyebrow}</span>
              <h2 className="text-2xl font-extrabold text-[#0A2342] mt-2 mb-4">{missionVision.missionTitle}</h2>
              <p className="text-[#0A2342]/80 leading-relaxed text-sm">{missionVision.missionText}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold">{philosophy.eyebrow}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3">{philosophy.title}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {philosophy.principles.map((p) => (
              <div key={p.title} className="text-center p-8 rounded-2xl border border-slate-200 hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:-translate-y-1 transition-all duration-300 group">
                <div className="text-5xl mb-4">{p.icon}</div>
                <h3 className="text-xl font-extrabold text-[#0A2342] mb-3 group-hover:text-[#D4AF37] transition-colors">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-[#0A2342]/5 rounded-2xl border border-[#D4AF37]/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-[#0A2342] font-extrabold text-lg flex-shrink-0">{philosophy.beyondReturns.icon}</span>
              <h3 className="text-xl font-extrabold text-[#0A2342]">{philosophy.beyondReturns.title}</h3>
            </div>
            <p className="text-slate-600 mb-6 leading-relaxed">{philosophy.beyondReturns.description}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {philosophy.beyondReturns.bullets.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="text-[#D4AF37] font-bold text-lg mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-slate-700 text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold">The Visionary</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3">Meet Our Founder</h2>
          </div>

          <div className="grid md:grid-cols-5 gap-10 md:gap-16 items-start">
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

            <div className="md:col-span-3 space-y-4">
              {founder.bio.map((p, i) => (
                <p key={i} className="text-slate-600 leading-relaxed text-sm">{p}</p>
              ))}
            </div>
          </div>

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
                {founderStats.map((stat) => (
                  <div key={stat.label} className="text-center p-3 bg-[#F8F4E9] rounded-xl">
                    <div className="text-2xl font-extrabold text-[#D4AF37]">{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold">{teamSection.eyebrow}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3">{teamSection.title}</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm">{teamSection.subtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {team.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="group text-left bg-[#F8F4E9] rounded-2xl overflow-hidden border border-slate-200 hover:border-[#D4AF37]/60 hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                <div className="relative h-52 overflow-hidden bg-slate-200">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0A2342]/80 backdrop-blur-sm text-white text-xs font-semibold border border-[#D4AF37]/30">
                    <span>{member.empireEmoji}</span>
                  </div>
                  <div className="absolute inset-0 bg-[#0A2342]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-2">View Profile</p>
                    <p className="text-white text-xs leading-relaxed">{member.brief}</p>
                  </div>
                </div>

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

      <section className="py-20 bg-[#0A2342]">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-14">
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold">{timelineSection.eyebrow}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3">{timelineSection.title}</h2>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-[#D4AF37]/20 md:left-1/2" />

            <div className="space-y-10">
              {timeline.map((item, i) => (
                <div key={item.date} className={`flex gap-6 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 md:w-5/12 ${i % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                    <div className="bg-[#0A1929] rounded-2xl p-6 border border-slate-700/50 hover:border-[#D4AF37]/30 transition-colors ml-10 md:ml-0">
                      <p className="text-[#D4AF37] text-xs font-mono font-bold uppercase tracking-widest mb-1">{item.date}</p>
                      <h3 className="text-white font-extrabold text-base mb-2">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 absolute left-0 md:static md:flex md:w-14 md:justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center text-xl shadow-lg shadow-[#D4AF37]/30 border-4 border-[#0A2342]">
                      {item.emoji}
                    </div>
                  </div>

                  <div className="hidden md:block flex-1 md:w-5/12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F8F4E9]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-semibold">{cta.eyebrow}</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0A2342] mt-3 mb-4">
            {cta.title} <span className="text-[#D4AF37]">{cta.titleAccent}</span>
          </h2>
          <p className="text-slate-600 leading-relaxed mb-8 max-w-xl mx-auto">{cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {cta.buttons.map((btn, i) => (
              <Link
                key={btn.href}
                href={btn.href}
                className={`inline-flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-xl transition-all duration-200 ${
                  i === 0
                    ? 'bg-[#D4AF37] hover:bg-[#F4D03F] text-[#0A2342] shadow-lg'
                    : i === 1
                      ? 'bg-[#0A2342] hover:bg-[#1E3A5F] text-white'
                      : 'border-2 border-[#0A2342] hover:bg-[#0A2342]/5 text-[#0A2342]'
                }`}
              >
                {btn.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {selectedMember && (
        <TeamModal
          member={selectedMember}
          whatsappUrl={whatsappUrl}
          whatsappDisplay={whatsappDisplay}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
