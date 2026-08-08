// Public, read-only endpoint: given a product slug, returns the current
// "collecting" batch's progress so cart.astro and the product detail page
// can show a live "X of Y ordered — help trigger this batch" indicator
// without exposing the Supabase service role key to the browser.
//
// Must run server-side (this is where the service role key is used) — the
// `batches` table has RLS enabled with no policies, same as `orders`, so
// only this server-side code can read it.
export const prerender = false;

import type { APIRoute } from "astro";
import { getSupabaseServerClient } from "../../lib/supabaseServer";

export const GET: APIRoute = async ({ url }) => {
  const slug = (url.searchParams.get("slug") ?? "").trim();

  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return new Response(JSON.stringify({ error: "not-configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Most recent "collecting" batch for this product. There should only
  // ever be one open batch per product at a time (assign_order_to_batch
  // enforces this), but order by created_at desc defensively in case more
  // than one somehow exists.
  const { data, error } = await supabase
    .from("batches")
    .select("collected_quantity, target_quantity, status")
    .eq("product_slug", slug)
    .eq("status", "collecting")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[batch-status] Supabase lookup failed:", error.message);
    return new Response(JSON.stringify({ error: "lookup-failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // No batch has opened yet for this product (no orders placed since the
  // last one triggered, or ever). Not an error — the client already knows
  // the target from the product data; it just shows 0 collected so far.
  if (!data) {
    return new Response(JSON.stringify({ collectedQuantity: 0, targetQuantity: null, status: "collecting" }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  return new Response(
    JSON.stringify({
      collectedQuantity: data.collected_quantity,
      targetQuantity: data.target_quantity,
      status: data.status,
    }),
    { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
  );
};
