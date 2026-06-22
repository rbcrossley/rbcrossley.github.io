// =============================================================================
// Theme Configuration
// Edit these colors to customize the look of your site.
// After changing colors, restart the dev server (sudo supervisorctl restart frontend)
// =============================================================================

export default {
  colors: {
    // Primary accent color (used for headings, active links, buttons)
    primary: '#0F3D78',         // deep academic blue
    primaryDark: '#0A2B52',     // darker shade for hover
    primaryLight: '#E8F0FA',    // soft blue tint for surfaces

    // Logo / strong blue
    logo: '#0B2447',

    // Hero section
    heroBg: '#08111F',          // dark navy background of hero
    heroText: '#F8FBFF',
    heroAccent: '#DCE8FF',      // heading color in hero

    // Body / general
    bg: '#F5F8FC',
    text: '#0F172A',
    muted: '#52607A',

    // Cards
    cardBg: '#FFFFFF',
    cardBorder: '#D8E1EE',
    cardHover: '#EEF4FB',

    // Sidebar
    sidebarSection: '#EAF1FA',  // category header bg
    sidebarActive: '#0F3D78',   // active item bg
    sidebarText: '#0F172A',

    // Footer
    footerBg: '#08111F',
    footerText: '#DCE7F7',

    // Borders / dividers
    border: '#D9E3F0',
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
