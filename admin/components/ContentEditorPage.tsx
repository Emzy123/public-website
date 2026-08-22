'use client';

import React from 'react';
import type { CmsKey } from '@admin/types/content';
import { CMS_KEYS } from '@admin/lib/cms/keys';
import { useCmsEditor } from '@admin/hooks/useCmsEditor';
import { AdminShell, PreviewButton, PublishButton, SaveButton } from './AdminShell';
import { GalleryEditor } from './editors/GalleryEditor';
import { HeroEditor } from './editors/HeroEditor';
import { HomeEditor } from './editors/HomeEditor';
import {
  AboutPageEditor,
  AcademyPageEditor,
  BlueprintEditor,
  ConnectPageEditor,
  ContactPageEditor,
  EmpiresPageEditor,
  ImpactPageEditor,
  InvestorJourneyEditor,
  ReturnsPageEditor,
  SectorsPageEditor,
  SiteSettingsEditor,
  TransparencyEditor,
  WaitlistPageEditor,
} from './editors/PageEditors';
import type {
  AboutContent,
  AcademyContent,
  BlueprintContent,
  ConnectContent,
  ContactPageContent,
  EmpiresPageContent,
  GalleryContent,
  HeroSlide,
  HomeContent,
  ImpactContent,
  InvestorJourneyContent,
  ReturnsContent,
  SectorsPageContent,
  SiteSettings,
  TransparencyContent,
  WaitlistPageContent,
} from '@admin/types/content';

export function ContentEditorPage({ contentKey }: { contentKey: CmsKey }) {
  const meta = CMS_KEYS.find((k) => k.key === contentKey)!;
  const {
    data,
    setData,
    meta: editorMeta,
    loading,
    saving,
    publishing,
    previewing,
    error,
    saved,
    published,
    isDirty,
    saveDraft,
    publish,
    openPreview,
  } = useCmsEditor(contentKey);

  const statusLine = editorMeta?.hasUnpublishedChanges
    ? 'Unpublished draft — changes are not live until you publish'
    : isDirty
      ? 'Unsaved changes'
      : 'Live content is up to date';

  return (
    <AdminShell
      title={meta.label}
      description={`${meta.description} · ${statusLine}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <PreviewButton onClick={openPreview} previewing={previewing} disabled={loading} />
          <SaveButton onClick={saveDraft} saving={saving} saved={saved} />
          <PublishButton
            onClick={publish}
            publishing={publishing}
            published={published}
            disabled={loading || (!editorMeta?.hasUnpublishedChanges && !isDirty)}
          />
        </div>
      }
    >
      {editorMeta?.hasUnpublishedChanges && (
        <div className="mb-4 p-3 rounded-lg bg-amber-900/20 border border-amber-700/40 text-amber-200 text-sm">
          This section has a draft that differs from the live site. Use <strong>Preview</strong> to review, then{' '}
          <strong>Publish</strong> to go live.
        </div>
      )}

      {error && <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">{error}</div>}
      {loading && <p className="text-slate-400">Loading…</p>}

      {!loading && data !== null && (
        <>
          {contentKey === 'hero-slides' && (
            <HeroEditor slides={data as HeroSlide[]} onChange={(slides) => setData(slides)} />
          )}
          {contentKey === 'home' && (
            <HomeEditor data={data as HomeContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'empires-page' && (
            <EmpiresPageEditor data={data as EmpiresPageContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'about' && (
            <AboutPageEditor data={data as AboutContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'blueprint' && (
            <BlueprintEditor data={data as BlueprintContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'transparency' && (
            <TransparencyEditor data={data as TransparencyContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'impact' && (
            <ImpactPageEditor data={data as ImpactContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'investor-journey' && (
            <InvestorJourneyEditor data={data as InvestorJourneyContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'returns' && (
            <ReturnsPageEditor data={data as ReturnsContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'academy' && (
            <AcademyPageEditor data={data as AcademyContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'connect' && (
            <ConnectPageEditor data={data as ConnectContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'sectors-page' && (
            <SectorsPageEditor data={data as SectorsPageContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'gallery' && (
            <GalleryEditor data={data as GalleryContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'waitlist-page' && (
            <WaitlistPageEditor data={data as WaitlistPageContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'contact-page' && (
            <ContactPageEditor data={data as ContactPageContent} onChange={(d) => setData(d)} />
          )}
          {contentKey === 'site-settings' && (
            <SiteSettingsEditor data={data as SiteSettings} onChange={(d) => setData(d)} />
          )}
        </>
      )}
    </AdminShell>
  );
}
