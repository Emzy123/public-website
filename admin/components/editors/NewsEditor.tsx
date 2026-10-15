'use client';

import type { NewsContent, NewsPost } from '@admin/types/content';
import { AdminCard } from '../AdminShell';
import { AdminField, AdminInput, AdminTextarea } from '../ui/AdminField';
import { AdminMarkdownField } from '../ui/AdminMarkdownField';
import { ImageUploadField } from '../ui/ImageUploadField';
import { checkNewsPostRisk } from '@/lib/compliance/risk-check';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function newPost(sortOrder: number): NewsPost {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    imageUrl: '',
    publishedAt: today,
    published: false,
    sortOrder,
  };
}

export function NewsEditor({ data, onChange }: { data: NewsContent; onChange: (d: NewsContent) => void }) {
  const sorted = [...data.posts].sort((a, b) => a.sortOrder - b.sortOrder);

  const update = (id: string, patch: Partial<NewsPost>) => {
    onChange({
      ...data,
      posts: data.posts.map((post) => (post.id === id ? { ...post, ...patch } : post)),
    });
  };

  const remove = (id: string) => {
    onChange({ ...data, posts: data.posts.filter((post) => post.id !== id) });
  };

  const move = (id: string, direction: -1 | 1) => {
    const index = sorted.findIndex((post) => post.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ ...data, posts: next.map((post, i) => ({ ...post, sortOrder: i })) });
  };

  return (
    <div className="space-y-6">
      <AdminCard title="Page intro">
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="Eyebrow">
            <AdminInput value={data.hero.badge} onChange={(e) => onChange({ ...data, hero: { ...data.hero, badge: e.target.value } })} />
          </AdminField>
          <AdminField label="Title">
            <AdminInput value={data.hero.title} onChange={(e) => onChange({ ...data, hero: { ...data.hero, title: e.target.value } })} />
          </AdminField>
          <AdminField label="Subtitle">
            <AdminTextarea value={data.hero.subtitle} onChange={(e) => onChange({ ...data, hero: { ...data.hero, subtitle: e.target.value } })} />
          </AdminField>
        </div>
      </AdminCard>

      <AdminCard title="Posts">
        <button
          type="button"
          onClick={() => onChange({ ...data, posts: [...data.posts, newPost(data.posts.length)] })}
          className="mb-4 rounded-lg bg-[#d9a23c] px-4 py-2 text-sm font-semibold text-[#0d1a4a] hover:bg-[#eccb7c]"
        >
          + Add post
        </button>

        {sorted.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#e4dcc9] bg-[#f9f7f2] px-4 py-8 text-center text-sm text-[#7b7263]">
            No posts yet. Publish milestones and announcements here.
          </p>
        ) : (
          <div className="space-y-4">
            {sorted.map((post) => {
              const risk = checkNewsPostRisk(post);
              return (
                <div key={post.id} className="rounded-xl border border-[#e4dcc9] bg-[#f9f7f2] p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-[#0d1a4a]">
                      <input
                        type="checkbox"
                        checked={post.published}
                        onChange={(e) => update(post.id, { published: e.target.checked })}
                      />
                      Published on public site
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => move(post.id, -1)} className="text-xs text-[#7b7263] hover:text-[#0d1a4a]">↑</button>
                      <button type="button" onClick={() => move(post.id, 1)} className="text-xs text-[#7b7263] hover:text-[#0d1a4a]">↓</button>
                      <button type="button" onClick={() => remove(post.id)} className="text-xs text-red-600 hover:underline">Remove</button>
                    </div>
                  </div>

                  {risk.hasRisk && (
                    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-950 shadow-sm">
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg leading-none" aria-hidden="true">⚠</span>
                        <div>
                          <p className="font-bold text-amber-900">
                            Financial Promotion / Return Terms Detected
                          </p>
                          <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                            This post matches investment/return keywords{' '}
                            <span className="font-mono font-semibold bg-amber-200/70 px-1 py-0.5 rounded">
                              {risk.matchedTerms.join(', ') || 'return / investment claims'}
                            </span>{' '}
                            in field(s): <span className="font-semibold">{risk.matchedFields.join(', ')}</span>.
                            Please ensure institutional compliance and legal sign-off before publishing to the public site.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Title">
                    <AdminInput
                      value={post.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        const autoSlug = !post.slug || post.slug === slugify(post.title);
                        update(post.id, { title, ...(autoSlug ? { slug: slugify(title) } : {}) });
                      }}
                    />
                  </AdminField>
                  <AdminField label="Slug (URL)">
                    <AdminInput value={post.slug} onChange={(e) => update(post.id, { slug: slugify(e.target.value) || e.target.value })} />
                  </AdminField>
                  <AdminField label="Publish date">
                    <AdminInput type="date" value={post.publishedAt.slice(0, 10)} onChange={(e) => update(post.id, { publishedAt: e.target.value })} />
                  </AdminField>
                  <AdminField label="Excerpt">
                    <AdminTextarea value={post.excerpt} onChange={(e) => update(post.id, { excerpt: e.target.value })} />
                  </AdminField>
                  <div className="md:col-span-2">
                    <ImageUploadField label="Cover image" value={post.imageUrl} onChange={(imageUrl) => update(post.id, { imageUrl })} previewClassName="h-40" />
                  </div>
                  <div className="md:col-span-2">
                    <AdminMarkdownField label="Body" value={post.body} onChange={(body) => update(post.id, { body })} />
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
