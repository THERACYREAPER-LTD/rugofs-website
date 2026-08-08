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
