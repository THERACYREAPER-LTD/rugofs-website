# Rugofs Foods — Website (Phase 1 Catalog + Test-Mode Paystack Checkout)

Astro + Netlify. Catalog site with direct Paystack payment ("Order Now") as
the primary order path (WhatsApp kept as a fallback) — no order database
yet. Built from `11 Operations/Website Build Spec — Phase 1 Catalog.md` and
`09 Marketing/Website Copy — Phase 1.md` in the Brand Bible, plus a
lightweight slice of the Phase 2 payments spec (Section 9) pulled forward
at Racy's request, ahead of pricing/GIGL/Supabase being ready.

**Update (2026-08-06):** Checkout button relabeled "Pay Now" → **"Order
Now"** per Racy's preference. Added a `/policies` page (Delivery, Refund &
Returns, Privacy, Terms of Service — drafted honestly from confirmed
operational facts, explicitly flagged as not-yet-legally-reviewed) linked
from the footer and from the checkout form. Removed the unsubstantiated
"world-class standards" line from the homepage hero copy (Racy flagged it
as false for where the business is today) and audited the rest of the site
for similar overreaching claims — none found. Gave the homepage hero and
section headers a more intentional visual treatment (two-column hero with
an on-brand accent panel, consistent eyebrow+heading pattern across
sections, card/button hover polish) while keeping every claim grounded —
no stock photos or invented statistics were added.

## What's in here

- `src/data/` — product, category, and site settings content, structured to
  match the Sanity schema in the Build Spec exactly. This is a stand-in for
  Sanity: swap these static files for live GROQ fetches once a Sanity
  project exists, without needing to touch the pages/components.
- `src/data/payment.ts` — Paystack public key + the test checkout amount
  (see Payments section below).
- `src/pages/` — Home, Shop, Product Detail (dynamic), About, Contact,
  Thank You, Order Confirmed (payment verification).
- `src/pages/order-confirmed.astro` — the only server-rendered page
  (`prerender = false`); everything else is static.
- `src/components/` — Header, Footer, ProductCard, PaystackCheckout.
- `src/styles/global.css` — design tokens (Harvest Plum/Gold/Brown/Green/
  Cream, Montserrat/Lato).
- `public/images/rugofs-logo-placeholder.svg` — **placeholder brand mark.**
  The real logo (`04 Visual Identity/Rugofs_LOGO.jpeg`) wasn't available to
  this build (device connection dropped mid-session) — swap it in before
  launch. A vector (SVG) version is still an open item per the Build Spec.

## Payments (Paystack — currently TEST MODE)

Racy's Paystack account is still under compliance review, so this is wired
to **test keys only** — no real money can move through it right now.

- **Public key** (`pk_test_...`) lives in `.env` as `PUBLIC_PAYSTACK_PUBLIC_KEY`
  and is safe in client-side code by design — it can only open the payment
  popup, not charge anything on its own.
- **Secret key** (`sk_test_...`) is used *only* server-side, inside
  `src/pages/order-confirmed.astro`, to verify a payment actually succeeded
  after the fact. It is read from `process.env.PAYSTACK_SECRET_KEY` — a
  non-`PUBLIC_`-prefixed variable, which Astro never bundles into
  client-side JS. **This key must never be committed to git or hardcoded
  anywhere in `src/`.** Set it in Netlify's dashboard (Site settings →
  Environment variables) when deploying, and in a local `.env` (gitignored
  — see `.env.example`) for local testing. It is deliberately **not**
  included in this delivered copy of the repo.
- **Real prices aren't set yet** (Pricing Calculator still needs real cost
  inputs), so checkout currently charges a flat **₦100 test placeholder**
  per order — clearly labeled "TEST MODE" on the product page so no one
  mistakes it for a real price. Once a product's `priceNGN` is set in
  `src/data/products.ts`, checkout automatically charges that instead — no
  other code changes needed.
- **Not yet live-tested end-to-end.** The build environment this was
  developed in blocks outbound requests to `paystack.co` domains (sandbox
  network allowlist), so the actual popup-open → pay → verify flow has
  only been checked for correct code structure and against Paystack's
  publicly documented request/response shapes — not run against a real
  test transaction. **Please run one real test payment yourself once
  deployed** (or once you can open the site in a normal browser) before
  trusting this in front of customers, and let me know if anything behaves
  unexpectedly — payment code is exactly the kind of thing that deserves a
  live check, not just a read-through.
- There's no order-tracking database yet (Supabase, per the Phase 2 spec,
  Section 9) — after a verified payment, the confirmation page asks the
  customer to also send their order details via WhatsApp so Rugofs has a
  record to fulfill against. This is a deliberate stopgap, not an
  oversight.
- When Paystack compliance clears and live keys (`pk_live_...` /
  `sk_live_...`) are issued, swapping to them is an environment-variable
  change only — replace the values in Netlify's dashboard, nothing in the
  code needs to change.

## Running locally

```bash
npm install
cp .env.example .env   # then fill in real test keys
npm run dev
```

## Building

```bash
npm run build
```

Note: `astro preview` doesn't work with the Netlify adapter installed — to
preview a production build locally, serve the `dist/` folder directly
(e.g. `npx serve dist`) or push to Netlify and use its deploy previews.
The `order-confirmed` page won't work under a plain static file server
since it needs the server runtime — test it via `netlify dev` (Netlify
CLI) or on an actual Netlify deploy.

## What's needed to go live

Connector status checked 2026-08-06, via Claude's connector list for this
account:

1. **GitHub** — Racy reported connecting this, but no GitHub connector
   currently shows up as available in this Claude session (checked directly
   via the connector list — only the tools below appeared). This may mean
   it's connected at the account level but not enabled for chat use, or the
   connection didn't complete — worth double-checking in Claude's connector
   settings. Until it's confirmed available, this repo hasn't been pushed
   anywhere; it's still only in this delivered zip.
2. **Netlify** — **is** connected and enabled in this session. This means a
   real deploy is possible directly from here without GitHub, once Racy
   confirms she wants that (deploying will need the Paystack keys entered
   as environment variables in Netlify's dashboard — the secret key
   specifically should be set there directly rather than passed through
   chat, to keep it out of any conversation log).
3. **Sanity** — is connected but not currently enabled for this chat. Not
   required to launch Phase 1 — the static data files in `src/data/` work
   fine on their own; Sanity only matters once Racy wants to edit product
   info without asking Claude to edit code directly.

Paystack itself already exists (test keys are in hand); it just needs the
compliance review to clear before switching to live keys.

## Known open items before launch

- **Run a real test payment end-to-end once deployed** — this hasn't been
  live-tested (see Payments section above)
- Swap in live Paystack keys once compliance review clears
- Real logo (vector + raster) — currently a placeholder monogram
- Real product photography — currently a labeled placeholder card, not a
  stock photo, so nothing here misrepresents what the product looks like
- Pricing — checkout charges a flat ₦100 test placeholder until the Pricing
  Calculator (`05 Product Architecture/Pricing Calculator.xlsx`) has real
  numbers; the price display line still separately shows "Message us on
  WhatsApp for current pricing" since the real amount isn't known yet
- Founder story for the About page
- Preparation guide / nutrition info per product
- Social links and Google Business Profile URL (site simply omits these
  sections until provided)
- Cocoyam product naming — this build defaults to the registered NAFDAC
  name ("Rugofs Cocoyam Powder Soup Thickener") per the naming flag in the
  Website Copy doc; confirm before launch
- `whatsappNumber` format (`src/data/siteSettings.ts`) — send a real test
  message to the wa.me link before launch to confirm the deep link works
