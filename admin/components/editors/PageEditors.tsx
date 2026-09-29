'use client';

import React from 'react';
import type {
  AboutContent,
  AcademyContent,
  BlueprintContent,
  ConnectContent,
  ContactPageContent,
  EmpiresPageContent,
  ImpactContent,
  InvestorJourneyContent,
  PageHeroContent,
  ReturnsContent,
  SectorsPageContent,
  SiteSettings,
  TransparencyContent,
  WaitlistPageContent,
} from '@admin/types/content';
import { PAGE_SEO_KEYS } from '@admin/lib/cms/page-seo';
import { AdminCard } from '../AdminShell';
import { AdminField, AdminInput, AdminTextarea } from '../ui/AdminField';
import { AdminMarkdownField } from '../ui/AdminMarkdownField';
import { ImageUploadField } from '../ui/ImageUploadField';

function HeroFields({
  hero,
  onChange,
}: {
  hero: PageHeroContent;
  onChange: (hero: PageHeroContent) => void;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <AdminField label="Badge"><AdminInput value={hero.badge} onChange={(e) => onChange({ ...hero, badge: e.target.value })} /></AdminField>
      <AdminField label="Title"><AdminInput value={hero.title} onChange={(e) => onChange({ ...hero, title: e.target.value })} /></AdminField>
      <AdminField label="Title accent"><AdminInput value={hero.titleAccent ?? ''} onChange={(e) => onChange({ ...hero, titleAccent: e.target.value })} /></AdminField>
      <AdminField label="Subtitle"><AdminTextarea value={hero.subtitle} onChange={(e) => onChange({ ...hero, subtitle: e.target.value })} /></AdminField>
    </div>
  );
}

export function EmpiresPageEditor({ data, onChange }: { data: EmpiresPageContent; onChange: (d: EmpiresPageContent) => void }) {
  return (
    <div className="space-y-6">
      <AdminCard title="Page Hero"><HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} /></AdminCard>
      {data.empires.map((empire, i) => (
        <AdminCard key={empire.id} title={`${empire.emoji} ${empire.name}`}>
          <div className="grid md:grid-cols-2 gap-4">
            <AdminField label="Active operations"><AdminTextarea value={empire.active} onChange={(e) => { const n = [...data.empires]; n[i] = { ...n[i], active: e.target.value }; onChange({ ...data, empires: n }); }} /></AdminField>
            <AdminField label="Vision"><AdminTextarea value={empire.vision} onChange={(e) => { const n = [...data.empires]; n[i] = { ...n[i], vision: e.target.value }; onChange({ ...data, empires: n }); }} /></AdminField>
            <AdminField label="Building progress (%)"><AdminInput type="number" min={0} max={100} value={empire.buildingProgress} onChange={(e) => { const n = [...data.empires]; n[i] = { ...n[i], buildingProgress: Number(e.target.value) }; onChange({ ...data, empires: n }); }} /></AdminField>
            <ImageUploadField
              label="Background image"
              value={empire.bgImage}
              onChange={(bgImage) => {
                const n = [...data.empires];
                n[i] = { ...n[i], bgImage };
                onChange({ ...data, empires: n });
              }}
              previewClassName="h-24"
            />
            <AdminField label="Building items (one per line)"><AdminTextarea value={empire.building.join('\n')} onChange={(e) => { const n = [...data.empires]; n[i] = { ...n[i], building: e.target.value.split('\n').filter(Boolean) }; onChange({ ...data, empires: n }); }} /></AdminField>
          </div>
        </AdminCard>
      ))}
    </div>
  );
}

