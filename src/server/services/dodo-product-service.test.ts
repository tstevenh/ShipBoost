import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDodoClientMock, getEnvMock } = vi.hoisted(() => ({
  getDodoClientMock: vi.fn(),
  getEnvMock: vi.fn(),
}));

vi.mock("@/server/dodo", () => ({
  getDodoClient: getDodoClientMock,
}));

vi.mock("@/server/env", () => ({
  getEnv: getEnvMock,
}));

import { loadPremiumLaunchPriceCard } from "@/server/services/dodo-product-service";

describe("dodo-product-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEnvMock.mockReturnValue({
      DODO_PREMIUM_LAUNCH_PRODUCT_ID: "prod_premium_1",
    });
  });

  it("formats the live Dodo premium-launch price", async () => {
    getDodoClientMock.mockReturnValue({
      products: {
        retrieve: vi.fn().mockResolvedValue({
          price: {
            type: "one_time_price",
            price: 900,
            currency: "USD",
            discount: 0,
            purchasing_power_parity: false,
          },
        }),
      },
    });

    await expect(loadPremiumLaunchPriceCard()).resolves.toEqual({
      currentPrice: "$9",
      currentPriceCents: 900,
      compareAtPrice: "$19",
    });
  });

  it("falls back to the default current price when Dodo is unavailable", async () => {
    getDodoClientMock.mockReturnValue({
      products: {
        retrieve: vi.fn().mockRejectedValue(new Error("Dodo unavailable")),
      },
    });

    await expect(loadPremiumLaunchPriceCard()).resolves.toEqual({
      currentPrice: "$9",
      currentPriceCents: 900,
      compareAtPrice: "$19",
    });
  });

  it("uses the fallback card when no premium-launch product id is configured", async () => {
    getEnvMock.mockReturnValue({
      DODO_PREMIUM_LAUNCH_PRODUCT_ID: undefined,
    });

    await expect(loadPremiumLaunchPriceCard()).resolves.toEqual({
      currentPrice: "$9",
      currentPriceCents: 900,
      compareAtPrice: "$19",
    });
    expect(getDodoClientMock).not.toHaveBeenCalled();
  });
});
