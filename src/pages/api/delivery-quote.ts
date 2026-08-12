// Live delivery quote for the cart page — called client-side when the
// customer picks "Delivery" and enters a city, so the fee can be shown
// and folded into the same Paystack charge as the product subtotal
// (rather than confirmed separately after the fact on WhatsApp, the old
// behavior — still the fallback when Topship isn't configured).
//
// Must run server-side: TOPSHIP_API_KEY is a Bearer token, never sent to
// the browser, same reasoning as PAYSTACK_SECRET_KEY.
export const prerender = false;

import type { APIRoute } from "astro";
import { isTopshipConfigured, getShipmentRate, pickCheapestRate, parsePackSizeToKg } from "../../lib/topship";

type QuoteRequestItem = { packSize: string; quantity: number };

export const POST: APIRoute = async ({ request }) => {
  if (!isTopshipConfigured()) {
    return new Response(JSON.stringify({ available: false, reason: "not-configured" }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  let body: { city?: string; countryCode?: string; items?: QuoteRequestItem[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ available: false, reason: "invalid-request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const city = (body.city ?? "").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!city || items.length === 0) {
    return new Response(JSON.stringify({ available: false, reason: "missing-city-or-items" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let totalWeightKg = 0;
  for (const item of items) {
    const kg = parsePackSizeToKg(item.packSize);
    if (kg === null) {
      // One unparseable pack size makes the whole quote unreliable rather
      // than silently under-weighting the shipment — safer to fall back to
      // "message us" than to under-quote and eat the difference later.
      return new Response(JSON.stringify({ available: false, reason: "unweighable-item" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }
    totalWeightKg += kg * Math.max(1, item.quantity);
  }

  try {
    const rates = await getShipmentRate({
      destinationCity: city,
      destinationCountryCode: "NG",
      totalWeightKg,
    });
    const best = pickCheapestRate(rates);
    if (!best) {
      return new Response(JSON.stringify({ available: false, reason: "no-rates" }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }
    return new Response(
      JSON.stringify({
        available: true,
        feeNGN: best.cost,
        mode: best.mode,
        duration: best.duration,
        pricingTier: best.pricingTier,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[topship] Failed to fetch delivery rate:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ available: false, reason: "quote-failed" }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
};
