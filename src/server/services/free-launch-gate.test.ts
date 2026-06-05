import { describe, expect, it } from "vitest";

import { AppError } from "@/server/http/app-error";
import {
  FREE_LAUNCH_REQUIRED_BOARD_UPVOTES,
  assertFreeLaunchGate,
  computeRequiredBoardUpvotes,
} from "./free-launch-gate";

describe("assertFreeLaunchGate", () => {
  it("throws when the badge is not verified", () => {
    expect(() =>
      assertFreeLaunchGate({ badgeVerification: "PENDING", eligibleBoardUpvoteCount: 5 }),
    ).toThrowError(AppError);
  });

  it("throws when fewer than the required board upvotes (default 3)", () => {
    expect(() =>
      assertFreeLaunchGate({ badgeVerification: "VERIFIED", eligibleBoardUpvoteCount: 2 }),
    ).toThrowError(AppError);
  });

  it("passes when badge verified and the default upvote requirement is met", () => {
    expect(() =>
      assertFreeLaunchGate({
        badgeVerification: "VERIFIED",
        eligibleBoardUpvoteCount: FREE_LAUNCH_REQUIRED_BOARD_UPVOTES,
      }),
    ).not.toThrow();
  });

  it("honors a dynamic requiredBoardUpvotes (thin board)", () => {
    expect(() =>
      assertFreeLaunchGate({
        badgeVerification: "VERIFIED",
        eligibleBoardUpvoteCount: 2,
        requiredBoardUpvotes: 2,
      }),
    ).not.toThrow();
  });

  it("waives the upvote requirement when requiredBoardUpvotes is 0", () => {
    expect(() =>
      assertFreeLaunchGate({
        badgeVerification: "VERIFIED",
        eligibleBoardUpvoteCount: 0,
        requiredBoardUpvotes: 0,
      }),
    ).not.toThrow();
  });
});

describe("computeRequiredBoardUpvotes", () => {
  it("caps the requirement at 3 but never exceeds available board tools", () => {
    expect(computeRequiredBoardUpvotes(0)).toBe(0);
    expect(computeRequiredBoardUpvotes(2)).toBe(2);
    expect(computeRequiredBoardUpvotes(3)).toBe(3);
    expect(computeRequiredBoardUpvotes(10)).toBe(3);
    expect(computeRequiredBoardUpvotes(-1)).toBe(0);
  });
});
