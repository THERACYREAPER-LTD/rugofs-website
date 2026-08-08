// Client-side cart state. This module is only ever imported inside <script>
// blocks (browser context) — it uses localStorage, which doesn't exist
// server-side, so it must never be imported from Astro frontmatter (SSR).
//
// Cart contents live in the browser only, per device. There is no
// server-side "cart" concept — the cart is only turned into a real Order
// at the moment of checkout (see cart.astro), when its contents are sent to
// Paystack as transaction metadata and, on successful payment, written to
// Supabase from order-confirmed.astro (server-side, using the verified
// Paystack response — never trusting the client's cart directly for the
// charge amount).

export type CartItem = {
  productSlug: string;
  productName: string;
  packSize: string;
  sku: string | null;
  priceNGN: number;
  image: string | null;
  quantity: number;
};

const CART_STORAGE_KEY = "rugofs_cart_v1";
const CART_UPDATED_EVENT = "rugofs:cart-updated";

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupted or blocked storage — fail safe to an empty cart rather than
    // throwing and breaking the page.
    return [];
  }
}

function writeCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { cart } }));
}

// A cart line is uniquely identified by product + pack size (SKU when
// present, size string as a fallback for pack sizes without one yet).
function lineKey(productSlug: string, packSize: string, sku: string | null) {
  return `${productSlug}::${sku ?? packSize}`;
}

export function getCart(): CartItem[] {
  return readCart();
}

export function cartCount(cart: CartItem[] = readCart()): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotalNGN(cart: CartItem[] = readCart()): number {
  return cart.reduce((sum, item) => sum + item.priceNGN * item.quantity, 0);
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const cart = readCart();
  const key = lineKey(item.productSlug, item.packSize, item.sku);
  const existing = cart.find((c) => lineKey(c.productSlug, c.packSize, c.sku) === key);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }
  writeCart(cart);
  return cart;
}

export function updateQuantity(productSlug: string, packSize: string, sku: string | null, quantity: number) {
  let cart = readCart();
  const key = lineKey(productSlug, packSize, sku);
  if (quantity <= 0) {
    cart = cart.filter((c) => lineKey(c.productSlug, c.packSize, c.sku) !== key);
  } else {
    const existing = cart.find((c) => lineKey(c.productSlug, c.packSize, c.sku) === key);
    if (existing) existing.quantity = quantity;
  }
  writeCart(cart);
  return cart;
}

export function removeFromCart(productSlug: string, packSize: string, sku: string | null) {
  return updateQuantity(productSlug, packSize, sku, 0);
}

export function clearCart() {
  writeCart([]);
}

export const CART_EVENT_NAME = CART_UPDATED_EVENT;
