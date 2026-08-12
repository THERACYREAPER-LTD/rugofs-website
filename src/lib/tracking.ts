// Google Tag Manager integration. GTM itself is the only thing wired into
// the site's code — GA4, Google Ads, Meta Pixel, TikTok, Pinterest,
// LinkedIn etc. all then get configured as tags *inside* the GTM
// container (tagmanager.google.com), triggered off the dataLayer events
// pushed below. That's the point of GTM: adding, removing, or reconfiguring
// a marketing tag becomes a GTM change, not a code change/redeploy here.
//
// PUBLIC_-prefixed since a GTM container ID is meant to be visible in page
// source (every site using GTM has it in view-source) — it's an
// identifier, not a secret, unlike PAYSTACK_SECRET_KEY or
// SUPABASE_SERVICE_ROLE_KEY.

export const GTM_CONTAINER_ID = import.meta.env.PUBLIC_GTM_CONTAINER_ID ?? "";
export const GOOGLE_SITE_VERIFICATION = import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION ?? "";

export type PurchaseEvent = {
  orderRef: string;
  valueNGN: number;
  items: { productName: string; packSize: string; quantity: number; priceNGN: number }[];
};

export type CartEvent = {
  productName: string;
  valueNGN: number;
  quantity: number;
};

function pushToDataLayer(payload: Record<string, unknown>) {
  const w = window as any;
  // GTM initializes window.dataLayer itself (see Analytics.astro) — this
  // fallback only matters if a track* call somehow runs before that base
  // snippet has executed, so an event is never silently dropped.
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(payload);
}

// Event names/shapes below follow GA4's standard ecommerce schema
// (add_to_cart, begin_checkout, purchase) since that's what most GTM
// templates — GA4, Google Ads, Meta's GTM tag — expect out of the box,
// minimizing the trigger/variable setup needed inside GTM itself.

export function trackAddToCart(event: CartEvent) {
  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency: "NGN",
      value: event.valueNGN,
      items: [{ item_name: event.productName, quantity: event.quantity }],
    },
  });
}

export function trackInitiateCheckout(valueNGN: number, itemCount: number) {
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: { currency: "NGN", value: valueNGN, item_count: itemCount },
  });
}

// The one that actually matters most for ad spend decisions — fire once,
// on the order-confirmed page, only after Paystack verification succeeds
// server-side (never on the client-only "payment popup closed" callback,
// which would count declined/abandoned attempts as conversions).
export function trackPurchase(event: PurchaseEvent) {
  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: event.orderRef,
      currency: "NGN",
      value: event.valueNGN,
      items: event.items.map((item) => ({
        item_name: item.productName,
        item_variant: item.packSize,
        quantity: item.quantity,
        price: item.priceNGN,
      })),
    },
  });
}
