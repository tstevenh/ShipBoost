const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shipboost.io";

export const shipBoostSiteSchema = {
  name: "ShipBoost",
  url: appUrl.replace(/\/$/, ""),
  logoUrl: `${appUrl.replace(/\/$/, "")}/logos/logo-black.png`,
  supportEmail: "support@shipboost.io",
} as const;
