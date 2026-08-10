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
  // Real Netlify project domain (confirmed via the Netlify project lookup:
  // rugofs-foods.netlify.app) — the previous placeholder here was missing
  // the hyphen entirely (rugofsfoods.netlify.app), which would have made
  // canonical URLs and the sitemap point at a domain that isn't this site.
  // Swap this to the real custom domain once one exists.
  site: 'https://rugofs-foods.netlify.app',
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
