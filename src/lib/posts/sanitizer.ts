import sanitizeHtml from 'sanitize-html';

export interface SanitizedPostOutput {
  cleanHtml: string;
  excerpt: string;
  readingTimeMinutes: number;
  wordCount: number;
}

/**
 * Enterprise-grade server-side HTML sanitizer for user-authored update posts.
 * Strips script tags, unsafe schemes (e.g. javascript:), dangerous event handlers,
 * and restricts styling and tags to safe semantic elements.
 */
export function sanitizePostHtml(rawHtml: string): SanitizedPostOutput {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return {
      cleanHtml: '',
      excerpt: '',
      readingTimeMinutes: 1,
      wordCount: 0,
    };
  }

  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'span',
      'b',
      'i',
      'strong',
      'em',
      'strike',
      's',
      'del',
      'u',
      'code',
      'pre',
      'ul',
      'ol',
      'li',
      'blockquote',
      'hr',
      'br',
      'img',
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'th',
      'td',
      'figure',
      'figcaption',
      'a',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      th: ['align', 'valign', 'colspan', 'rowspan'],
      td: ['align', 'valign', 'colspan', 'rowspan'],
      code: ['class'],
      pre: ['class'],
      span: ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || '';
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            ...(isExternal
              ? {
                  target: '_blank',
                  rel: 'noopener noreferrer nofollow',
                }
              : {}),
          },
        };
      },
      img: (tagName, attribs) => {
        return {
          tagName: 'img',
          attribs: {
            ...attribs,
            loading: 'lazy',
          },
        };
      },
    },
    enforceHtmlBoundary: true,
  });

  // Extract plaintext for word count and excerpt
  const plainText = cleanHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = plainText ? plainText.split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  // Excerpt is capped at 240 chars with clean word break
  let excerpt = plainText.slice(0, 240);
  if (plainText.length > 240) {
    const lastSpace = excerpt.lastIndexOf(' ');
    if (lastSpace > 160) excerpt = excerpt.slice(0, lastSpace);
    excerpt += '…';
  }

  return {
    cleanHtml,
    excerpt,
    readingTimeMinutes,
    wordCount: words,
  };
}
