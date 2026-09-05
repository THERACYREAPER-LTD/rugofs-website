// Server-only Topship client. Must NEVER be imported from a client-side
// <script> block — TOPSHIP_API_KEY is a Bearer token that can book
// shipments and spend from the Topship wallet, unlike Paystack's public
// key. Same "server-only secret" pattern as PAYSTACK_SECRET_KEY and
// SUPABASE_SERVICE_ROLE_KEY.
//
// Originally built from Topship's "Open Server Docs" PDF (Aug 2026) before
// any API key existed to test against. That transcription had real bugs —
// get-shipment-rate's method/payload shape and the item category enum were
// both wrong, only caught once a real STAGING key arrived and every call
// 404'd. Re-verified 2026-09-05 against Topship's actual hosted docs
// (https://topship-staging.africa/shipping/docs#/), which is the
// authoritative reference now, not the original PDF. Still only exercised
// against STAGING (set TOPSHIP_BASE_URL to the live URL below only once
// save-shipment has been proven end-to-end on staging).
//
// Docs note a few easy-to-miss gotchas, preserved here rather than in a
// comment far from where they matter:
// - All charge fields are in KOBO, not Naira — multiply Naira amounts by 100.
// - shipmentCharge passed to /save-shipment must be the exact value that
//   came back from /get-shipment-rate for that quote — not re-derived.
// - valueAddedTaxCharge must always equal exactly 7.5% of totalCharge.
// - Shipments are paid from a pre-funded Topship wallet via
//   /pay-from-wallet, not a per-shipment card charge — the wallet balance
//   needs to stay topped up on the Topship side; that's an operational
//   concern outside this code.

const LIVE_BASE_URL = "https://api-topship.com/api";
const STAGING_BASE_URL = "https://topship-staging.africa/api";

const TOPSHIP_API_KEY = import.meta.env.TOPSHIP_API_KEY ?? "";
// Defaults to staging on purpose — only points at LIVE once explicitly set,
// so a forgotten env var can't accidentally book/pay for real shipments.
const TOPSHIP_BASE_URL = import.meta.env.TOPSHIP_BASE_URL || STAGING_BASE_URL;

export function isTopshipConfigured() {
  return Boolean(TOPSHIP_API_KEY);
}

// Pack sizes are stored as simple strings like "500g" / "200g" (see
// src/data/products.ts) — there's no separate structured weight field on
// the product model yet, so this parses the one that exists rather than
// requiring a schema change just for shipping. Shared between the
// delivery-quote endpoint (weighing the whole cart for /get-shipment-rate)
// and order-confirmed.astro (per-item weight for /save-shipment) so both
// use the exact same parsing — a mismatch between the two could mean the
// weight actually booked doesn't match the weight that was quoted.
export function parsePackSizeToKg(packSize: string): number | null {
  const match = packSize.trim().match(/^([\d.]+)\s*(kg|g)$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) return null;
  return match[2].toLowerCase() === "kg" ? value : value / 1000;
}

// Confirmed 2026-09-05 against Topship's real hosted docs
// (https://topship-staging.africa/shipping/docs#/) — neither "Food" nor
// "Agro-processing" (both earlier guesses) are in the real enum. Closest
// fit for packaged flour products is "FoodstuffAndFoodProducts"; "FoodItems"
// is the other plausible option if that one ever gets rejected.
export const TOPSHIP_ITEM_CATEGORY = import.meta.env.TOPSHIP_ITEM_CATEGORY || "FoodstuffAndFoodProducts";

// Rugofs' own pickup location — every quote/shipment's senderDetail. Kept
// here rather than re-reading siteSettings per call, since this is Topship-
// specific shaping (full address split into Topship's field names) rather
// than the general site address.
export const RUGOFS_SENDER = {
  name: "Rugofs Foods",
  email: "rugofsfoods@gmail.com",
  phoneNumber: "2348181380026",
  addressLine1: "NSPRI Building, Mile 4",
  addressLine2: "Rumueme",
  addressLine3: "",
  country: "Nigeria",
  countryCode: "NG",
  state: "Rivers",
  city: "Port Harcourt",
  postalCode: "",
};

