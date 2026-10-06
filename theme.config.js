// =============================================================================
// Theme Configuration
// Edit these colors to customize the look of your site. This is the ONLY file
// you need to touch to reskin the whole site - every component reads its
// colors from here (via CSS variables injected in src/layouts/Base.astro).
//
// Rules this palette follows:
//   - Flat colors only. No gradients anywhere.
//   - One accent: army green. Everything else is khaki, white or olive ink.
//   - No pale tints. Surfaces are either white or pure khaki.
// =============================================================================

export default {
  colors: {
    // The one accent - army green. Buttons, links, active states, logo.
    primary: '#4B5320',
    // Deeper olive for hover states and for body text sitting on khaki.
    primaryDark: '#333D16',

    // Pure khaki - the hero band and the footer.
    khaki: '#C3B091',
    // Ink used for headings on khaki (7.5:1 contrast).
    onKhaki: '#1F2415',

    // Page
    bg: '#FFFFFF',
    text: '#1F2415',      // olive ink, 15.9:1 on white
    muted: '#5C5E4E',     // olive grey, 6.6:1 on white
    border: '#DCD8CA',    // warm hairline, same family as khaki

    // Code blocks sit on an approved dark surface.
    codeBg: '#181818',
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
