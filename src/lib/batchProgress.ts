// Shared batch-progress messaging logic — used both client-side (product
// page, cart) and server-side (order confirmation, order status) so the
// same reveal thresholds and copy stay in sync everywhere a customer might
// see batch progress. Pure functions, no DOM/Node-specific APIs, so it's
// safe to import from a client <script> block or from Astro frontmatter.
//
// The core problem this solves: a raw "X of 1,000 ordered" is discouraging
// whenever X is small relative to the target — not just at exactly zero.
// "1 of 1,000" reads just as badly as "0 of 1,000" to someone deciding
// whether to buy, or to a customer who just paid and is now looking at how
// far their order is from being fulfilled. So instead of a single
// zero/nonzero check, progress is split into bands, and only the "building"
// and "almost-there" bands show the raw count — "early" always stays
// qualitative, regardless of whether the true count is 0, 1, or 40.

export type BatchTier = "early" | "building" | "almost-there" | "triggered";

// Tune these two if the messaging feels off in practice — there's nothing
// scientifically precise about 15%/70%, they're a reasonable starting split
// between "don't show a discouraging small number" and "the momentum is
// real, show it."
const BUILDING_THRESHOLD = 0.15;
const ALMOST_THERE_THRESHOLD = 0.7;

export function getBatchTier(collected: number, target: number): BatchTier {
  if (target <= 0) return "early";
  if (collected >= target) return "triggered";
  const pct = collected / target;
  if (pct >= ALMOST_THERE_THRESHOLD) return "almost-there";
  if (pct >= BUILDING_THRESHOLD) return "building";
  return "early";
}

export function progressBarPercent(collected: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((collected / target) * 100));
}

// Product detail page — shown to a visitor who hasn't bought anything yet.
export function productPageMessage(collected: number, target: number): string {
  const tier = getBatchTier(collected, target);
  switch (tier) {
    case "triggered":
      return "This batch just hit its production threshold — a new batch has opened for the next round.";
    case "almost-there":
      return `Almost there! ${collected.toLocaleString()} of ${target.toLocaleString()} units ordered — order now to help trigger production.`;
    case "building":
      return `${collected.toLocaleString()} of ${target.toLocaleString()} units ordered so far — order now to help fill this batch.`;
    case "early":
    default:
      return "Our next production batch just opened — be among the first to order.";
  }
}

// Cart page — shorter, sits under a single cart line.
export function cartMessage(collected: number, target: number): string {
  const tier = getBatchTier(collected, target);
  switch (tier) {
    case "triggered":
      return "This batch just hit its threshold — your order will join the next one.";
    case "almost-there":
      return `Almost there! ${collected.toLocaleString()} of ${target.toLocaleString()} units ordered.`;
    case "building":
      return `Batch progress: ${collected.toLocaleString()} of ${target.toLocaleString()} units ordered so far.`;
    case "early":
    default:
      return "You could be among the first to order in this batch.";
  }
}

// Order confirmation page — shown right after payment. justTriggered means
// THIS order's assignment is what pushed the batch over its threshold.
export function orderConfirmedMessage(collected: number, target: number, justTriggered: boolean): string {
  if (justTriggered) {
    return `This batch just hit its production threshold (${collected.toLocaleString()} of ${target.toLocaleString()} units) — production is starting.`;
  }
  const tier = getBatchTier(collected, target);
  switch (tier) {
    case "almost-there":
      return `This batch is almost full — ${collected.toLocaleString()} of ${target.toLocaleString()} units ordered. We'll be in touch with your expected timing soon.`;
    case "building":
      return `Batch progress: ${collected.toLocaleString()} of ${target.toLocaleString()} units ordered so far. We'll be in touch with your expected timing.`;
    case "early":
    default:
      return "You're among the first to help start this batch — we'll keep you updated as it fills and let you know your expected timing.";
  }
}

// Order status lookup page — a customer checking back later. isSettled
// covers "in_production" and "fulfilled": the batch is no longer open, so
// showing its historical progress is just informational, not a demand signal.
export function orderStatusMessage(collected: number, target: number, isSettled: boolean): string {
  if (isSettled) {
    return "This item's production batch has been triggered.";
  }
  const tier = getBatchTier(collected, target);
  switch (tier) {
    case "almost-there":
      return `This batch is almost full — ${collected.toLocaleString()} of ${target.toLocaleString()} units ordered as of your order.`;
    case "building":
      return `Batch progress as of your order: ${collected.toLocaleString()} of ${target.toLocaleString()} units.`;
    case "early":
    default:
      return "You were among the first to order this batch as it opened.";
  }
}
