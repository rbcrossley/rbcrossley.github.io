// =============================================================================
// Featured Posts - SINGLE SOURCE OF TRUTH
// -----------------------------------------------------------------------------
// Manually curated posts shown in the homepage "Featured Guides" section.
// This is intentionally a hand-picked list, not automatic - edit it whenever
// you want to change what's featured.
//
// Order matters: posts are shown in the order their slugs appear here. Slugs
// are the markdown filename without ".md", LOWERCASED - Astro lowercases
// slugs automatically, so "Nepalese" in a filename becomes "nepalese" in the
// URL/slug (e.g. src/content/blog/Foo-Bar.md -> "foo-bar"). If a post you add
// here doesn't show up, check the actual URL on /blog for the exact casing.
//
// Only the first FEATURED_COUNT slugs are actually rendered, so you can keep a
// longer wishlist here and just reorder to promote/demote a post.
// =============================================================================

export const FEATURED_POST_SLUGS: string[] = [
  'loksewa-computer-engineer-and-it-officer-in-nepal',
  'guide-for-fresher-in-nepalese-it-industry',
  'how-to-deploy-polling-and-webhook-with-gitlab-and-jenkins',
];

/** How many featured posts to actually render on the homepage. */
export const FEATURED_COUNT = 3;

/** Convenience: given all published posts, return the featured ones in curated order. */
export function pickFeatured<T extends { slug: string }>(posts: T[]): T[] {
  // Case-insensitive match so a slug pasted with different casing still works.
  const bySlug = new Map(posts.map((p) => [p.slug.toLowerCase(), p]));
  return FEATURED_POST_SLUGS.map((slug) => bySlug.get(slug.toLowerCase()))
    .filter((p): p is T => Boolean(p))
    .slice(0, FEATURED_COUNT);
}
