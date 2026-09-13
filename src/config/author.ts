// =============================================================================
// Author Configuration — SINGLE SOURCE OF TRUTH
// -----------------------------------------------------------------------------
// Edit your name, role, bio and links HERE and nowhere else. This file feeds:
//
//   • /about                     (src/pages/about.astro)
//   • the bio box under every post (src/components/AuthorBio.astro)
//   • the byline on every post     (src/pages/blog/[slug].astro)
//
// You never need to type your name into a markdown post again. Posts may keep
// `author: BerojgarEngineer`, `author: cst`, or omit the field entirely — all of
// those resolve to the default author below via the `aliases` list.
//
// To add a guest author later: add a second entry to `authors`, give it a key,
// and set `author: <key>` in that post's frontmatter.
// =============================================================================

export interface AuthorLink {
  label: string;
  href: string;
  /** true = opens in a new tab with rel="noopener". Auto-detected for http(s). */
  external?: boolean;
}

export interface Author {
  /** Stable id. Use this value in a post's `author:` frontmatter field. */
  key: string;
  /** Other spellings found in existing frontmatter. Matched case-insensitively. */
  aliases: string[];

  name: string;
  /** Short form used in tight spaces, e.g. the byline. */
  shortName: string;
  /** Job title / one-line identity, shown under the name. */
  role: string;
  location: string;

  /** Path to a square image in /public, e.g. '/images/author/bijan.jpg'.
   *  Leave empty ('') to fall back to initials in a coloured circle. */
  avatar: string;

  /** 1–2 sentences. Used in the bio box at the end of every post. */
  bioShort: string;
  /** Full bio, one string per paragraph. Used on the About page. */
  bio: string[];

  /** Optional extra sections for the About page. Empty array = section hidden. */
  sections: { heading: string; paragraphs: string[] }[];

  /** Shown in the bio box and the About page footer. */
  links: AuthorLink[];
}

// -----------------------------------------------------------------------------
// EDIT BELOW
// -----------------------------------------------------------------------------

const bijan: Author = {
  key: 'bijan',
  aliases: ['cst', 'BerojgarEngineer', 'Berojgar Engineer', 'Bijan Aryal', 'bijan-aryal'],

  name: 'Bijan Aryal',
  shortName: 'Bijan Aryal',
  role: 'IT Support Engineer',
  location: 'Kathmandu, Nepal',

  avatar: '', // e.g. '/images/author/bijan.jpg' once you add the file to /public

  bioShort:
    'IT Support Engineer based in Nepal with 3+ years in fintech and finance. ' +
    'Computer Engineering graduate of Kathmandu Engineering College (first division), ' +
    'writing about Linux, Kubernetes and IT careers.',

  bio: [
    'I am <strong>Bijan Aryal</strong>, an IT Support Engineer based in Nepal. I have worked in fintech and finance companies for over three years, supporting the systems that keep those businesses running day to day.',
    'I am a Computer Engineering graduate from <strong>Kathmandu Engineering College</strong>, where I passed with first division. Much of what I learn along the way ends up on this site.',
  ],

  sections: [
    {
      heading: 'What I Work With',
      paragraphs: [
        'My day-to-day work is on <strong>Linux servers and the command line</strong> — administering, troubleshooting and keeping production systems healthy. I also operate <strong>Kubernetes</strong> workloads, working with pods and deployments in containerised environments.',
      ],
    },
    {
      heading: 'Why This Site Exists',
      paragraphs: [
        'My vision is to be a highly rated resource for freshers seeking to enter the IT industry. My mission is to solve the information asymmetry problem prevalent in IT careers in Nepal — the honest guidance I wish someone had given me when I was starting out.',
      ],
    },
  ],

  links: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
};

// -----------------------------------------------------------------------------
// Registry + resolver — you normally do not need to touch anything below.
// -----------------------------------------------------------------------------

export const authors: Record<string, Author> = {
  [bijan.key]: bijan,
};

export const defaultAuthorKey = bijan.key;

/** Pre-built lookup of every key and alias, lower-cased. */
const lookup: Record<string, Author> = {};
for (const a of Object.values(authors)) {
  lookup[a.key.toLowerCase()] = a;
  for (const alias of a.aliases) lookup[alias.toLowerCase()] = a;
  lookup[a.name.toLowerCase()] = a;
}

/**
 * Resolve whatever is in a post's `author:` field to a full Author object.
 * Unknown, empty or missing values fall back to the default author, so no post
 * can ever render a stray "cst" byline again.
 */
export function getAuthor(value?: string | null): Author {
  if (!value) return authors[defaultAuthorKey];
  return lookup[String(value).trim().toLowerCase()] ?? authors[defaultAuthorKey];
}

/** Initials for the avatar fallback, e.g. "Bijan Aryal" -> "BA". */
export function initialsOf(author: Author): string {
  return author.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
