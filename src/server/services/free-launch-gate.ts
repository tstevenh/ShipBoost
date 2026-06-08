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
  /** Defaults to FREE_LAUNCH_REQUIRED_BOARD_UPVOTES; pass min(3, available) for thin boards. */
  requiredBoardUpvotes?: number;
};

export function computeRequiredBoardUpvotes(
  availableNonOwnBoardToolCount: number,
): number {
  return Math.max(0, Math.min(FREE_LAUNCH_REQUIRED_BOARD_UPVOTES, availableNonOwnBoardToolCount));
}

export function assertFreeLaunchGate({
  badgeVerification,
  eligibleBoardUpvoteCount,
  requiredBoardUpvotes = FREE_LAUNCH_REQUIRED_BOARD_UPVOTES,
}: FreeLaunchGateInput): void {
  if (badgeVerification !== "VERIFIED") {
    throw new AppError(
      400,
      "Verify your ShipBoost badge on your site before scheduling your free launch.",
    );
  }

  if (eligibleBoardUpvoteCount < requiredBoardUpvotes) {
    throw new AppError(
      400,
      `Upvote at least ${requiredBoardUpvotes} launches on this week's board before scheduling your free launch.`,
    );
  }
}
