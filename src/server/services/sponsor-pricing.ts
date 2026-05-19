import { getEnv } from "@/server/env";
import type { SponsorSlot } from "@prisma/client";

export type SponsorSlotConfig = {
  slot: SponsorSlot;
  label: string;
  description: string;
  priceUsd: number;
  inventoryCap: number;
  dodoProductId: string | undefined;
};

export function getSponsorSlotConfig(slot: SponsorSlot): SponsorSlotConfig {
  const env = getEnv();
  switch (slot) {
    case "SIDEBAR":
      return {
        slot: "SIDEBAR",
        label: "Sidebar",
        description:
          "Persistent slot on every discovery page (home, categories, tags, launchboards).",
        priceUsd: 59,
        inventoryCap: 3,
        dodoProductId: env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID,
      };
    case "INLINE_BANNER":
      return {
        slot: "INLINE_BANNER",
        label: "Banner",
        description: "Inline banner in the launchboard feed. Animated, hard to miss.",
        priceUsd: 49,
        inventoryCap: 1,
        dodoProductId: env.DODO_SPONSOR_BANNER_PRODUCT_ID,
      };
    case "INLINE_PRODUCT":
      return {
        slot: "INLINE_PRODUCT",
        label: "Product ad",
        description: "Native-style row in the launchboard feed.",
        priceUsd: 29,
        inventoryCap: 2,
        dodoProductId: env.DODO_SPONSOR_PRODUCT_AD_PRODUCT_ID,
      };
  }
}

export const ALL_SPONSOR_SLOTS: SponsorSlot[] = [
  "SIDEBAR",
  "INLINE_BANNER",
  "INLINE_PRODUCT",
];
