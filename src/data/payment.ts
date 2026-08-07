// Paystack configuration.
//
// SECURITY: only the PUBLIC key belongs here / in any client-side code.
// It's exposed to the browser by design (Paystack's own model — the public
// key just opens the payment popup, it can't move money on its own).
//
// The SECRET key must never appear in this file, anywhere under src/, or in
// any file committed to git. It's read server-side only, from the
// PAYSTACK_SECRET_KEY environment variable, inside
// src/pages/api/verify-payment.ts (a server-rendered route, prerender =
// false) — never sent to the browser. Set it in Netlify's dashboard under
// Site settings → Environment variables, and in a local, gitignored .env
// file for local testing. See README.md.
//
// Currently wired to TEST mode keys — Racy's account is still under
// Paystack compliance review. Swapping to live keys later is an environment
// variable change only; no code here needs to change.

export const PAYSTACK_PUBLIC_KEY = import.meta.env.PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";

// TEST-ONLY placeholder amount. Real per-product pricing isn't set yet (the
// Pricing Calculator is still waiting on real cost inputs — see
// 05 Product Architecture/Product Architecture.md). This flat ₦100 charge
// exists purely to prove the checkout → payment → verification flow works
// end-to-end before real prices exist. Replace with each product's real
// priceNGN (src/data/products.ts) once pricing is finalized — the checkout
// code already prefers a product's real price over this fallback when one
// is set, so removing this constant's use is a one-line change, not a
// rebuild.
export const TEST_CHECKOUT_AMOUNT_NGN = 100;
export const IS_TEST_PRICING = true;
