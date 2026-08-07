// Mirrors the `product` document type in the Sanity schema (Section 3 of the
// Website Build Spec). Content is pulled verbatim from
// 09 Marketing/Website Copy — Phase 1.md — nothing here invents pricing,
// prep instructions, nutrition facts, or founder history.
//
// Launch scope (decided 2026-08-04): only NAFDAC-approved pack sizes are
// marked nafdacApproved: true. Yam Poundo Flour is excluded entirely — no
// NAFDAC certificate is on file for it yet, so it isn't published even as
// "coming soon". Add it here, following the same pattern, once that's
// confirmed (see 02 Governance & Compliance).
//
// No real product photography exists yet — `images` stays empty and the
// frontend renders a clearly-labeled placeholder instead of a stock photo,
// so nothing here misrepresents what the product actually looks like.

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
  categorySlug: string;
  shortDescription: string;
  longDescription: string;
  activeIngredient: string;
  nafdacRegNo: string;
  images: string[];
  packSizes: PackSize[];
  isBestseller: boolean;
  status: "live" | "coming-soon";
  nutritionInfo: string | null; // OPEN — not yet provided by founder
  preparationGuide: string | null; // OPEN — not yet provided by founder
  sortOrder: number;
};

export const products: Product[] = [
  {
    name: "Rugofs Cocoyam Powder Soup Thickener",
    slug: "rugofs-cocoyam-powder-soup-thickener",
    categorySlug: "flours",
    shortDescription:
      "Our best-seller. Premium cocoyam powder soup thickener, made from real cocoyam tuber.",
    longDescription:
      "Rugofs Cocoyam Powder Soup Thickener is made from real cocoyam tuber, hygienically processed and packaged in a food-grade nylon pouch. NAFDAC-registered (A8-121931L) and a customer favorite — the product Rugofs is best known for.",
    activeIngredient: "Cocoyam Tuber",
    nafdacRegNo: "A8-121931L",
    images: [],
    packSizes: [
      {
        size: "200g",
        priceNGN: null,
        sku: null,
        inStock: true,
        nafdacApproved: true,
      },
    ],
    isBestseller: true,
    status: "live",
    nutritionInfo: null,
    preparationGuide: null,
    sortOrder: 1,
  },
  {
    name: "Rugofs Beans Flour",
    slug: "rugofs-beans-flour",
    categorySlug: "flours",
    shortDescription:
      "Premium beans flour, made from black eye beans and hygienically packaged for freshness.",
    longDescription:
      "Rugofs Beans Flour is processed from black eye beans and packaged in a food-grade nylon pouch to lock in freshness and quality. NAFDAC-registered (A8-121932L), it's built for households, hotels, and restaurants who won't compromise on standards.",
    activeIngredient: "Black Eye Beans",
    nafdacRegNo: "A8-121932L",
    images: [],
    packSizes: [
      {
        size: "500g",
        priceNGN: null,
        sku: null,
        inStock: true,
        nafdacApproved: true,
      },
    ],
    isBestseller: false,
    status: "live",
    nutritionInfo: null,
    preparationGuide: null,
    sortOrder: 2,
  },
];

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
