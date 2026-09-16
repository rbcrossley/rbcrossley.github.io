// =============================================================================
// Content Categories — SINGLE SOURCE OF TRUTH
// -----------------------------------------------------------------------------
// Reader-facing topic categories. Shown as colored chips on post cards, and
// used to power the "Browse by what interests you" filter on the homepage and
// the /blog index.
//
// These are DIFFERENT from the `tags` field in blog post frontmatter — `tags`
// is machine-readable-only SEO metadata (schema.org / article:tag) and never
// renders on the page. `categories` is the reader-visible taxonomy.
//
// A post can belong to more than one category — e.g. a GitLab/Jenkins post can
// be both "devops" and "linux" at once. Categories intersect; they are not
// mutually-exclusive lanes.
//
// To tag a post: add/edit its `categories:` array in frontmatter, e.g.
//   categories: ["linux", "devops"]
//
// To add a brand-new category: add an entry below with a unique `id`, then add
// a matching color entry to `colors.categories` in theme.config.js, then
// reference the new id from any post's frontmatter.
// =============================================================================

export interface Category {
  /** Stable id. Use this exact value in a post's `categories:` frontmatter array. */
  id: string;
  label: string;
  /** Used in tight spaces (chips, mobile). */
  shortLabel: string;
  description: string;
  /** Icon name — see src/components/Icon.astro for the available set. */
  icon: string;
}

export const categories: Category[] = [
  {
    id: 'linux',
    label: 'Linux',
    shortLabel: 'Linux',
    description: 'Servers, the command line, and system administration.',
    icon: 'terminal',
  },
  {
    id: 'devops',
    label: 'DevOps',
    shortLabel: 'DevOps',
    description: 'CI/CD, Docker, Kubernetes, and self-hosted infrastructure.',
    icon: 'server',
  },
  {
    id: 'it-careers',
    label: 'IT Careers',
    shortLabel: 'Careers',
    description: 'Job search, salaries, interviews, and industry advice.',
    icon: 'briefcase',
  },
  {
    id: 'it-education',
    label: 'IT Education',
    shortLabel: 'Education',
    description: 'Choosing a degree, study strategy, and academic guidance.',
    icon: 'cap',
  },
  {
    id: 'loksewa',
    label: 'Loksewa & Govt Exams',
    shortLabel: 'Loksewa',
    description: 'Public Service Commission, NTC, RBB and other government IT exams.',
    icon: 'landmark',
  },
];

export const categoryById: Record<string, Category> = Object.fromEntries(
  categories.map((c) => [c.id, c])
);

/** Resolve a post's `categories` frontmatter ids to full Category objects, dropping unknown ids. */
export function getCategories(ids?: string[]): Category[] {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => categoryById[id]).filter((c): c is Category => Boolean(c));
}
