import { sanitizePostHtml } from './sanitizer';
import {
  createPost,
  moderatePostDecision,
  getPostBySlug,
  reportPost,
  listPostReports,
  listPublishedPosts,
} from './posts';

describe('Posts & Editorial Sanitizer Engine', () => {
  it('strips malicious script tags, event handlers, and unsafe javascript: urls', () => {
    const maliciousInput = `
      <h1>Safe Heading</h1>
      <script>alert('xss')</script>
      <p onclick="stealCookies()">Paragraph with <a href="javascript:alert(1)">bad link</a></p>
      <img src="https://example.com/pic.jpg" onerror="alert(2)" />
    `;

    const result = sanitizePostHtml(maliciousInput);

    expect(result.cleanHtml).toContain('<h1>Safe Heading</h1>');
    expect(result.cleanHtml).not.toContain('<script>');
    expect(result.cleanHtml).not.toContain('onclick');
    expect(result.cleanHtml).not.toContain('onerror');
    expect(result.cleanHtml).not.toContain('javascript:alert(1)');
    expect(result.cleanHtml).toContain('<img src="https://example.com/pic.jpg" loading="lazy" />');
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });

  it('calculates reading time and excerpt accurately from html body', () => {
    const textContent = Array(450).fill('agricultural').join(' ');
    const html = `<p>${textContent}</p>`;

    const result = sanitizePostHtml(html);

    // 450 words at ~200 wpm = ~3 minutes
    expect(result.wordCount).toBe(450);
    expect(result.readingTimeMinutes).toBe(3);
    expect(result.excerpt.length).toBeLessThanOrEqual(250);
  });
});

describe('Posts Management & Moderation Cycle (Memory Resilience)', () => {
  const uniqueSuffix = Date.now().toString();

  it('creates a post in review with auto-generated slug and excerpt', async () => {
    const created = await createPost({
      title: `Cassava Processing Cluster ${uniqueSuffix}`,
      contentHtml: `<p>A comprehensive study on processing cassava in Kogi West agricultural corridor.</p>`,
      pillar: 'agriculture',
      authorName: 'Amina Bello',
      authorRole: 'Student Lead',
      authorEmail: 'amina@fulokoja.edu.ng',
    });

    expect(created).toBeDefined();
    expect(created.status).toBe('in_review');
    expect(created.slug).toContain('cassava-processing-cluster');
    expect(created.readingTimeMinutes).toBe(1);
    expect(created.summary).toContain('comprehensive study');
  });

  it('does not publish until approved by moderator', async () => {
    const post = await createPost({
      title: `Secret Trade Corridor ${uniqueSuffix}`,
      contentHtml: `<p>Internal discussions on regional trade logistics.</p>`,
      pillar: 'trade_distribution',
      authorName: 'Chidi Okonkwo',
    });

    // Public get by slug without unpublished flag should return null
    const publicPost = await getPostBySlug(post.slug);
    expect(publicPost).toBeNull();

    // Moderator approves the post
    const moderated = await moderatePostDecision({
      postId: post.id,
      decision: 'approve',
      moderatorEmail: 'council@sinet.africa',
      moderatorUserId: 'mod-1',
    });

    expect(moderated).not.toBeNull();
    expect(moderated?.status).toBe('published');
    expect(moderated?.publishedAt).not.toBeNull();

    // Now publicly visible
    const livePost = await getPostBySlug(post.slug);
    expect(livePost).not.toBeNull();
    expect(livePost?.title).toBe(post.title);
  });

  it('properly records and resolves post reports', async () => {
    const post = await createPost({
      title: `Reported Item ${uniqueSuffix}`,
      contentHtml: `<p>Controversial claim regarding campus governance.</p>`,
      pillar: 'community',
      authorName: 'Anonymous',
    });

    const report = await reportPost({
      postId: post.id,
      reporterEmail: 'student@custech.edu.ng',
      reason: 'misinformation',
      details: 'This data is out of date.',
    });

    expect(report).toBeDefined();
    expect(report.status).toBe('pending');
    expect(report.postId).toBe(post.id);

    const postReports = await listPostReports(post.id);
    expect(postReports.some((r) => r.id === report.id)).toBe(true);
  });

  it('filters published posts by pillar and search term', async () => {
    const { posts } = await listPublishedPosts({ limit: 10 });
    expect(posts.length).toBeGreaterThan(0);

    const agPosts = await listPublishedPosts({ pillar: 'agriculture' });
    expect(agPosts.posts.every((p) => p.pillar === 'agriculture')).toBe(true);
  });
});
