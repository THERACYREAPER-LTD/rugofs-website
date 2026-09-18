// Best-effort duplicate order record in a Google Sheet, deliberately
// independent of Supabase. Exists because Supabase's free tier has now
// silently auto-paused twice (2026-09-05, 2026-09-14) -- each time meaning
// a real paid order's ONLY record would have failed to write, with no
// second system to catch it. A Sheet doesn't auto-pause.
//
// Talks to a Google Apps Script Web App bound to the target Sheet, not
// Google's own Sheets API -- no service account, no OAuth token handling
// on this side. The script owns a shared secret checked on every request;
// GOOGLE_SHEETS_WEBHOOK_URL is not a secret on its own (Apps Script Web
// App URLs are guessable-adjacent), the secret is what actually gates it.
//
// Never throws into the caller. A failure here is logged and swallowed --
// same philosophy as the Supabase write it duplicates: the order (payment
// received) matters more than any one record of it succeeding on the
// first try.
const WEBHOOK_URL = import.meta.env.GOOGLE_SHEETS_WEBHOOK_URL ?? "";
const WEBHOOK_SECRET = import.meta.env.GOOGLE_SHEETS_WEBHOOK_SECRET ?? "";

export function isSheetsLoggingConfigured() {
  return Boolean(WEBHOOK_URL && WEBHOOK_SECRET);
}

export type SheetOrderRecord = {
  order_ref: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: string;
  delivery_address: string | null;
  delivery_zone: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_fee_ngn: number;
  subtotal_ngn: number;
  total_ngn: number;
  items_summary: string;
  paystack_paid_at: string | null;
  topship_tracking_id: string | null;
  topship_tracking_url: string | null;
};

export async function logOrderToSheet(order: SheetOrderRecord): Promise<void> {
  if (!isSheetsLoggingConfigured()) return;
  try {
    // redirect: "manual" is deliberate. Apps Script Web Apps respond to a
    // successful doPost with a 302 to a script.googleusercontent.com
    // content-echo URL -- that's just where the response BODY lives, not
    // a sign anything failed. doPost has already run and appended the row
    // by the time that 302 comes back. If fetch is left to auto-follow it
    // (the default), the redirect gets converted to a bodyless GET per
    // the fetch spec (any 301/302/303 redirect of a non-GET method
    // becomes GET) -- and since this script only defines doPost, not
    // doGet, that follow-up request fails with "Script function not
    // found: doGet". Confirmed directly 2026-09-18: curl reproduced
    // exactly that error by following the redirect, on a request that
    // had already appended the row correctly. Manual mode means the
    // initial 200/302 IS the real result; the redirect is simply never
    // chased.
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, secret: WEBHOOK_SECRET }),
      redirect: "manual",
    });
    // status 0 shows up for an opaque redirect in some fetch
    // implementations -- still a success signal here, not a failure.
    if (res.status >= 400) {
      console.error(`[sheets] Order log webhook responded ${res.status}`);
    }
  } catch (err) {
    console.error("[sheets] Failed to log order to sheet:", err instanceof Error ? err.message : err);
  }
}
