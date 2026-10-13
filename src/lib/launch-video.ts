// Launch video add-on: a fixed-format 20-second motion film. Cheaper with
// Premium Launch (delivered during the launch week), also sold on its own to
// free launchers (delivered within 7 days of the order).
// Shared by the submit flow, the pricing page and the server services.

export const LAUNCH_VIDEO_LAUNCH_PRICE_LIMIT = 10;
export const LAUNCH_VIDEO_LATER_PRICE_USD = { premium: 149, standalone: 179 } as const;
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

type AddOnLaunch = {
  launchType: "FREE" | "FEATURED" | "RELAUNCH";
  status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
  launchDate: Date | string;
};

/**
 * How a video is delivered: during a Premium launch week, or within 7 days of
 * the order. Separate from the price: a Premium founder whose launch week has
 * started pays the Premium price but gets the 7-day delivery.
 */
export type LaunchVideoDelivery = "launch_week" | "seven_days";

/** A launch video bought after the launch is already scheduled. */
export type LaunchVideoAddOn =
  | {
      ok: true;
      mode: LaunchVideoMode;
      delivery: LaunchVideoDelivery;
      priceUsd: number;
      launchWeekStart: string;
    }
  | { ok: false; reason: "unavailable" | "has_video" | "no_launch" };

function utcDayIso(value: Date | string) {
  const date = new Date(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  ).toISOString();
}

/**
 * Whether a submission can still add a launch video, and at which price.
 * A paid Premium launch always gets the Premium price: delivered during its
 * launch week before that week starts, within 7 days of the order after.
 * Every other launch, scheduled, live or ended, gets the standalone price
 * with the 7-day delivery.
 */
export function getLaunchVideoAddOn(
  submission: {
    submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH";
    paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
    hasVideo: boolean;
    launches: AddOnLaunch[];
  },
  offer: Pick<LaunchVideoOffer, "available" | "priceUsd">,
  now = new Date(),
): LaunchVideoAddOn {
  if (submission.hasVideo) return { ok: false, reason: "has_video" };
  if (!offer.available) return { ok: false, reason: "unavailable" };

  const premiumLaunch =
    submission.submissionType === "FEATURED_LAUNCH" && submission.paymentStatus === "PAID"
      ? submission.launches.find(
          (launch) => launch.launchType === "FEATURED" && launch.status !== "REJECTED",
        )
      : undefined;

  if (premiumLaunch) {
    const weekNotStarted =
      (premiumLaunch.status === "PENDING" || premiumLaunch.status === "APPROVED") &&
      new Date(premiumLaunch.launchDate).getTime() > now.getTime();

    return {
      ok: true,
      mode: "premium",
      delivery: weekNotStarted ? "launch_week" : "seven_days",
      priceUsd: offer.priceUsd.premium,
      launchWeekStart: utcDayIso(premiumLaunch.launchDate),
    };
  }

  // The most recent launch, so the delivery line compares against the right week.
  const anyLaunch = submission.launches
    .filter(
      (launch) =>
        launch.status === "APPROVED" || launch.status === "LIVE" || launch.status === "ENDED",
    )
    .sort((a, b) => new Date(b.launchDate).getTime() - new Date(a.launchDate).getTime())[0];

  if (anyLaunch) {
    return {
      ok: true,
      mode: "standalone",
      delivery: "seven_days",
      priceUsd: offer.priceUsd.standalone,
      launchWeekStart: utcDayIso(anyLaunch.launchDate),
    };
  }

  return { ok: false, reason: "no_launch" };
}
