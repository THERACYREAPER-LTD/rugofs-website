import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  // 'server' output with per-page prerender flags (hybrid rendering):
  // marketing/catalog pages stay static (prerender = true), the payment
  // verification route runs server-side on Netlify so it can safely use
  // the Paystack secret key without ever shipping it to the browser.
  output: 'server',
  adapter: netlify(),
  site: 'https://rugofsfoods.netlify.app', // placeholder — update once the real Netlify site URL/custom domain exists
});