export function AboutPageEditor({ data, onChange }: { data: AboutContent; onChange: (d: AboutContent) => void }) {
  return (
    <div className="space-y-6">
      <AdminCard title="Page Hero"><HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} /></AdminCard>
      <AdminCard title="Origin Story">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <AdminField label="Problem eyebrow"><AdminInput value={data.origin.problemEyebrow} onChange={(e) => onChange({ ...data, origin: { ...data.origin, problemEyebrow: e.target.value } })} /></AdminField>
            <AdminField label="Problem title"><AdminInput value={data.origin.problemTitle} onChange={(e) => onChange({ ...data, origin: { ...data.origin, problemTitle: e.target.value } })} /></AdminField>
            <AdminField label="Problem paragraphs (one per line)"><AdminTextarea value={data.origin.problemParagraphs.join('\n\n')} onChange={(e) => onChange({ ...data, origin: { ...data.origin, problemParagraphs: e.target.value.split('\n\n').filter(Boolean) } })} /></AdminField>
          </div>
          <div className="space-y-3">
            <AdminField label="Spark eyebrow"><AdminInput value={data.origin.sparkEyebrow} onChange={(e) => onChange({ ...data, origin: { ...data.origin, sparkEyebrow: e.target.value } })} /></AdminField>
            <AdminField label="Spark title"><AdminInput value={data.origin.sparkTitle} onChange={(e) => onChange({ ...data, origin: { ...data.origin, sparkTitle: e.target.value } })} /></AdminField>
            <AdminField label="Spark paragraphs (one per line)"><AdminTextarea value={data.origin.sparkParagraphs.join('\n\n')} onChange={(e) => onChange({ ...data, origin: { ...data.origin, sparkParagraphs: e.target.value.split('\n\n').filter(Boolean) } })} /></AdminField>
          </div>
        </div>
      </AdminCard>
      <AdminCard title="Mission & Vision">
        <div className="grid md:grid-cols-2 gap-6">
          <AdminField label="Vision text"><AdminTextarea value={data.missionVision.visionText} onChange={(e) => onChange({ ...data, missionVision: { ...data.missionVision, visionText: e.target.value } })} /></AdminField>
          <AdminField label="Mission text"><AdminTextarea value={data.missionVision.missionText} onChange={(e) => onChange({ ...data, missionVision: { ...data.missionVision, missionText: e.target.value } })} /></AdminField>
        </div>
      </AdminCard>
      <AdminCard title="Philosophy">
        <AdminField label="Beyond returns description"><AdminTextarea value={data.philosophy.beyondReturns.description} onChange={(e) => onChange({ ...data, philosophy: { ...data.philosophy, beyondReturns: { ...data.philosophy.beyondReturns, description: e.target.value } } })} /></AdminField>
        {data.philosophy.principles.map((p, i) => (
          <div key={i} className="grid md:grid-cols-3 gap-3 mb-3 p-3 bg-slate-950 rounded-lg">
            <AdminInput value={p.icon} placeholder="Icon" onChange={(e) => { const n = [...data.philosophy.principles]; n[i] = { ...n[i], icon: e.target.value }; onChange({ ...data, philosophy: { ...data.philosophy, principles: n } }); }} />
            <AdminInput value={p.title} placeholder="Title" onChange={(e) => { const n = [...data.philosophy.principles]; n[i] = { ...n[i], title: e.target.value }; onChange({ ...data, philosophy: { ...data.philosophy, principles: n } }); }} />
            <AdminInput value={p.desc} placeholder="Description" onChange={(e) => { const n = [...data.philosophy.principles]; n[i] = { ...n[i], desc: e.target.value }; onChange({ ...data, philosophy: { ...data.philosophy, principles: n } }); }} />
          </div>
        ))}
      </AdminCard>
      <AdminCard title="Founder">
        <div className="grid md:grid-cols-2 gap-4">
          <AdminField label="Name"><AdminInput value={data.founder.name} onChange={(e) => onChange({ ...data, founder: { ...data.founder, name: e.target.value } })} /></AdminField>
          <AdminField label="Title"><AdminInput value={data.founder.title} onChange={(e) => onChange({ ...data, founder: { ...data.founder, title: e.target.value } })} /></AdminField>
          <ImageUploadField
            label="Photo"
            value={data.founder.photo}
            onChange={(photo) => onChange({ ...data, founder: { ...data.founder, photo } })}
            previewClassName="h-40 w-40 bg-contain bg-no-repeat bg-center mx-auto"
          />
          <AdminField label="Quote"><AdminTextarea value={data.founder.quote} onChange={(e) => onChange({ ...data, founder: { ...data.founder, quote: e.target.value } })} /></AdminField>
          <AdminField label="Achievement"><AdminTextarea value={data.founder.achievement} onChange={(e) => onChange({ ...data, founder: { ...data.founder, achievement: e.target.value } })} /></AdminField>
          <AdminField label="Bio (paragraphs, one per line)"><AdminTextarea value={data.founder.bio.join('\n\n')} onChange={(e) => onChange({ ...data, founder: { ...data.founder, bio: e.target.value.split('\n\n').filter(Boolean) } })} /></AdminField>
        </div>
      </AdminCard>
      <AdminCard title="Timeline">
        {data.timeline.map((event, i) => (
          <div key={i} className="grid md:grid-cols-4 gap-3 mb-3 p-3 bg-slate-950 rounded-lg">
            <AdminInput value={event.date} placeholder="Date" onChange={(e) => { const t = [...data.timeline]; t[i] = { ...t[i], date: e.target.value }; onChange({ ...data, timeline: t }); }} />
            <AdminInput value={event.emoji} placeholder="Emoji" onChange={(e) => { const t = [...data.timeline]; t[i] = { ...t[i], emoji: e.target.value }; onChange({ ...data, timeline: t }); }} />
            <AdminInput value={event.title} placeholder="Title" onChange={(e) => { const t = [...data.timeline]; t[i] = { ...t[i], title: e.target.value }; onChange({ ...data, timeline: t }); }} />
            <AdminInput value={event.desc} placeholder="Description" onChange={(e) => { const t = [...data.timeline]; t[i] = { ...t[i], desc: e.target.value }; onChange({ ...data, timeline: t }); }} />
          </div>
        ))}
        <button type="button" onClick={() => onChange({ ...data, timeline: [...data.timeline, { date: '', emoji: '', title: '', desc: '' }] })} className="text-xs text-[#D4AF37]">+ Add event</button>
      </AdminCard>
      <AdminCard title="Team members">
        <p className="text-sm text-slate-400">
          {data.team.length} profile{data.team.length === 1 ? '' : 's'} configured for the About page.
          Manage add, edit, view, and remove from the dedicated team page.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-slate-300">
          {data.team.slice(0, 8).map((member) => (
            <li key={member.id}>{member.name || 'Untitled'} — {member.title || 'No title'}</li>
          ))}
          {data.team.length > 8 && <li className="text-slate-500">+{data.team.length - 8} more</li>}
          {data.team.length === 0 && <li className="text-slate-500">Empty — public site will use built-in defaults.</li>}
        </ul>
        <a href="/admin/team" className="mt-4 inline-block text-xs font-semibold text-[#D4AF37] hover:underline">
          Open Leadership Team manager →
        </a>
      </AdminCard>
      <AdminCard title="CTA">
        <AdminField label="Subtitle"><AdminTextarea value={data.cta.subtitle} onChange={(e) => onChange({ ...data, cta: { ...data.cta, subtitle: e.target.value } })} /></AdminField>
        {data.cta.buttons.map((btn, i) => (
          <div key={i} className="flex gap-3 mb-2">
            <AdminInput value={btn.label} placeholder="Label" onChange={(e) => { const b = [...data.cta.buttons]; b[i] = { ...b[i], label: e.target.value }; onChange({ ...data, cta: { ...data.cta, buttons: b } }); }} />
            <AdminInput value={btn.href} placeholder="Href" onChange={(e) => { const b = [...data.cta.buttons]; b[i] = { ...b[i], href: e.target.value }; onChange({ ...data, cta: { ...data.cta, buttons: b } }); }} />
          </div>
        ))}
      </AdminCard>
    </div>
  );
}

