// Launch video add-on: a fixed-format 20-second motion film. Cheaper with
// Premium Launch (delivered during the launch week), also sold on its own to
// free launchers (delivered within 7 days of the order).
// Shared by the submit flow, the pricing page and the server services.

export const LAUNCH_VIDEO_LAUNCH_PRICE_LIMIT = 10;
export const LAUNCH_VIDEO_LATER_PRICE_USD = { premium: 149, standalone: 179 } as const;
export const LAUNCH_VIDEO_WEEKLY_CAPACITY = 5;
export const LAUNCH_VIDEO_STANDALONE_DELIVERY_DAYS = 7;
export const LAUNCH_VIDEO_FOCUS_NOTE_MAX_LENGTH = 200;
export const LAUNCH_VIDEO_HIGHLIGHT_MAX_LENGTH = 120;
export const LAUNCH_VIDEO_AVOID_NOTE_MAX_LENGTH = 300;

export type LaunchVideoScreenshotRole = "before" | "after";

export type LaunchVideoScreenshot = {
  role: LaunchVideoScreenshotRole;
  url: string;
  publicId: string;
};

/** What the founder sees and edits on the launch video brief page. */
export type LaunchVideoBrief = {
  submissionId: string;
  toolName: string;
  status: "PAID" | "DELIVERED";
  standalone: boolean;
  launchWeekStart: string;
  deliverBy: string | null;
  focusNote: string;
  highlightClaim: string;
  avoidNote: string;
  screenshots: LaunchVideoScreenshot[];
  briefUpdatedAt: string | null;
};

export type LaunchVideoMode = keyof typeof LAUNCH_VIDEO_LATER_PRICE_USD;

export type LaunchVideoSource = {
  videoUrl: string;
  posterUrl: string;
};

export type LaunchVideoDemo = LaunchVideoSource & {
  /** The 9:16 cut of the same sample, when uploaded. */
  portrait: LaunchVideoSource | null;
};

// The sample's result frame (Tally v2: four gold stars), used as the poster.
// Update it and the caption when the sample changes.
export const LAUNCH_VIDEO_DEMO_POSTER_SECONDS = 10;

// Shown under the sample. Update it when the sample changes.
export const LAUNCH_VIDEO_DEMO_CAPTION =
  "Sample: an unofficial launch video we made for Tally, not affiliated with Tally. Yours shows your product.";

export type LaunchVideoOffer = {
  available: boolean;
  priceUsd: Record<LaunchVideoMode, number>;
  launchPriceSpotsLeft: number;
  bookedWeekStarts: string[];
  standaloneBooked: boolean;
  demo: LaunchVideoDemo | null;
};

const SHARED_FEATURES = [
  "One real action in your product: the click, and what it produces",
  "Two cuts: 16:9 for X, YouTube and your site, 9:16 for Shorts and Reels",
  "Your colors, fonts and interface, taken from your site",
];

const CREDIT_FEATURE =
  "Yours to post anywhere, with a small “Launched on ShipBoost” credit on the end card";

export function getLaunchVideoFeatures(mode: LaunchVideoMode | "any") {
  const delivery =
    mode === "premium"
      ? "Delivered during your launch week"
      : mode === "standalone"
        ? `Delivered within ${LAUNCH_VIDEO_STANDALONE_DELIVERY_DAYS} days of your order`
        : `Delivered during your launch week with Premium, or within ${LAUNCH_VIDEO_STANDALONE_DELIVERY_DAYS} days with a free launch`;

  return [...SHARED_FEATURES, delivery, CREDIT_FEATURE];
}

export function getLaunchVideoTerms(mode: LaunchVideoMode | "any") {
  const refund =
    mode === "premium"
      ? "Not delivered during your launch week? Full refund."
      : mode === "standalone"
        ? `Not delivered within ${LAUNCH_VIDEO_STANDALONE_DELIVERY_DAYS} days? Full refund.`
        : "Not delivered on time? Full refund.";

  return `No revision rounds: every video uses one fixed format, and we check every frame before it ships. If we get a fact about your product wrong, we fix it. ${refund}`;
}

export function formatLaunchVideoPriceNote(
  offer: Pick<LaunchVideoOffer, "launchPriceSpotsLeft">,
  mode: LaunchVideoMode | "any",
) {
  if (offer.launchPriceSpotsLeft <= 0) {
    return null;
  }

  const later =
    mode === "any"
      ? `$${LAUNCH_VIDEO_LATER_PRICE_USD.premium} / $${LAUNCH_VIDEO_LATER_PRICE_USD.standalone}`
      : `$${LAUNCH_VIDEO_LATER_PRICE_USD[mode]}`;

  return `Launch price for the first ${LAUNCH_VIDEO_LAUNCH_PRICE_LIMIT} videos · ${offer.launchPriceSpotsLeft} left · ${later} after that`;
}

export function formatLaunchVideoPremiumPerk(offer: Pick<LaunchVideoOffer, "priceUsd">) {
  return `Launch video add-on for $${offer.priceUsd.premium} ($${offer.priceUsd.standalone} without Premium)`;
}
