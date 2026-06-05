import { AppError } from "@/server/http/app-error";

export const FREE_LAUNCH_REQUIRED_BOARD_UPVOTES = 3;

export type FreeLaunchGateInput = {
  badgeVerification:
    | "NOT_REQUIRED"
    | "PENDING"
    | "VERIFIED"
    | "FAILED"
    | null
    | undefined;
  eligibleBoardUpvoteCount: number;
};

export function computeRequiredBoardUpvotes(
  availableNonOwnBoardToolCount: number,
): number {
  return Math.max(0, Math.min(FREE_LAUNCH_REQUIRED_BOARD_UPVOTES, availableNonOwnBoardToolCount));
}

export function assertFreeLaunchGate({
  badgeVerification,
  eligibleBoardUpvoteCount,
}: FreeLaunchGateInput): void {
  if (badgeVerification !== "VERIFIED") {
    throw new AppError(
      400,
      "Verify your ShipBoost badge on your site before scheduling your free launch.",
    );
  }

  if (eligibleBoardUpvoteCount < FREE_LAUNCH_REQUIRED_BOARD_UPVOTES) {
    throw new AppError(
      400,
      `Upvote at least ${FREE_LAUNCH_REQUIRED_BOARD_UPVOTES} launches on this week's board before scheduling your free launch.`,
    );
  }
}