export function ImpactPageEditor({ data, onChange }: { data: ImpactContent; onChange: (d: ImpactContent) => void }) {
  return (
    <div className="space-y-6">
      <AdminCard title="Page Hero"><HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} /></AdminCard>
      <AdminCard title="Certificate Section">
        <AdminField label="Paragraphs (one per line)"><AdminTextarea value={data.certificateSection.paragraphs.join('\n\n')} onChange={(e) => onChange({ ...data, certificateSection: { ...data.certificateSection, paragraphs: e.target.value.split('\n\n').filter(Boolean) } })} /></AdminField>
        <AdminField label="Highlight"><AdminInput value={data.certificateSection.highlight} onChange={(e) => onChange({ ...data, certificateSection: { ...data.certificateSection, highlight: e.target.value } })} /></AdminField>
        {data.certificateSection.stats.map((s, i) => (
          <div key={i} className="flex gap-3 mb-2">
            <AdminInput value={s.stat} placeholder="Stat" onChange={(e) => { const n = [...data.certificateSection.stats]; n[i] = { ...n[i], stat: e.target.value }; onChange({ ...data, certificateSection: { ...data.certificateSection, stats: n } }); }} />
            <AdminInput value={s.label} placeholder="Label" onChange={(e) => { const n = [...data.certificateSection.stats]; n[i] = { ...n[i], label: e.target.value }; onChange({ ...data, certificateSection: { ...data.certificateSection, stats: n } }); }} />
          </div>
        ))}
      </AdminCard>
      <AdminCard title="Roles">
        {data.rolesSection.roles.map((role, i) => (
          <div key={i} className="grid md:grid-cols-4 gap-3 mb-3 p-3 bg-slate-950 rounded-lg">
            <AdminInput value={role.icon} onChange={(e) => { const r = [...data.rolesSection.roles]; r[i] = { ...r[i], icon: e.target.value }; onChange({ ...data, rolesSection: { ...data.rolesSection, roles: r } }); }} />
            <AdminInput value={role.title} onChange={(e) => { const r = [...data.rolesSection.roles]; r[i] = { ...r[i], title: e.target.value }; onChange({ ...data, rolesSection: { ...data.rolesSection, roles: r } }); }} />
            <AdminInput value={role.desc} onChange={(e) => { const r = [...data.rolesSection.roles]; r[i] = { ...r[i], desc: e.target.value }; onChange({ ...data, rolesSection: { ...data.rolesSection, roles: r } }); }} />
            <AdminInput value={role.cta} onChange={(e) => { const r = [...data.rolesSection.roles]; r[i] = { ...r[i], cta: e.target.value }; onChange({ ...data, rolesSection: { ...data.rolesSection, roles: r } }); }} />
          </div>
        ))}
      </AdminCard>
    </div>
  );
}