async function topshipFetch(path: string, options: { method?: string; body?: unknown } = {}) {
  if (!TOPSHIP_API_KEY) {
    throw new Error("Topship is not configured (TOPSHIP_API_KEY missing)");
  }
  const res = await fetch(`${TOPSHIP_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${TOPSHIP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Topship ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  }
  return json;
}

export type TopshipRate = {
  mode: string;
  cost: number; // Always normalized to Naira by getShipmentRate below, regardless of what the API actually returned it in.
  duration: string;
  currency: string;
  pricingTier: "Budget" | "Express" | string;
};

// Confirmed 2026-09-05 against Topship's real hosted docs
// (https://topship-staging.africa/shipping/docs#/) — this endpoint is GET
// with the payload as a JSON-stringified query parameter, not a POST with
// a JSON body as originally guessed from the PDF. The PDF's guessed POST
// shape was the actual cause of every prior "quote-failed" response —
// confirmed via direct curl testing, which reproduced NestJS's literal
// "Cannot POST /api/get-shipment-rate" for the same reason.
export async function getShipmentRate(params: {
  destinationCity: string;
  destinationCountryCode: string;
  totalWeightKg: number;
}): Promise<TopshipRate[]> {
  const query = new URLSearchParams({
    shipmentDetail: JSON.stringify({
      senderDetails: { cityName: RUGOFS_SENDER.city, countryCode: RUGOFS_SENDER.countryCode },
      receiverDetails: { cityName: params.destinationCity, countryCode: params.destinationCountryCode },
      totalWeight: params.totalWeightKg,
    }),
  });
  const json = await topshipFetch(`/get-shipment-rate?${query.toString()}`);
  const rates = Array.isArray(json) ? json : [];
  // Confirmed live 2026-09-05: real responses come back with cost in KOBO
  // (currency: "KOBO" on the actual object), not Naira as the docs' vague
  // `"currency": "string"` schema and the original code both assumed. A
  // Lagos->Abuja test quote returned {"cost":1528002,"currency":"KOBO"} —
  // i.e. ₦15,280.02, not ₦1,528,002. Normalizing here, at the one place
  // the value enters the system, means every downstream consumer
  // (delivery-quote.ts's feeNGN, bookAndPayShipment's *100 kobo
  // conversion, cart display) can keep treating TopshipRate.cost as Naira
  // with no other code changes.
  return rates.map((rate: TopshipRate) =>
    rate.currency === "KOBO" ? { ...rate, cost: rate.cost / 100, currency: "NGN" } : rate,
  );
}

// Budget over Express by default — no tier-selection UI exists in checkout
// yet, so this picks the cheapest option deterministically. Revisit if a
// tier selector ever gets added to the cart page.
export function pickCheapestRate(rates: TopshipRate[]): TopshipRate | null {
  if (rates.length === 0) return null;
  return rates.reduce((cheapest, rate) => (rate.cost < cheapest.cost ? rate : cheapest));
}

export type TopshipReceiver = {
  name: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  country: string;
  countryCode: string;
  state: string;
  city: string;
  postalCode?: string;
};

export type TopshipShipmentItem = {
  category: string;
  description: string;
  weight: number;
  quantity: number;
  value: number; // Naira value of the item, for insurance/customs purposes — not a charge
};

// Books the shipment as a draft, then immediately pays it from the wallet —
// combined into one call since this integration only ever wants a paid,
// confirmed shipment (there's no scenario here where a draft should sit
// unpaid). shipmentChargeNGN MUST be the exact `cost` from the
// TopshipRate used to quote the customer at checkout — see module comment.
export async function bookAndPayShipment(params: {
  receiver: TopshipReceiver;
  items: TopshipShipmentItem[];
  rate: TopshipRate;
}): Promise<{ shipmentId: string; trackingId: string; trackingUrl: string }> {
  const shipmentChargeKobo = Math.round(params.rate.cost * 100);
  const totalChargeKobo = shipmentChargeKobo; // no pickup/insurance charge added in this integration yet
  const vatKobo = Math.round(totalChargeKobo * 0.075);

  const draft = await topshipFetch("/save-shipment", {
    method: "POST",
    body: {
      shipment: [
        {
          items: params.items,
          itemCollectionMode: "DropOff",
          pricingTier: params.rate.pricingTier,
          insuranceType: "None",
          insuranceCharge: 0,
          discount: 0,
          // Rugofs ships Port Harcourt -> other Nigerian cities only, never
          // out of the country — "Domestic" per Topship's real docs enum
          // (Import || Export || Domestic). Was wrongly hardcoded to
          // "Export" until corrected 2026-09-05; never actually exercised
          // against a live account before now, so this was untested.
          shipmentRoute: "Domestic",
          shipmentCharge: shipmentChargeKobo,
          pickupCharge: 0,
          valueAddedTaxCharge: vatKobo,
          senderDetail: RUGOFS_SENDER,
          receiverDetail: params.receiver,
        },
      ],
    },
  });

  const shipmentId: string = draft?.id;
  if (!shipmentId) {
    throw new Error(`Topship /save-shipment did not return an id: ${JSON.stringify(draft)}`);
  }

  const paid = await topshipFetch("/pay-from-wallet", {
    method: "POST",
    body: { detail: { shipmentId } },
  });

  return {
    shipmentId,
    trackingId: paid?.trackingId ?? "",
    trackingUrl: paid?.trackingUrl ?? "",
  };
}

export async function trackShipment(trackingId: string) {
  return topshipFetch(`/track-shipment?trackingId=${encodeURIComponent(trackingId)}`);
}
