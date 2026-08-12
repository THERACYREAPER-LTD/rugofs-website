// Site settings now live in Sanity Studio as the `siteSettings` singleton
// document (see src/data/products.ts for the full explanation of this
// pattern). This is contact info / WhatsApp number / tagline used across
// nearly every page, so unlike products.ts this file keeps a hardcoded
// FALLBACK — if a build-time Sanity fetch ever fails, the site should still
// show correct contact details rather than blank fields everywhere.
import { sanityClient } from "../lib/sanity";

const SETTINGS_QUERY = `*[_type == "siteSettings"][0]{
  tagline,
  brandPromise,
  whatsappNumber,
  phone,
  email,
  address,
  socialLinks,
  googleBusinessProfileUrl,
  "deliveryZones": deliveryZones | order(sortOrder asc)
}`;

export type DeliveryZone = {
  name: string;
  areasDescription: string;
  feeNGN: number;
  isContactOnly: boolean;
  sortOrder: number;
};

type SiteSettings = {
  tagline: string;
  brandPromise: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  address: string;
  socialLinks: { platform: string; url: string }[];
  googleBusinessProfileUrl: string;
  deliveryZones: DeliveryZone[];
};

// Last-known-good values as of the 2026-08-07 Sanity migration — kept as a
// fallback only, not the source of truth. Edit these in Sanity Studio, not
// here; this copy exists purely so a transient CMS outage at build time
// doesn't blank out contact info sitewide.
const FALLBACK: SiteSettings = {
  tagline:
    "Transforming Nigerian harvests into premium staples. Preserving Goodness, Elevating Taste.",
  brandPromise: "Wholesome Food. Stronger Families. Better Generations.",
  whatsappNumber: "2348181380026",
  phone: "0818 138 0026",
  email: "rugofsfoods@gmail.com",
  address: "NSPRI Building, Mile 4, Rumueme, Port Harcourt, Rivers State, Nigeria",
  socialLinks: [],
  googleBusinessProfileUrl: "",
  deliveryZones: [
    { name: "Zone A — Core PH", areasDescription: "D-Line, GRA, Mile 1–3, Diobu", feeNGN: 2000, isContactOnly: false, sortOrder: 1 },
    { name: "Zone B — Near PH", areasDescription: "Rumuola, Rumuomasi, Rumuokwuta, Woji", feeNGN: 2500, isContactOnly: false, sortOrder: 2 },
    { name: "Zone C — Outer PH", areasDescription: "Rukpokwu, Eliozu, Airport axis", feeNGN: 3000, isContactOnly: false, sortOrder: 3 },
    { name: "Zone D — Extended", areasDescription: "Other areas requiring a special quotation", feeNGN: 0, isContactOnly: true, sortOrder: 4 },
  ],
};

let siteSettingsResolved: SiteSettings = FALLBACK;
try {
  const result = await sanityClient.fetch(SETTINGS_QUERY);
  if (result) {
    siteSettingsResolved = {
      tagline: result.tagline || FALLBACK.tagline,
      brandPromise: result.brandPromise || FALLBACK.brandPromise,
      whatsappNumber: result.whatsappNumber || FALLBACK.whatsappNumber,
      phone: result.phone || FALLBACK.phone,
      email: result.email || FALLBACK.email,
      address: result.address || FALLBACK.address,
      socialLinks: result.socialLinks || FALLBACK.socialLinks,
      googleBusinessProfileUrl:
        result.googleBusinessProfileUrl || FALLBACK.googleBusinessProfileUrl,
      deliveryZones:
        Array.isArray(result.deliveryZones) && result.deliveryZones.length > 0
          ? result.deliveryZones
          : FALLBACK.deliveryZones,
    };
  }
} catch (err) {
  console.error(
    "[sanity] Failed to fetch site settings at build time — falling back to the last-known-good values baked into this file.",
    err,
  );
}

export const siteSettings = siteSettingsResolved;

export function whatsappLink(prefillText: string) {
  const encoded = encodeURIComponent(prefillText);
  return `https://wa.me/${siteSettings.whatsappNumber}?text=${encoded}`;
}
