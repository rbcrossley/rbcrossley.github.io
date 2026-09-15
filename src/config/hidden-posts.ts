// =============================================================================
// Posts that exist in src/content/blog/ but must NOT be published anywhere.
// -----------------------------------------------------------------------------
// One list, imported by every place that enumerates posts:
//   • src/pages/index.astro          (homepage cards)
//   • src/pages/blog/index.astro     (blog listing)
//   • src/pages/blog/[slug].astro    (the post pages themselves)
//   • src/pages/posts.json.ts        (feed consumed by the Android app)
//   • src/pages/sitemap.xml.ts       (sitemap)
//
// Adding a slug here removes the post from the site completely — no page is
// generated, no link, no sitemap entry, and the app stops receiving it.
// =============================================================================

export const HIDDEN_POST_SLUGS = new Set<string>([
  'pyq-loksewa',
  'micro-syllabus-of-data-structures-and-algorithms',
]);

/** Convenience predicate: `posts.filter(isPublished)`. */
export const isPublished = (entry: { slug: string }): boolean =>
  !HIDDEN_POST_SLUGS.has(entry.slug);
