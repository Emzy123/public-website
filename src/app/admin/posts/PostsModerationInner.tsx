'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminCard } from '@admin/components/AdminShell';
import { StatusPill } from '@/components/ui/Badge';
import { formatWatDate, formatWatDateTime } from '@/lib/date';
import type { PostRecord, PostPillar, PostStatus } from '@/lib/db/schema/posts';

export function PostsModerationInner() {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [counts, setCounts] = useState({
    inReview: 0,
    draft: 0,
    published: 0,
    rejected: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PostStatus | 'all'>('in_review');
  const [selectedPost, setSelectedPost] = useState<PostRecord | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // New post creation modal state
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPillar, setNewPillar] = useState<PostPillar>('agriculture');
  const [newSummary, setNewSummary] = useState('');
  const [newContentHtml, setNewContentHtml] = useState('');
  const [newCoverImageUrl, setNewCoverImageUrl] = useState('');
  const [newTags, setNewTags] = useState('');
  const [savingNew, setSavingNew] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts?status=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to load moderation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  const handleDecision = async (postId: string, decision: 'approve' | 'reject') => {
    if (decision === 'approve') {
      const confirmed = window.confirm(
        'Approve and publish this post immediately to the public SINet /news feed and RSS feed?'
      );
      if (!confirmed) return;
    }
    if (decision === 'reject' && !rejectReason.trim()) {
      alert('Please provide a constructive editorial reason or feedback for rejection.');
      return;
    }

    setProcessingId(postId);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rejectionReason: decision === 'reject' ? rejectReason.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Moderation decision failed');

      setFeedbackMessage(data.message);
      setSelectedPost(null);
      setShowRejectInput(false);
      setRejectReason('');
      await fetchQueue();
    } catch (err: unknown) {
      setFeedbackMessage((err as Error).message || 'Error executing decision');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNew(true);
    try {
      const tagsArray = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          pillar: newPillar,
          summary: newSummary || undefined,
          contentHtml: newContentHtml,
          coverImageUrl: newCoverImageUrl || null,
          tags: tagsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit article');

      setIsCreating(false);
      setNewTitle('');
      setNewSummary('');
      setNewContentHtml('');
      setNewCoverImageUrl('');
      setNewTags('');
      setFeedbackMessage('Post successfully submitted to moderation queue.');
      await fetchQueue();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to create post');
    } finally {
      setSavingNew(false);
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    return <StatusPill status={status} />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">
            Review community articles, student enterprise field notes, and agricultural milestones before public distribution.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 transition"
        >
          <span>✍️</span>
          <span>Draft New Article</span>
        </button>
      </div>

      {feedbackMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3.5 text-xs text-blue-800 flex items-center justify-between">
          <span>{feedbackMessage}</span>
          <button onClick={() => setFeedbackMessage(null)} className="font-bold text-blue-500">
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          onClick={() => setActiveTab('in_review')}
          className={`rounded-2xl border p-4 text-left transition ${
            activeTab === 'in_review'
              ? 'border-amber-500 bg-amber-50/50 shadow-sm'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <p className="text-xs font-bold text-slate-500">In Review Queue</p>
          <p className="mt-1 text-2xl font-black text-amber-700">{counts.inReview}</p>
        </button>

        <button
          onClick={() => setActiveTab('published')}
          className={`rounded-2xl border p-4 text-left transition ${
            activeTab === 'published'
              ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <p className="text-xs font-bold text-slate-500">Published Live</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{counts.published}</p>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`rounded-2xl border p-4 text-left transition ${
            activeTab === 'rejected'
              ? 'border-rose-500 bg-rose-50/50 shadow-sm'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <p className="text-xs font-bold text-slate-500">Declined / Needs Edits</p>
          <p className="mt-1 text-2xl font-black text-rose-700">{counts.rejected}</p>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`rounded-2xl border p-4 text-left transition ${
            activeTab === 'all'
              ? 'border-blue-500 bg-blue-50/50 shadow-sm'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <p className="text-xs font-bold text-slate-500">Total Registry</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{counts.total}</p>
        </button>
      </div>

      {/* Main Queue List */}
      <AdminCard title={`Submissions Feed (${posts.length})`}>
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading editorial posts…</div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs font-bold text-slate-700">No posts in this queue.</p>
            <p className="mt-1 text-[11px] text-slate-500">
              When student leads or members draft updates, they will appear here for editorial sign-off.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map((post) => (
              <div key={post.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{post.title}</h3>
                      {getStatusBadge(post.status)}
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                        {post.pillar.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-600 line-clamp-2">{post.summary}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>✍️ By {post.authorName} ({post.authorRole})</span>
                      <span>⏱️ {post.readingTimeMinutes} min read</span>
                      <span>
                        Created: {formatWatDate(post.createdAt)}
                      </span>
                      {post.status === 'published' && (
                        <Link
                          href={`/news/${post.slug}`}
                          target="_blank"
                          className="font-bold text-blue-600 hover:underline"
                        >
                          View Live ↗
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPost(post);
                        setShowRejectInput(false);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                    >
                      Inspect Post
                    </button>

                    {post.status === 'in_review' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDecision(post.id, 'approve')}
                          disabled={processingId === post.id}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition shadow-sm"
                        >
                          ✓ Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPost(post);
                            setShowRejectInput(true);
                          }}
                          disabled={processingId === post.id}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Post Inspection Drawer / Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-2">
              {getStatusBadge(selectedPost.status)}
              <span className="text-xs font-bold uppercase text-blue-600">
                {selectedPost.pillar.replace('_', ' ')}
              </span>
            </div>

            <h2 className="mt-2 text-lg font-bold text-slate-900">{selectedPost.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>By {selectedPost.authorName} ({selectedPost.authorRole})</span>
              <span>•</span>
              <span>{selectedPost.authorEmail || 'No email provided'}</span>
              <span>•</span>
              <span>Submitted: {formatWatDateTime(selectedPost.createdAt)}</span>
            </div>
            {selectedPost.moderatedAt && (
              <p className="mt-1 text-[11px] text-slate-500">
                Moderated by <strong className="text-slate-700">{selectedPost.moderatedBy || 'Editor'}</strong> on{' '}
                {formatWatDateTime(selectedPost.moderatedAt)}
              </p>
            )}
            {selectedPost.status === 'published' && (
              <div className="mt-2 flex items-center gap-3 text-xs">
                <Link
                  href={`/news/${selectedPost.slug}`}
                  target="_blank"
                  className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>View Published Live</span> ↗
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  href="/feed.xml"
                  target="_blank"
                  className="font-medium text-amber-700 hover:underline"
                >
                  RSS 2.0 Feed
                </Link>
              </div>
            )}

            <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Summary Excerpt</h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{selectedPost.summary}</p>
            </div>

            {selectedPost.coverImageUrl && (
              <div className="mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPost.coverImageUrl}
                  alt={selectedPost.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Sanitized Content Preview
              </h4>
              <div
                className="prose prose-slate max-w-none text-xs text-slate-700 max-h-60 overflow-y-auto p-3 bg-slate-50/50 rounded-xl border border-slate-100"
                dangerouslySetInnerHTML={{ __html: selectedPost.contentHtml }}
              />
            </div>

            {showRejectInput ? (
              <div className="mt-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 space-y-3">
                <h4 className="text-xs font-bold text-rose-900">Provide Editorial Feedback for Rejection</h4>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain what needs revision (e.g. verification of metrics, tone, missing references)..."
                  className="w-full rounded-xl border border-rose-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(selectedPost.id, 'reject')}
                    disabled={processingId === selectedPost.id}
                    className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>

                {selectedPost.status === 'in_review' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(true)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Reject with Feedback
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision(selectedPost.id, 'approve')}
                      disabled={processingId === selectedPost.id}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      ✓ Approve &amp; Publish Live
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create New Post Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setIsCreating(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-slate-900">Compose New Article</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Drafted articles undergo server-side sanitization and appear in the moderation feed.
            </p>

            <form onSubmit={handleCreatePost} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Student Enterprise Pilot Launches in Kogi State"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Pillar *</label>
                  <select
                    value={newPillar}
                    onChange={(e) => setNewPillar(e.target.value as PostPillar)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="agriculture">🌱 Agriculture</option>
                    <option value="trade_distribution">📦 Trade &amp; Distribution</option>
                    <option value="real_estate">🏛️ Real Estate</option>
                    <option value="community">🤝 Community</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Cover Image URL</label>
                  <input
                    type="url"
                    value={newCoverImageUrl}
                    onChange={(e) => setNewCoverImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Summary / Standfirst (optional)</label>
                <textarea
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="A concise 1-2 sentence lead for cards and preview snippets..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Article Content (HTML/Rich Text) *</label>
                  <span className="text-[10px] text-slate-400">Supports &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;blockquote&gt;</span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={newContentHtml}
                  onChange={(e) => setNewContentHtml(e.target.value)}
                  placeholder="<p>Write your detailed article body here...</p>"
                  className="mt-1 font-mono w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Kogi State, Agriculture, Pilot, Enterprise"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNew}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition shadow-sm"
                >
                  {savingNew ? 'Saving…' : 'Submit for Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
