import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

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

const SITE = process.env.SITE || 'https://berojgarengineer.com';
const BASE = process.env.BASE || '/';

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