export function InvestorJourneyEditor({ data, onChange }: { data: InvestorJourneyContent; onChange: (d: InvestorJourneyContent) => void }) {
  return (
    <div className="space-y-6">
      <AdminCard title="Page Hero"><HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} /></AdminCard>
      <AdminCard title="Investment Tiers">
        {data.tiers.map((tier, i) => (
          <div key={i} className="p-4 mb-3 bg-slate-950 rounded-lg space-y-2">
            <div className="grid md:grid-cols-2 gap-3">
              <AdminInput value={tier.name} placeholder="Name" onChange={(e) => { const t = [...data.tiers]; t[i] = { ...t[i], name: e.target.value }; onChange({ ...data, tiers: t }); }} />
              <AdminInput value={tier.range} placeholder="Range" onChange={(e) => { const t = [...data.tiers]; t[i] = { ...t[i], range: e.target.value }; onChange({ ...data, tiers: t }); }} />
              <AdminTextarea value={tier.description} placeholder="Description" onChange={(e) => { const t = [...data.tiers]; t[i] = { ...t[i], description: e.target.value }; onChange({ ...data, tiers: t }); }} />
              <AdminTextarea value={tier.benefits.join('\n')} placeholder="Benefits (one per line)" onChange={(e) => { const t = [...data.tiers]; t[i] = { ...t[i], benefits: e.target.value.split('\n').filter(Boolean) }; onChange({ ...data, tiers: t }); }} />
            </div>
          </div>
        ))}
        <AdminField label="Tiers note"><AdminTextarea value={data.tiersNote} onChange={(e) => onChange({ ...data, tiersNote: e.target.value })} /></AdminField>
      </AdminCard>
      <AdminCard title="Compounding Table">
        {data.compoundingRows.map((row, i) => (
          <div key={i} className="grid md:grid-cols-5 gap-2 mb-2">
            <AdminInput type="number" value={row.cycle} onChange={(e) => { const r = [...data.compoundingRows]; r[i] = { ...r[i], cycle: Number(e.target.value) }; onChange({ ...data, compoundingRows: r }); }} />
            <AdminInput value={row.start} onChange={(e) => { const r = [...data.compoundingRows]; r[i] = { ...r[i], start: e.target.value }; onChange({ ...data, compoundingRows: r }); }} />
            <AdminInput value={row.roi} onChange={(e) => { const r = [...data.compoundingRows]; r[i] = { ...r[i], roi: e.target.value }; onChange({ ...data, compoundingRows: r }); }} />
            <AdminInput value={row.appreciation} onChange={(e) => { const r = [...data.compoundingRows]; r[i] = { ...r[i], appreciation: e.target.value }; onChange({ ...data, compoundingRows: r }); }} />
            <AdminInput value={row.total} onChange={(e) => { const r = [...data.compoundingRows]; r[i] = { ...r[i], total: e.target.value }; onChange({ ...data, compoundingRows: r }); }} />
          </div>
        ))}
      </AdminCard>
    </div>
  );
}

