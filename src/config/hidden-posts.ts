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
// Adding a slug here removes the post from the site completely - no page is
// generated, no link, no sitemap entry, and the app stops receiving it.
//
// A post is also hidden when its frontmatter has `draft: true` (set via the
// CMS's "Save Draft" action) - see isPublished() below. HIDDEN_POST_SLUGS
// stays a separate manual list for permanently-retired posts; draft is for
// posts not ready yet.
// =============================================================================

export const HIDDEN_POST_SLUGS = new Set<string>([
  'pyq-loksewa',
  'micro-syllabus-of-data-structures-and-algorithms',
]);

/** Convenience predicate: `posts.filter(isPublished)`. */
export const isPublished = (entry: { slug: string; data?: { draft?: boolean } }): boolean =>
  !HIDDEN_POST_SLUGS.has(entry.slug) && !entry.data?.draft;
