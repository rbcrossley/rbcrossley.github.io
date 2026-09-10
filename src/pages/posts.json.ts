// =============================================================================
// posts.json  —  feed consumed by the Berojgar Engineer Android app
// -----------------------------------------------------------------------------
// Built statically with the rest of the site, so it deploys to
//   https://berojgarengineer.com/posts.json
// on every push. Publishing a new post to the app is just `git push`.
//
// The app receives each post's frontmatter plus its RAW MARKDOWN body and
// renders it natively with flutter_markdown — no WebView.
// =============================================================================

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

// Bump when the JSON shape changes in a way older app builds can't read.
const FEED_VERSION = 1;

/** Turn a site-relative asset path (/images/blog/x.png) into an absolute URL. */
function absolute(path: string | undefined, origin: string): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return origin.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

export const GET: APIRoute = async ({ site }) => {
  const origin = (site?.toString() ?? 'https://berojgarengineer.com').replace(/\/$/, '');

  const entries = await getCollection('blog');

  const posts = entries
    // newest first
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map((entry) => ({
      slug: entry.slug,
      title: entry.data.title,
      description: entry.data.description ?? null,
      date: entry.data.date.toISOString(),
      author: entry.data.author,
      image: absolute(entry.data.image, origin),
      url: `${origin}/blog/${entry.slug}`,
      // Raw Markdown. The app renders this natively.
      body: entry.body,
      // Cheap client-side signal for "has this post changed?"
      readingMinutes: Math.max(1, Math.round(entry.body.trim().split(/\s+/).length / 200)),
    }));

  const payload = {
    feedVersion: FEED_VERSION,
    site: origin,
    generatedAt: new Date().toISOString(),
    count: posts.length,
    posts,
  };

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // GitHub Pages ignores this, but harmless and useful behind a CDN.
      'Cache-Control': 'public, max-age=300',
    },
  });
};