export function ReturnsPageEditor({ data, onChange }: { data: ReturnsContent; onChange: (d: ReturnsContent) => void }) {
  return (
    <div className="space-y-6">
      <AdminCard title="Page Hero"><HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} /></AdminCard>
      <AdminCard title="Disclaimer & Status">
        <AdminField label="Disclaimer"><AdminTextarea value={data.disclaimer} onChange={(e) => onChange({ ...data, disclaimer: e.target.value })} /></AdminField>
        <AdminField label="Status line"><AdminInput value={data.statusLine} onChange={(e) => onChange({ ...data, statusLine: e.target.value })} /></AdminField>
      </AdminCard>
      <AdminCard title="Current Returns">
        {data.currentReturns.map((item, i) => (
          <div key={i} className="flex gap-3 mb-2">
            <AdminInput value={item.metric} onChange={(e) => { const n = [...data.currentReturns]; n[i] = { ...n[i], metric: e.target.value }; onChange({ ...data, currentReturns: n }); }} />
            <AdminInput value={item.value} onChange={(e) => { const n = [...data.currentReturns]; n[i] = { ...n[i], value: e.target.value }; onChange({ ...data, currentReturns: n }); }} />
          </div>
        ))}
      </AdminCard>
      <AdminCard title="Track Record">
        {data.trackRecord.map((row, i) => (
          <div key={i} className="grid md:grid-cols-4 gap-3 mb-3 p-3 bg-slate-950 rounded-lg">
            <AdminInput value={row.cycle} onChange={(e) => { const t = [...data.trackRecord]; t[i] = { ...t[i], cycle: e.target.value }; onChange({ ...data, trackRecord: t }); }} />
            <AdminInput value={row.period} onChange={(e) => { const t = [...data.trackRecord]; t[i] = { ...t[i], period: e.target.value }; onChange({ ...data, trackRecord: t }); }} />
            <AdminInput value={row.result} onChange={(e) => { const t = [...data.trackRecord]; t[i] = { ...t[i], result: e.target.value }; onChange({ ...data, trackRecord: t }); }} />
            <AdminInput value={row.status} onChange={(e) => { const t = [...data.trackRecord]; t[i] = { ...t[i], status: e.target.value }; onChange({ ...data, trackRecord: t }); }} />
          </div>
        ))}
      </AdminCard>
      <AdminCard title="Future Section">
        <AdminTextarea value={data.futureSection.paragraphs.join('\n\n')} onChange={(e) => onChange({ ...data, futureSection: { paragraphs: e.target.value.split('\n\n').filter(Boolean) } })} />
      </AdminCard>
    </div>
  );
}

export function AcademyPageEditor({ data, onChange }: { data: AcademyContent; onChange: (d: AcademyContent) => void }) {
  return (
    <div className="space-y-6">
      <AdminCard title="Hero">
        <div className="grid md:grid-cols-2 gap-4">
          <AdminField label="Badge"><AdminInput value={data.hero.badge} onChange={(e) => onChange({ ...data, hero: { ...data.hero, badge: e.target.value } })} /></AdminField>
          <AdminField label="Title"><AdminInput value={data.hero.title} onChange={(e) => onChange({ ...data, hero: { ...data.hero, title: e.target.value } })} /></AdminField>
          <AdminField label="Subtitle"><AdminTextarea value={data.hero.subtitle} onChange={(e) => onChange({ ...data, hero: { ...data.hero, subtitle: e.target.value } })} /></AdminField>
        </div>
      </AdminCard>
      <AdminCard title="Learn Items">
        {data.learnItems.map((item, i) => (
          <div key={i} className="grid md:grid-cols-3 gap-3 mb-3 p-3 bg-slate-950 rounded-lg">
            <AdminInput value={item.icon} onChange={(e) => { const n = [...data.learnItems]; n[i] = { ...n[i], icon: e.target.value }; onChange({ ...data, learnItems: n }); }} />
            <AdminInput value={item.title} onChange={(e) => { const n = [...data.learnItems]; n[i] = { ...n[i], title: e.target.value }; onChange({ ...data, learnItems: n }); }} />
            <AdminInput value={item.body} onChange={(e) => { const n = [...data.learnItems]; n[i] = { ...n[i], body: e.target.value }; onChange({ ...data, learnItems: n }); }} />
          </div>
        ))}
      </AdminCard>
      <AdminCard title="Path Steps">
        {data.pathSteps.map((step, i) => (
          <div key={i} className="grid md:grid-cols-3 gap-3 mb-3 p-3 bg-slate-950 rounded-lg">
            <AdminInput value={step.number} onChange={(e) => { const n = [...data.pathSteps]; n[i] = { ...n[i], number: e.target.value }; onChange({ ...data, pathSteps: n }); }} />
            <AdminInput value={step.title} onChange={(e) => { const n = [...data.pathSteps]; n[i] = { ...n[i], title: e.target.value }; onChange({ ...data, pathSteps: n }); }} />
            <AdminInput value={step.body} onChange={(e) => { const n = [...data.pathSteps]; n[i] = { ...n[i], body: e.target.value }; onChange({ ...data, pathSteps: n }); }} />
          </div>
        ))}
      </AdminCard>
    </div>
  );
}

