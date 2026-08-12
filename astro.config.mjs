import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 'server' output with per-page prerender flags (hybrid rendering):
  // marketing/catalog pages stay static (prerender = true), the payment
  // verification route runs server-side on Netlify so it can safely use
  // the Paystack secret key without ever shipping it to the browser.
  output: 'server',
  adapter: netlify(),
  // Real custom domain (confirmed live via Netlify's project lookup and a
  // direct fetch — resolves, serves the site, valid SSL). The previous
  // rugofs-foods.netlify.app value now only matters as a fallback/branch
  // preview URL, not the canonical site.
  site: 'https://rugofsfoods.com.ng',
  integrations: [
    sitemap({
      // Transactional/utility pages have no unique content to rank on and
      // shouldn't be indexed — excluded here, and also marked noindex
      // directly on each page (see BaseLayout's `noindex` prop) so search
      // engines that find them via another route still skip them.
      filter: (page) =>
        !["cart", "order-confirmed", "order-status", "thank-you"].some((path) =>
          page.includes(`/${path}`),
        ),
    }),
  ],
});
