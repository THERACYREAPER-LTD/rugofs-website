// Central config + event-firing helpers for third-party analytics/ad
// pixels. Every ID here is PUBLIC_-prefixed on purpose — measurement IDs,
// pixel IDs, and partner IDs are meant to be embedded in page source (every
// competitor's site view-source shows theirs); they're identifiers, not
// secrets, unlike PAYSTACK_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.
//
// Each platform is entirely optional and independent — leaving an env var
// unset simply skips that platform's script (see Analytics.astro) and its
// track* calls below become no-ops. Nothing here needs a code change to
// turn a platform on later; just add the ID in Netlify and redeploy.

export const GA4_MEASUREMENT_ID = import.meta.env.PUBLIC_GA4_MEASUREMENT_ID ?? "";
export const GOOGLE_ADS_ID = import.meta.env.PUBLIC_GOOGLE_ADS_ID ?? "";
// Optional — only needed if you want a specific Google Ads conversion
// action (as opposed to just page-level remarketing). Format from Google
// Ads: "AW-XXXXXXXXX/AbC-D_efG-h1234567".
export const GOOGLE_ADS_PURCHASE_LABEL = import.meta.env.PUBLIC_GOOGLE_ADS_PURCHASE_LABEL ?? "";
export const META_PIXEL_ID = import.meta.env.PUBLIC_META_PIXEL_ID ?? "";
export const TIKTOK_PIXEL_ID = import.meta.env.PUBLIC_TIKTOK_PIXEL_ID ?? "";
export const PINTEREST_TAG_ID = import.meta.env.PUBLIC_PINTEREST_TAG_ID ?? "";
export const LINKEDIN_PARTNER_ID = import.meta.env.PUBLIC_LINKEDIN_PARTNER_ID ?? "";
export const GOOGLE_SITE_VERIFICATION = import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION ?? "";

// gtag.js is shared infrastructure for BOTH GA4 and Google Ads (Google Ads
// conversion tracking uses the same loader/global function, just a
// different config ID) — load it once if either is configured.
export const GOOGLE_TAG_ENABLED = Boolean(GA4_MEASUREMENT_ID || GOOGLE_ADS_ID);

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

// Every function below checks for its global before calling it — the same
// defensive pattern used for window.PaystackPop elsewhere in this project.
// A pixel failing to load (network hiccup, ad blocker) should never break
// the actual add-to-cart/checkout/purchase flow it's just observing.

export function trackAddToCart(event: CartEvent) {
  const w = window as any;
  if (typeof w.gtag === "function") {
    w.gtag("event", "add_to_cart", {
      currency: "NGN",
      value: event.valueNGN,
      items: [{ item_name: event.productName, quantity: event.quantity }],
    });
  }
  if (typeof w.fbq === "function") {
    w.fbq("track", "AddToCart", {
      content_name: event.productName,
      currency: "NGN",
      value: event.valueNGN,
    });
  }
  if (typeof w.ttq?.track === "function") {
    w.ttq.track("AddToCart", {
      content_name: event.productName,
      currency: "NGN",
      value: event.valueNGN,
    });
  }
  if (typeof w.pintrk === "function") {
    w.pintrk("track", "addtocart", { value: event.valueNGN, currency: "NGN" });
  }
}

export function trackInitiateCheckout(valueNGN: number, itemCount: number) {
  const w = window as any;
  if (typeof w.gtag === "function") {
    w.gtag("event", "begin_checkout", { currency: "NGN", value: valueNGN });
  }
  if (typeof w.fbq === "function") {
    w.fbq("track", "InitiateCheckout", {
      currency: "NGN",
      value: valueNGN,
      num_items: itemCount,
    });
  }
  if (typeof w.ttq?.track === "function") {
    w.ttq.track("InitiateCheckout", { currency: "NGN", value: valueNGN });
  }
  if (typeof w.pintrk === "function") {
    w.pintrk("track", "checkout", { value: valueNGN, currency: "NGN" });
  }
  if (typeof w.lintrk === "function") {
    w.lintrk("track", { conversion_id: LINKEDIN_PARTNER_ID });
  }
}

// The one that actually matters most for ad spend decisions — fire once,
// on the order-confirmed page, only after Paystack verification succeeds
// server-side (never on the client-only "payment popup closed" callback,
// which would count declined/abandoned attempts as conversions).
export function trackPurchase(event: PurchaseEvent) {
  const w = window as any;
  if (typeof w.gtag === "function") {
    if (GA4_MEASUREMENT_ID) {
      w.gtag("event", "purchase", {
        transaction_id: event.orderRef,
        currency: "NGN",
        value: event.valueNGN,
        items: event.items.map((item) => ({
          item_name: item.productName,
          item_variant: item.packSize,
          quantity: item.quantity,
          price: item.priceNGN,
        })),
      });
    }
    if (GOOGLE_ADS_ID && GOOGLE_ADS_PURCHASE_LABEL) {
      w.gtag("event", "conversion", {
        send_to: GOOGLE_ADS_PURCHASE_LABEL,
        transaction_id: event.orderRef,
        currency: "NGN",
        value: event.valueNGN,
      });
    }
  }
  if (typeof w.fbq === "function") {
    w.fbq("track", "Purchase", {
      currency: "NGN",
      value: event.valueNGN,
      content_type: "product",
      contents: event.items.map((item) => ({
        id: item.productName,
        quantity: item.quantity,
        item_price: item.priceNGN,
      })),
    });
  }
  if (typeof w.ttq?.track === "function") {
    w.ttq.track("CompletePayment", { currency: "NGN", value: event.valueNGN });
  }
  if (typeof w.pintrk === "function") {
    w.pintrk("track", "checkout", {
      value: event.valueNGN,
      currency: "NGN",
      order_id: event.orderRef,
    });
  }
}