export function ConnectPageEditor({ data, onChange }: { data: ConnectContent; onChange: (d: ConnectContent) => void }) {
  return (
    <div className="space-y-6">
      <AdminCard title="Page Hero"><HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} /></AdminCard>
      <AdminCard title="Inquiry Form">
        <AdminField label="Form title"><AdminInput value={data.formTitle} onChange={(e) => onChange({ ...data, formTitle: e.target.value })} /></AdminField>
        <AdminField label="Form subtitle"><AdminTextarea value={data.formSubtitle} onChange={(e) => onChange({ ...data, formSubtitle: e.target.value })} /></AdminField>
        {data.investmentOptions.map((opt, i) => (
          <div key={i} className="flex gap-3 mb-2">
            <AdminInput value={opt.value} placeholder="Value" onChange={(e) => { const o = [...data.investmentOptions]; o[i] = { ...o[i], value: e.target.value }; onChange({ ...data, investmentOptions: o }); }} />
            <AdminInput value={opt.label} placeholder="Label" onChange={(e) => { const o = [...data.investmentOptions]; o[i] = { ...o[i], label: e.target.value }; onChange({ ...data, investmentOptions: o }); }} />
            <button type="button" onClick={() => onChange({ ...data, investmentOptions: data.investmentOptions.filter((_, j) => j !== i) })} className="text-red-400 text-xs">×</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ ...data, investmentOptions: [...data.investmentOptions, { value: '', label: '' }] })} className="text-xs text-[#D4AF37]">+ Add option</button>
      </AdminCard>
      <p className="text-sm text-slate-400">Contact cards and social links are edited in Site Settings.</p>
    </div>
  );
}

export function BlueprintEditor({ data, onChange }: { data: BlueprintContent; onChange: (d: BlueprintContent) => void }) {
  return (
    <div className="space-y-6">
      <AdminCard title="Page Hero"><HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} /></AdminCard>
      <AdminCard title="Cycle Steps">
        {data.cycleSteps.map((step, i) => (
          <div key={i} className="grid md:grid-cols-4 gap-3 mb-3 p-3 bg-slate-950 rounded-lg">
            <AdminInput value={step.icon} onChange={(e) => { const s = [...data.cycleSteps]; s[i] = { ...s[i], icon: e.target.value }; onChange({ ...data, cycleSteps: s }); }} />
            <AdminInput value={step.number} onChange={(e) => { const s = [...data.cycleSteps]; s[i] = { ...s[i], number: e.target.value }; onChange({ ...data, cycleSteps: s }); }} />
            <AdminInput value={step.title} onChange={(e) => { const s = [...data.cycleSteps]; s[i] = { ...s[i], title: e.target.value }; onChange({ ...data, cycleSteps: s }); }} />
            <AdminInput value={step.desc} onChange={(e) => { const s = [...data.cycleSteps]; s[i] = { ...s[i], desc: e.target.value }; onChange({ ...data, cycleSteps: s }); }} />
          </div>
        ))}
      </AdminCard>
      <AdminCard title="Why It Works">
        {data.whyPoints.map((point, i) => (
          <div key={i} className="grid md:grid-cols-3 gap-3 mb-3 p-3 bg-slate-950 rounded-lg">
            <AdminInput value={point.icon} onChange={(e) => { const w = [...data.whyPoints]; w[i] = { ...w[i], icon: e.target.value }; onChange({ ...data, whyPoints: w }); }} />
            <AdminInput value={point.title} onChange={(e) => { const w = [...data.whyPoints]; w[i] = { ...w[i], title: e.target.value }; onChange({ ...data, whyPoints: w }); }} />
            <AdminInput value={point.desc} onChange={(e) => { const w = [...data.whyPoints]; w[i] = { ...w[i], desc: e.target.value }; onChange({ ...data, whyPoints: w }); }} />
          </div>
        ))}
      </AdminCard>
    </div>
  );
}

