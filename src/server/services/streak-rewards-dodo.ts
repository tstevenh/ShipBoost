import { getDodoClient } from "@/server/dodo";
import { getEnv } from "@/server/env";

export type StreakProductScope = "PREMIUM_LAUNCH" | "SPONSOR_PLACEMENT";

export interface CreateDiscountInput {
  userId: string;
  percentOff: number;
  productScope: StreakProductScope;
}

export interface CreatedDiscount {
  code: string;
  dodoDiscountId: string;
}

function generateCodeSuffix() {
  // Use crypto.randomUUID and strip dashes; take 8 chars for compactness.
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

function getProductId(scope: StreakProductScope): string {
  const env = getEnv();
  const id =
    scope === "PREMIUM_LAUNCH"
      ? env.DODO_PREMIUM_LAUNCH_PRODUCT_ID
      : env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID;
  if (!id) {
    throw new Error(`Missing Dodo product ID for scope ${scope}`);
  }
  return id;
}

export async function createDodoStreakDiscount({
  userId,
  percentOff,
  productScope,
}: CreateDiscountInput): Promise<CreatedDiscount> {
  const code = `STREAK${percentOff}-${generateCodeSuffix()}`;
  const dodo = getDodoClient();
  const discount = await dodo.discounts.create({
    code,
    amount: percentOff * 100, // 25% -> 2500 basis points
    type: "percentage",
    usage_limit: 1,
    restricted_to: [getProductId(productScope)],
    metadata: { userId, source: "streak" },
  });
  return { code, dodoDiscountId: discount.discount_id };
}
