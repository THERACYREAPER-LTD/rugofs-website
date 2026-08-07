// Sanity client — single source of truth for how this site talks to the
// CMS. Project/dataset were provisioned 2026-08-07 per
// `11 Operations/Website Build Spec — Phase 1 Catalog.md`, Section 1 & 7.
//
// projectId/dataset are not secrets (they're visible in every browser
// network request Sanity's own Studio makes), so a hardcoded fallback here
// is safe — but the real values should also be set as PUBLIC_SANITY_*
// env vars in Netlify so this file never has to be edited to point at a
// different project/dataset later.
import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const sanityClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || "57yv9ur6",
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2026-08-07",
  useCdn: false, // this project's dataset is public-read; useCdn:false just
  // means build-time fetches always get the latest published content
  // instead of a cached edge copy, which matters right after Racy publishes
  // an edit and triggers a rebuild.
});

const builder = imageUrlBuilder(sanityClient);

/** Build a Sanity CDN image URL from a Sanity image asset reference. */
export function urlFor(source: any) {
  return builder.image(source);
}