export function TransparencyEditor({ data, onChange }: { data: TransparencyContent; onChange: (d: TransparencyContent) => void }) {
  return (
    <div className="space-y-6">
      <AdminCard title="Page Hero"><HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} /></AdminCard>
      <AdminCard title="Commitments">
        {data.commitments.map((c, i) => (
          <div key={i} className="grid md:grid-cols-3 gap-3 mb-3 p-3 bg-slate-950 rounded-lg">
            <AdminInput value={c.icon} onChange={(e) => { const n = [...data.commitments]; n[i] = { ...n[i], icon: e.target.value }; onChange({ ...data, commitments: n }); }} />
            <AdminInput value={c.title} onChange={(e) => { const n = [...data.commitments]; n[i] = { ...n[i], title: e.target.value }; onChange({ ...data, commitments: n }); }} />
            <AdminTextarea value={c.desc} onChange={(e) => { const n = [...data.commitments]; n[i] = { ...n[i], desc: e.target.value }; onChange({ ...data, commitments: n }); }} />
          </div>
        ))}
      </AdminCard>
      {data.faqCategories.map((cat, ci) => (
        <AdminCard key={ci} title={`FAQ: ${cat.title}`}>
          <AdminField label="Category title">
            <AdminInput value={cat.title} onChange={(e) => { const cats = [...data.faqCategories]; cats[ci] = { ...cats[ci], title: e.target.value }; onChange({ ...data, faqCategories: cats }); }} />
          </AdminField>
          {cat.items.map((item, ii) => (
            <div key={ii} className="mt-3 p-3 bg-slate-950 rounded-lg space-y-2">
              <AdminInput value={item.question} placeholder="Question" onChange={(e) => { const cats = [...data.faqCategories]; const items = [...cats[ci].items]; items[ii] = { ...items[ii], question: e.target.value }; cats[ci] = { ...cats[ci], items }; onChange({ ...data, faqCategories: cats }); }} />
              <AdminMarkdownField label="Answer" value={item.answer} onChange={(value) => { const cats = [...data.faqCategories]; const items = [...cats[ci].items]; items[ii] = { ...items[ii], answer: value }; cats[ci] = { ...cats[ci], items }; onChange({ ...data, faqCategories: cats }); }} />
            </div>
          ))}
          <button type="button" onClick={() => { const cats = [...data.faqCategories]; cats[ci] = { ...cats[ci], items: [...cats[ci].items, { question: '', answer: '' }] }; onChange({ ...data, faqCategories: cats }); }} className="text-xs text-[#D4AF37] mt-2">+ Add FAQ item</button>
        </AdminCard>
      ))}
    </div>
  );
}

