// =============================================================================
// Theme Configuration
// Edit these colors to customize the look of your site.
// After changing colors, restart the dev server (sudo supervisorctl restart frontend)
// =============================================================================

export default {
  colors: {
    // Primary accent color (used for headings, active links, buttons)
    primary: '#E91E63',         // hot pink / magenta
    primaryDark: '#C2185B',     // darker shade for hover
    primaryLight: '#FDE8EC',    // very light pink for header background / sidebar headers

    // Logo / strong red
    logo: '#A02020',

    // Hero section
    heroBg: '#2E3141',          // dark navy background of hero
    heroText: '#FFFFFF',
    heroAccent: '#E91E63',      // heading color in hero

    // Body / general
    bg: '#FFFFFF',
    text: '#2A2A2A',
    muted: '#6B7280',

    // Cards
    cardBg: '#FFFFFF',
    cardBorder: '#F3D7DB',
    cardHover: '#FDE8EC',

    // Sidebar
    sidebarSection: '#FBD9DC',  // category header bg
    sidebarActive: '#E91E63',   // active item bg
    sidebarText: '#2A2A2A',

    // Footer
    footerBg: '#2E3141',
    footerText: '#E5E7EB',

    // Borders / dividers
    border: '#F1D5D9',
  },
  site: {
    name: 'Berojgar Engineer',
    tagline: 'Concept Clarity for Computer Science Students',
    logoText: 'BE',
    domain: 'berojgarengineer.com',
    contactEmail: 'contact@berojgarengineer.com',
    ownerName: 'Berojgar Engineer',
  },
};
