import { describe, expect, it } from "vitest";

import { AppError } from "@/server/http/app-error";
import {
  FREE_LAUNCH_REQUIRED_BOARD_UPVOTES,
  assertFreeLaunchGate,
} from "./free-launch-gate";

describe("assertFreeLaunchGate", () => {
  it("throws when the badge is not verified", () => {
    expect(() =>
      assertFreeLaunchGate({ badgeVerification: "PENDING", eligibleBoardUpvoteCount: 5 }),
    ).toThrowError(AppError);
  });

  it("throws when fewer than the required board upvotes", () => {
    expect(() =>
      assertFreeLaunchGate({ badgeVerification: "VERIFIED", eligibleBoardUpvoteCount: 2 }),
    ).toThrowError(AppError);
  });

  it("passes when badge verified and upvote requirement met", () => {
    expect(() =>
      assertFreeLaunchGate({
        badgeVerification: "VERIFIED",
        eligibleBoardUpvoteCount: FREE_LAUNCH_REQUIRED_BOARD_UPVOTES,
      }),
    ).not.toThrow();
  });
});
