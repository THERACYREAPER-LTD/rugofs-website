// Server-only Supabase client. This must NEVER be imported from a
// client-side <script> block — it uses the service role key, which bypasses
// Row Level Security entirely. It exists only to be used inside Astro
// frontmatter on server-rendered pages (prerender = false), the same
// pattern already used for the Paystack secret key in order-confirmed.astro.
//
// The `orders` table has RLS enabled with no policies, so the anon/
// publishable key can't read or write it at all — only this service-role
// client can. That's intentional: order lookups are done server-side (see
// src/pages/order-status.astro), matched against both the order reference
// AND the customer's phone number, so a customer can only ever see their
// own order, without needing an account or login.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function getSupabaseServerClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// Snapshot of a product's batch state at the moment an order was assigned
// to it (see assign_order_to_batch in the batches table's migration). This
// is stored on the order item so a customer's confirmation/status page can
// show "you're in the batch that's X of Y ordered" without a live join —
// it will go stale as more orders land in the same batch after this one,
// which is fine: it's a snapshot of progress at order time, not a live
// counter (order-status.astro and cart.astro fetch the live count
// separately via /api/batch-status for that).
export type BatchInfo = {
  batchId: string;
  status: "collecting" | "in_production" | "fulfilled" | "cancelled";
  collectedQuantity: number;
  targetQuantity: number;
};

export type OrderItem = {
  productSlug: string;
  productName: string;
  packSize: string;
  sku: string | null;
  priceNGN: number;
  quantity: number;
  batch?: BatchInfo | null;
};

export type OrderRecord = {
  order_ref: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_method: "pickup" | "delivery";
  delivery_address: string | null;
  items: OrderItem[];
  subtotal_ngn: number;
  status: string;
  paystack_paid_at: string | null;
  created_at: string;
};
