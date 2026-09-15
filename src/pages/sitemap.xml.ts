// =============================================================================
// sitemap.xml — generated at build time
// -----------------------------------------------------------------------------
// This replaces the hand-maintained public/sitemap.xml. Every new post in
// src/content/blog/ is picked up automatically, with <lastmod> taken from the
// post's `date` frontmatter. You should never have to edit a sitemap by hand
// again — only the STATIC_PAGES list below, if you add a new standalone page.
//
// IMPORTANT: delete public/sitemap.xml. If that file still exists it will
// collide with this route in the build output.
// =============================================================================
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import theme from '../../theme.config.js';
import { isPublished } from '../config/hidden-posts';

/** Standalone pages. Add a new entry here when you add a new .astro page. */
const STATIC_PAGES: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/blog', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/ai-policy', changefreq: 'yearly', priority: '0.5' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.5' },
  { path: '/terms', changefreq: 'yearly', priority: '0.5' },
  { path: '/disclaimer', changefreq: 'yearly', priority: '0.5' },
  { path: '/affiliate-disclosure', changefreq: 'yearly', priority: '0.5' },
  { path: '/cookie-policy', changefreq: 'yearly', priority: '0.5' },
];

/** YYYY-MM-DD, which is a valid W3C datetime for <lastmod>. */
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL(`https://${theme.site.domain}`);
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  const absolute = (path: string) =>
    new URL(path === '/' ? `${base}/` : `${base}${path}`, origin).href;

  const posts = (await getCollection('blog'))
    .filter(isPublished)
    .sort((a, b) => +new Date(b.data.date) - +new Date(a.data.date));

  const today = isoDay(new Date());

  const entries = [
    ...STATIC_PAGES.map((page) => ({
      loc: absolute(page.path),
      lastmod: today,
      changefreq: page.changefreq,
      priority: page.priority,
    })),
    ...posts.map((post) => ({
      loc: absolute(`/blog/${post.slug}`),
      lastmod: isoDay(new Date(post.data.date)),
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
