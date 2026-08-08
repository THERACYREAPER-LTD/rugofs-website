// Product content now lives in Sanity Studio: https://rugofs-foods.sanity.studio/
// (log in with the same account this project's Sanity org was created
// under). This file fetches it ONCE at build time via a top-level await,
// then exposes the exact same shape every page/component already imports
// (products, getLiveProducts, getBestseller, getProductBySlug) — so no
// page or component needed to change when this swapped from hardcoded
// data to a live CMS fetch. This is the swap the original comment here
// predicted: "When Sanity is connected, replace this static object with a
// GROQ fetch of the singleton."
//
// To change a product's name, description, price, or live/coming-soon
// status: edit it in Sanity Studio and publish — the next Netlify build
// picks it up. Don't edit product data in this file anymore.
import { sanityClient, urlFor } from "../lib/sanity";

export type PackSize = {
  size: string;
  priceNGN: number | null;
  sku: string | null;
  inStock: boolean;
  nafdacApproved: boolean;
};

export type Product = {
  name: string;
  slug: string;
  categorySlug: string | null;
  shortDescription: string;
  longDescription: string;
  activeIngredient: string;
  nafdacRegNo: string;
  images: string[];
  packSizes: PackSize[];
  isBestseller: boolean;
  status: "live" | "coming-soon";
  nutritionInfo: string | null;
  preparationGuide: string | null;
  sortOrder: number;
  // Minimum units of this product that must be ordered before a production
  // batch is triggered. Orders pool continuously in an "open" batch until
  // this is reached (see src/pages/api/batch-status.ts and
  // order-confirmed.astro); once hit, that batch moves to production and a
  // new pool opens automatically. null means batching isn't configured for
  // this product yet — treat it as unbatched/direct fulfillment.
  batchTargetQty: number | null;
};

// Local fallback photos — used only for products that don't have images
// uploaded into Sanity yet (Sanity's "images" field on each product
// document, currently empty for both launch products since photos were
// migrated in before Sanity was connected). Once a product has images in
// Sanity, those take over automatically — this fallback stops mattering
// for that product without needing a code change.
const FALLBACK_IMAGES: Record<string, string[]> = {
  "rugofs-cocoyam-powder-soup-thickener": [
    "/images/products/cocoyam-flour-front.webp",
    "/images/products/cocoyam-flour-back.webp",
  ],
  "rugofs-beans-flour": [
    "/images/products/beans-flour-front.webp",
    "/images/products/beans-flour-back.webp",
  ],
};

const PRODUCTS_QUERY = `*[_type == "product"] | order(sortOrder asc){
  _id,
  name,
  "slug": slug.current,
  "categorySlug": category->slug.current,
  shortDescription,
  "longDescription": pt::text(longDescription),
  activeIngredient,
  nafdacRegNo,
  images,
  packSizes,
  isBestseller,
  status,
  "nutritionInfo": pt::text(nutritionInfo),
  "preparationGuide": pt::text(preparationGuide),
  sortOrder,
  batchTargetQty
}`;

let rawProducts: any[] = [];
try {
  rawProducts = (await sanityClient.fetch(PRODUCTS_QUERY)) ?? [];
} catch (err) {
  // A build-time Sanity outage shouldn't silently ship an empty shop page
  // without a trace — log loudly. The build still completes (with no
  // products) rather than failing outright, since a failed build means
  // Netlify keeps serving the last good deploy, which is usually the safer
  // outcome than blocking a deploy over a transient CMS hiccup.
  console.error(
    "[sanity] Failed to fetch products at build time — the build will proceed with an empty product list. Check PUBLIC_SANITY_PROJECT_ID / PUBLIC_SANITY_DATASET and https://rugofs-foods.sanity.studio/ status.",
    err,
  );
}

export const products: Product[] = rawProducts.map((p) => ({
  name: p.name,
  slug: p.slug,
  categorySlug: p.categorySlug ?? null,
  shortDescription: p.shortDescription ?? "",
  longDescription: p.longDescription ?? "",
  activeIngredient: p.activeIngredient ?? "",
  nafdacRegNo: p.nafdacRegNo ?? "",
  images:
    Array.isArray(p.images) && p.images.length > 0
      ? p.images.map((img: any) => urlFor(img).width(1200).fit("max").url())
      : (FALLBACK_IMAGES[p.slug] ?? []),
  packSizes: (p.packSizes ?? []).map((s: any) => ({
    size: s.size,
    priceNGN: s.priceNGN ?? null,
    sku: s.sku ?? null,
    inStock: s.inStock ?? true,
    nafdacApproved: s.nafdacApproved ?? false,
  })),
  isBestseller: !!p.isBestseller,
  status: p.status === "live" ? "live" : "coming-soon",
  nutritionInfo: p.nutritionInfo || null,
  preparationGuide: p.preparationGuide || null,
  sortOrder: p.sortOrder ?? 0,
  batchTargetQty: typeof p.batchTargetQty === "number" ? p.batchTargetQty : null,
}));

export function getLiveProducts() {
  return products
    .filter((p) => p.status === "live")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getBestseller() {
  return products.find((p) => p.isBestseller);
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}
