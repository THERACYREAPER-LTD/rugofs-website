// Mirrors the `category` document type in the Sanity schema.
// Only "Flours" is populated with live products today — the others are
// listed in the founder's stated future product categories (see
// 05 Product Architecture/Product Architecture.md) but their live/planned
// status hasn't been confirmed, so they're not wired into the product grid yet.

export type Category = {
  name: string;
  slug: string;
  description?: string;
};

export const categories: Category[] = [
  {
    name: "Flours",
    slug: "flours",
    description: "Hygienically processed staple flours from Nigerian harvests.",
  },
  // Future, unconfirmed-status categories (do not wire into live nav until
  // confirmed): Dehydrated Plants, Spices, Tea.
];
