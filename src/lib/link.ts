// =============================================================================
// Link helper for GitHub Pages base-path support
// -----------------------------------------------------------------------------
// When deploying to https://<user>.github.io/<repo>/ Astro is configured with
// `base: '/<repo>/'`. All internal `<a href>` attributes must include this
// prefix, otherwise links would point to the domain root.
//
// Usage in .astro files:
//
//   import { link } from '../lib/link';
//   <a href={link('/computer-networking')}>...</a>
// =============================================================================

const BASE = import.meta.env.BASE_URL || '/';

/**
 * Prepend the configured base path to an internal absolute path.
 * - "/foo" + base "/repo/"  ->  "/repo/foo"
 * - "/foo" + base "/"        ->  "/foo"
 * - external URLs / hashes / mailto / # are returned unchanged
 */
export function link(path: string): string {
  if (!path) return path;
  if (/^([a-z]+:)?\/\//i.test(path)) return path; // external (http://, https://, //...)
  if (path.startsWith('mailto:') || path.startsWith('tel:') || path.startsWith('#')) return path;
  if (!path.startsWith('/')) return path; // already relative
  const trimmed = BASE.replace(/\/$/, '');
  if (!trimmed) return path;
  if (path === '/') return BASE;
  return trimmed + path;
}
