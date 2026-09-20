// =============================================================================
// Theme Configuration
// Edit these colors to customize the look of your site. This is the ONLY file
// you need to touch to reskin the whole site - every component reads its
// colors from here (via CSS variables injected in src/layouts/Base.astro).
// After changing colors, restart the dev server (sudo supervisorctl restart frontend)
// =============================================================================

export default {
  colors: {
    // Primary accent color - army green, the site's identity color (used for
    // headings, active links, buttons, logo, and the sidebar/hero accents).
    primary: '#4B5320',         // army green
    primaryDark: '#333D16',     // deep olive for hover / on-light text
    primaryLight: '#EEF1E4',    // pale sage tint for header background / sidebar headers

    // Logo badge
    logo: '#4B5320',            // army green

    // Hero section
    heroBg: '#1F2415',          // near-black olive background of hero
    heroText: '#FFFFFF',
    heroAccent: '#9CB56B',      // lighter sage-green heading color in hero

    // Body / general
    bg: '#FFFFFF',
    text: '#1E293B',
    muted: '#64748B',

    // Cards
    cardBg: '#FFFFFF',
    cardBorder: '#E2E7D8',
    cardHover: '#F1F4EC',

    // Sidebar
    sidebarSection: '#E9EEDF',  // category header bg
    sidebarActive: '#4B5320',   // active item bg
    sidebarText: '#1E293B',

    // Footer
    footerBg: '#1B1F12',
    footerText: '#E5E7EB',

    // Borders / dividers
    border: '#E2E7D8',

    // Secondary accent - used sparingly for warm CTAs (e.g. the subscribe button)
    accentWarm: '#F59E0B',

    // -------------------------------------------------------------------------
    // Category chip colors - one pastel per reader-facing category (see
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