export function SiteSettingsEditor({ data, onChange }: { data: SiteSettings; onChange: (d: SiteSettings) => void }) {
  return (
    <div className="space-y-6">
      <AdminCard title="Logos">
        <div className="grid md:grid-cols-2 gap-4">
          <ImageUploadField
            label="Header Logo"
            value={data.logoUrl ?? '/images/logo-icon.svg'}
            onChange={(url) => onChange({ ...data, logoUrl: url })}
            previewClassName="h-12 bg-contain bg-no-repeat bg-center"
            hint="Square mark for the header. Default: /images/logo-icon.svg"
          />
          <ImageUploadField
            label="Footer Logo"
            value={data.footerLogoUrl ?? '/images/sinet-logo.svg'}
            onChange={(url) => onChange({ ...data, footerLogoUrl: url })}
            previewClassName="h-12 bg-contain bg-no-repeat bg-center bg-[#0d1a4a] rounded"
            hint="Wordmark for the dark footer. Default: /images/sinet-logo.svg"
          />
        </div>
      </AdminCard>
      <AdminCard title="Contact Information">
        <div className="grid md:grid-cols-2 gap-4">
          {(
            [
              ['whatsapp', 'WhatsApp URL'],
              ['whatsappDisplay', 'WhatsApp display'],
              ['phone', 'Phone (tel link)'],
              ['phoneDisplay', 'Phone display'],
              ['email', 'Email'],
              ['address', 'Address'],
              ['businessHours', 'Business hours'],
            ] as const
          ).map(([key, label]) => (
            <AdminField key={key} label={label}>
              <AdminInput
                value={data.contact[key]}
                onChange={(e) => onChange({ ...data, contact: { ...data.contact, [key]: e.target.value } })}
              />
            </AdminField>
          ))}
        </div>
      </AdminCard>
      <AdminCard title="Social Links">
        <div className="grid md:grid-cols-2 gap-4">
          {(
            [
              ['whatsapp', 'WhatsApp'],
              ['instagram', 'Instagram'],
              ['linkedin', 'LinkedIn'],
              ['x', 'X (Twitter)'],
              ['facebook', 'Facebook'],
            ] as const
          ).map(([key, label]) => (
            <AdminField key={key} label={label}>
              <AdminInput
                value={data.social[key]}
                onChange={(e) => onChange({ ...data, social: { ...data.social, [key]: e.target.value } })}
              />
            </AdminField>
          ))}
        </div>
      </AdminCard>
      <p className="rounded-lg border border-[#e4dcc9] bg-[#f9f7f2] px-4 py-3 text-sm text-[#7b7263]">
        Primary navigation and footer link columns are managed in code for the institutional site.
        Edit contact, social, and logos here — they appear on the public Header and Footer.
      </p>
      <AdminCard title="Default SEO">
        <AdminField label="Default SEO title">
          <AdminInput value={data.seo.defaultTitle} onChange={(e) => onChange({ ...data, seo: { ...data.seo, defaultTitle: e.target.value } })} />
        </AdminField>
        <AdminMarkdownField
          label="Default SEO description"
          value={data.seo.defaultDescription}
          onChange={(value) => onChange({ ...data, seo: { ...data.seo, defaultDescription: value } })}
          rows={3}
        />
      </AdminCard>
      <AdminCard title="Per-page SEO">
        {PAGE_SEO_KEYS.map(({ key, label }) => (
          <div key={key} className="mb-4 p-4 rounded-lg border border-slate-800 space-y-2">
            <p className="text-sm font-medium text-slate-300">{label}</p>
            <AdminInput
              value={data.pageSeo[key]?.title ?? ''}
              placeholder="Page title"
              onChange={(e) =>
                onChange({
                  ...data,
                  pageSeo: {
                    ...data.pageSeo,
                    [key]: { ...data.pageSeo[key], title: e.target.value, description: data.pageSeo[key]?.description ?? '' },
                  },
                })
              }
            />
            <AdminTextarea
              value={data.pageSeo[key]?.description ?? ''}
              placeholder="Meta description"
              onChange={(e) =>
                onChange({
                  ...data,
                  pageSeo: {
                    ...data.pageSeo,
                    [key]: { title: data.pageSeo[key]?.title ?? '', description: e.target.value },
                  },
                })
              }
            />
          </div>
        ))}
      </AdminCard>
    </div>
  );
}

export function SectorsPageEditor({ data, onChange }: { data: SectorsPageContent; onChange: (d: SectorsPageContent) => void }) {
  return (
    <AdminCard title="Sectors Page Hero">
      <HeroFields hero={data.hero} onChange={(hero) => onChange({ ...data, hero })} />
    </AdminCard>
  );
}

export function WaitlistPageEditor({ data, onChange }: { data: WaitlistPageContent; onChange: (d: WaitlistPageContent) => void }) {
  return (
    <AdminCard title="Waitlist Intro">
      <AdminField label="Title">
        <AdminInput value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
      </AdminField>
      <AdminMarkdownField label="Subtitle" value={data.subtitle} onChange={(value) => onChange({ ...data, subtitle: value })} />
    </AdminCard>
  );
}

export function ContactPageEditor({ data, onChange }: { data: ContactPageContent; onChange: (d: ContactPageContent) => void }) {
  return (
    <AdminCard title="Contact Page Copy">
      <AdminField label="Title">
        <AdminInput value={data.title} onChange={(e) => onChange({ ...data, title: e.target.value })} />
      </AdminField>
      <AdminMarkdownField label="Subtitle" value={data.subtitle} onChange={(value) => onChange({ ...data, subtitle: value })} />
      <AdminField label="Email section label">
        <AdminInput value={data.emailLabel} onChange={(e) => onChange({ ...data, emailLabel: e.target.value })} />
      </AdminField>
      <AdminField label="Social section label">
        <AdminInput value={data.connectLabel} onChange={(e) => onChange({ ...data, connectLabel: e.target.value })} />
      </AdminField>
    </AdminCard>
  );
}
