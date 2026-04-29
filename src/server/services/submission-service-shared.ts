import { getEnv } from "@/server/env";

export type AuthenticatedFounder = {
  id: string;
};

export type DraftSaveResult = {
  submissionId: string;
  replacedLogoPublicId: string | null;
  replacedScreenshotPublicIds: string[];
};

export type SavedSubmissionDraft = {
  id: string;
  toolId: string;
  submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH";
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
};

export type DeferredEmailTask = () => Promise<void>;

export const freeLaunchBadgePattern =
  /data-shipboost-badge\s*=\s*["']free-launch["']/i;

export function formatLaunchDateForEmail(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function getDashboardUrl() {
  const env = getEnv();
  return `${env.NEXT_PUBLIC_APP_URL}/dashboard`;
}

export async function sendProductEmailSafely(
  task: Promise<void> | DeferredEmailTask,
) {
  try {
    await (typeof task === "function" ? task() : task);
  } catch (error) {
    console.error("[shipboost email:error]", error);
  }
}

export function resolveLaunchType(
  submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH",
) {
  if (submissionType === "RELAUNCH") {
    return "RELAUNCH" as const;
  }

  if (submissionType === "FEATURED_LAUNCH") {
    return "FEATURED" as const;
  }

  return "FREE" as const;
}
