// =============================================================================
// Theme Configuration
// Edit these colors to customize the look of your site. This is the ONLY file
// you need to touch to reskin the whole site — every component reads its
// colors from here (via CSS variables injected in src/layouts/Base.astro).
// After changing colors, restart the dev server (sudo supervisorctl restart frontend)
// =============================================================================

export default {
  colors: {
    // Primary accent color (used for headings, active links, buttons)
    primary: '#06B6D4',         // electric cyan
    primaryDark: '#0E7490',     // darker cyan for hover
    primaryLight: '#ECFEFF',    // very light cyan for header background / sidebar headers

    // Logo badge
    logo: '#0F172A',            // deep navy

    // Hero section
    heroBg: '#0F172A',          // deep navy background of hero
    heroText: '#FFFFFF',
    heroAccent: '#22D3EE',      // bright cyan heading color in hero

    // Body / general
    bg: '#FFFFFF',
    text: '#1E293B',
    muted: '#64748B',

    // Cards
    cardBg: '#FFFFFF',
    cardBorder: '#E2E8F0',
    cardHover: '#ECFEFF',

    // Sidebar
    sidebarSection: '#CFFAFE',  // category header bg
    sidebarActive: '#06B6D4',   // active item bg
    sidebarText: '#1E293B',

    // Footer
    footerBg: '#0F172A',
    footerText: '#E5E7EB',

    // Borders / dividers
    border: '#E2E8F0',

    // Secondary accent — used sparingly for warm CTAs (e.g. the subscribe button)
    accentWarm: '#F59E0B',

    // -------------------------------------------------------------------------
    // Category chip colors — one pastel per reader-facing category (see
    // src/config/categories.ts). Keyed by category id. Each entry needs a light
    // `bg`, a readable `text`, and a saturated `chip` used for dots/active states.
    // -------------------------------------------------------------------------
    categories: {
      linux: { bg: '#ECFEFF', text: '#0E7490', chip: '#06B6D4' },
      devops: { bg: '#EEF2FF', text: '#4338CA', chip: '#6366F1' },
      'it-careers': { bg: '#F0FDF4', text: '#15803D', chip: '#22C55E' },
      'it-education': { bg: '#FFF7ED', text: '#C2410C', chip: '#F97316' },
      loksewa: { bg: '#FDF4FF', text: '#A21CAF', chip: '#D946EF' },
    },
  },
  site: {
    name: 'Berojgar Engineer',
    tagline: 'Linux, DevOps and IT Careers for Nepali IT Graduates',
    logoText: 'BE',
    domain: 'berojgarengineer.com',
    contactEmail: 'contact@berojgarengineer.com',
    ownerName: 'Berojgar Engineer',
  },
};
