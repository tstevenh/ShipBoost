import { unstable_cache } from "next/cache";

import { getDodoClient } from "@/server/dodo";
import { getEnv } from "@/server/env";

const FALLBACK_CURRENT_PRICE_CENTS = 900;
const FALLBACK_COMPARE_AT_PRICE = "$19";
const FALLBACK_CURRENCY = "USD";

function formatPrice(cents: number, currency: string) {
  const fractionDigits = cents % 100 === 0 ? 0 : 2;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(cents / 100);
}

function buildFallbackPriceCard() {
  return {
    currentPrice: formatPrice(FALLBACK_CURRENT_PRICE_CENTS, FALLBACK_CURRENCY),
    currentPriceCents: FALLBACK_CURRENT_PRICE_CENTS,
    compareAtPrice: FALLBACK_COMPARE_AT_PRICE,
  };
}

function readCurrentPrice(product: Awaited<ReturnType<ReturnType<typeof getDodoClient>["products"]["retrieve"]>>) {
  const price = product.price;

  if (typeof price !== "object" || price === null) {
    return buildFallbackPriceCard();
  }

  const currentPriceCents =
    "price" in price && typeof price.price === "number" && price.price > 0
      ? price.price
      : "fixed_price" in price &&
          typeof price.fixed_price === "number" &&
          price.fixed_price > 0
        ? price.fixed_price
        : FALLBACK_CURRENT_PRICE_CENTS;
  const currency =
    typeof price.currency === "string" && price.currency.length > 0
      ? price.currency
      : FALLBACK_CURRENCY;

  return {
    currentPrice: formatPrice(currentPriceCents, currency),
    currentPriceCents,
    compareAtPrice: FALLBACK_COMPARE_AT_PRICE,
  };
}

export async function loadPremiumLaunchPriceCard() {
  const env = getEnv();

  if (!env.DODO_PREMIUM_LAUNCH_PRODUCT_ID) {
    return buildFallbackPriceCard();
  }

  try {
    const dodo = getDodoClient();
    const product = await dodo.products.retrieve(env.DODO_PREMIUM_LAUNCH_PRODUCT_ID);
    return readCurrentPrice(product);
  } catch (error) {
    console.error("[shipboost dodo] failed to load premium launch price", error);
    return buildFallbackPriceCard();
  }
}

const getCachedPremiumLaunchPriceCard = unstable_cache(
  loadPremiumLaunchPriceCard,
  ["dodo-premium-launch-price", "v1"],
  {
    revalidate: 900,
  },
);

export async function getPremiumLaunchPriceCard() {
  return getCachedPremiumLaunchPriceCard();
}
