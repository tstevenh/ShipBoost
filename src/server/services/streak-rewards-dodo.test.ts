import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/dodo", () => ({
  getDodoClient: () => ({
    discounts: {
      create: vi.fn(async (input: unknown) => ({
        discount_id: "disc_test_123",
        code: (input as { code: string }).code,
      })),
    },
  }),
}));

vi.mock("@/server/env", () => ({
  getEnv: () => ({
    DODO_PREMIUM_LAUNCH_PRODUCT_ID: "prod_premium_test",
    DODO_SPONSOR_PLACEMENT_PRODUCT_ID: "prod_sponsor_test",
  }),
}));

import { createDodoStreakDiscount } from "./streak-rewards-dodo";

describe("createDodoStreakDiscount", () => {
  it("generates a single-use code scoped to a product", async () => {
    const result = await createDodoStreakDiscount({
      userId: "user_abc",
      percentOff: 25,
      productScope: "PREMIUM_LAUNCH",
    });
    expect(result.dodoDiscountId).toBe("disc_test_123");
    expect(result.code).toMatch(/^STREAK25-/);
    expect(result.code.length).toBeGreaterThanOrEqual(11);
  });
});
