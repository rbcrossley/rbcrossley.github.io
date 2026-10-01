// ---------------------------------------------------------------------------
// Related Posts by content similarity (TF-IDF + cosine), computed at build time.
//
// Why not just tags? Tags are free-form SEO strings, so exact matches are rare
// ("Linux" vs "Linux server administration") and generic ones like
// "exam preparation" glue unrelated posts together. This reads the actual
// words of each post instead - title and description weighted highest - and
// adds a small boost for sharing a reader-facing category.
//
// No API, no AI service, no dependency: it runs inside `astro build` in a few
// milliseconds for a few hundred posts.
// ---------------------------------------------------------------------------
import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'blog'>;

const STOP = new Set(
  ('the a an and or of to in for on with is are be this that it as at by from your you ' +
    'my we our can will not was were have has do how what when which into about more most ' +
    'also but if so than then they their them there these those all any its just only one ' +
    'get use using like out some very much here will would should could been being')
    .split(' '),
);

const CATEGORY_BOOST = 0.25; // added when posts share all categories (scaled by overlap)

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9.+#-]*/g) ?? []).filter(
    (w) => w.length > 2 && !STOP.has(w),
  );
}

function postText(p: Post): string[] {
  const body = (p.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ') // code blocks are noise for topic matching
    .replace(/<[^>]+>/g, ' ')
    .replace(/\]\([^)]*\)/g, ']'); // drop link URLs, keep link text
  const title = tokenize(p.data.title);
  const desc = tokenize(p.data.description ?? '');
  const tags = tokenize((p.data.tags ?? []).join(' '));
  return [
    ...tokenize(body),
    ...title, ...title, ...title,
    ...desc, ...desc,
    ...tags, ...tags,
  ];
}

let cache: { key: string; vectors: Map<string, Map<string, number>> } | null = null;

function buildVectors(posts: Post[]) {
  const key = posts.map((p) => p.slug).join('|');
  if (cache?.key === key) return cache.vectors;

  const counts = new Map<string, Map<string, number>>();
  const df = new Map<string, number>();
  for (const p of posts) {
    const c = new Map<string, number>();
    for (const t of postText(p)) c.set(t, (c.get(t) ?? 0) + 1);
    counts.set(p.slug, c);
    for (const t of c.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  }

  const N = posts.length;
  const vectors = new Map<string, Map<string, number>>();
  for (const [slug, c] of counts) {
    const v = new Map<string, number>();
    let norm = 0;
    for (const [t, n] of c) {
      const d = df.get(t)!;
      if (d >= N) continue; // appears everywhere -> says nothing
      const w = (1 + Math.log(n)) * Math.log(N / d);
      v.set(t, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [t, w] of v) v.set(t, w / norm);
    vectors.set(slug, v);
  }
  cache = { key, vectors };
  return vectors;
}

function cosine(a: Map<string, number>, b: Map<string, number>) {
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  let s = 0;
  for (const [t, w] of small) s += w * (big.get(t) ?? 0);
  return s;
}

/** Top `limit` posts most similar to `current`, from the published `all` list. */
export function getRelatedPosts(current: Post, all: Post[], limit = 3): Post[] {
  const vectors = buildVectors(all.some((p) => p.slug === current.slug) ? all : [...all, current]);
  const me = vectors.get(current.slug)!;
  const myCats = new Set(current.data.categories ?? []);

  return all
    .filter((p) => p.slug !== current.slug)
    .map((p) => {
      const shared = (p.data.categories ?? []).filter((c) => myCats.has(c)).length;
      const catScore = myCats.size ? (CATEGORY_BOOST * shared) / myCats.size : 0;
      return { post: p, score: cosine(me, vectors.get(p.slug)!) + catScore };
    })
    .sort((a, b) => b.score - a.score || +new Date(b.post.data.date) - +new Date(a.post.data.date))
    .slice(0, limit)
    .map((x) => x.post);
}
