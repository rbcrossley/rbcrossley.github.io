import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

// =============================================================================
// GitHub Pages configuration
// -----------------------------------------------------------------------------
// If your site will live at:    https://<user>.github.io/<repo>/
//   set SITE  = 'https://<user>.github.io'
//   set BASE  = '/<repo>/'
//
// If using a custom domain or user/organization page (https://<user>.github.io/):
//   set SITE  = 'https://your-domain.com'
//   set BASE  = '/'
// =============================================================================

// Hardcoded on purpose. These feed every canonical URL, og:url, JSON-LD url
// and sitemap <loc> on the site, so they must always be the live domain.
// They used to read process.env.SITE / process.env.BASE, which let the
// GitHub Actions workflow override SITE with the github.io URL at deploy time
// — that made the deployed pages declare github.io as their canonical home.
// The site is served from berojgarengineer.com (see public/CNAME), so there is
// no case where these should be anything else.
const SITE = 'https://berojgarengineer.com';
const BASE = '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    assets: 'assets',
  },
  integrations: [tailwind(), mdx()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  vite: {
    server: {
      hmr: {
        clientPort: 443,
        protocol: 'wss',
      },
      allowedHosts: true,
    },
  },
});
