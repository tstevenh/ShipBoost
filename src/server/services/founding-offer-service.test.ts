import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    submission: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/env", () => ({
  getEnv: () => ({
    FOUNDING_PREMIUM_LAUNCH_LIMIT: 100,
  }),
}));

import { getRemainingFoundingPremiumLaunchSpots } from "@/server/services/founding-offer-service";

describe("founding-offer-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the remaining founding premium launch spots", async () => {
    prismaMock.submission.count.mockResolvedValueOnce(34);

    await expect(getRemainingFoundingPremiumLaunchSpots()).resolves.toBe(66);
    expect(prismaMock.submission.count).toHaveBeenCalledWith({
      where: {
        submissionType: "FEATURED_LAUNCH",
        paymentStatus: "PAID",
      },
    });
  });

  it("never returns a negative number", async () => {
    prismaMock.submission.count.mockResolvedValueOnce(140);

    await expect(getRemainingFoundingPremiumLaunchSpots()).resolves.toBe(0);
  });
});
