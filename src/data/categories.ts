// Category content now lives in Sanity Studio (see src/data/products.ts
// for the full explanation of this pattern). Only "Flours" exists as a
// published category today — the founder's other stated future categories
// (Dehydrated Plants, Spices, Tea) can be added in Studio once their
// live/planned status is confirmed; this file has no hardcoded list
// anymore, so adding one in Sanity is enough to make it available here.
import { sanityClient } from "../lib/sanity";

export type Category = {
  name: string;
  slug: string;
  description?: string;
};

const CATEGORIES_QUERY = `*[_type == "category"] | order(name asc){
  name,
  "slug": slug.current,
  description
}`;

let rawCategories: any[] = [];
try {
  rawCategories = (await sanityClient.fetch(CATEGORIES_QUERY)) ?? [];
} catch (err) {
  console.error(
    "[sanity] Failed to fetch categories at build time — proceeding with an empty category list.",
    err,
  );
}

export const categories: Category[] = rawCategories.map((c) => ({
  name: c.name,
  slug: c.slug,
  description: c.description,
}));
