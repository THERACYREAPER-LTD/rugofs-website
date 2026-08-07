// Mirrors the `siteSettings` singleton document in the Sanity schema
// (11 Operations/Website Build Spec — Phase 1 Catalog.md, Section 3).
// When Sanity is connected, replace this static object with a GROQ fetch
// of the singleton — field names below match the schema 1:1 so the swap
// should not require touching the pages/components that import this.

export const siteSettings = {
  tagline:
    "Transforming Nigerian harvests into premium staples. Preserving Goodness, Elevating Taste.",
  brandPromise: "Wholesome Food. Stronger Families. Better Generations.",

  // Confirmed 2026-08-05. wa.me deep links need the international format
  // with no leading zero and no "+". Verify this format against WhatsApp's
  // current Click to Chat documentation before go-live.
  whatsappNumber: "2348181380026",
  whatsappNumberDisplay: "0818 138 0026",

  phone: "0818 138 0026",
  email: "rugofsfoods@gmail.com", // registered CAC email — confirm this is the right public-facing inbox before launch
  address: "NSPRI Building, Mile 4, Rumueme, Port Harcourt, Rivers State, Nigeria",

  // OPEN — not yet gathered. Leave empty until the founder shares real links;
  // an empty array means the site simply won't render a social row.
  socialLinks: [] as { platform: string; url: string }[],

  // OPEN — not yet gathered.
  googleBusinessProfileUrl: "",
};

export function whatsappLink(prefillText: string) {
  const encoded = encodeURIComponent(prefillText);
  return `https://wa.me/${siteSettings.whatsappNumber}?text=${encoded}`;
}
