import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import { computeRequiredBoardUpvotes } from "@/server/services/free-launch-gate";
import { listLaunchBoard } from "@/server/services/launch-service";
import {
  listUserUpvotedToolIds,
  recordUpvoteWithoutDailyLimit,
} from "@/server/services/upvote-service";

export type RequirementBoardTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  upvoteCount: number;
  hasUpvoted: boolean;
};

export type FreeLaunchRequirements = {
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
  boardTools: RequirementBoardTool[];
  requiredCount: number;
  eligibleCount: number;
};

type Founder = { id: string };

async function getOwnedFreeSubmission(submissionId: string, founder: Founder) {
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, userId: founder.id },
    select: { id: true, toolId: true, submissionType: true, badgeVerification: true },
  });
  if (!submission) throw new AppError(404, "Submission not found.");
  if (submission.submissionType === "FEATURED_LAUNCH") {
    throw new AppError(400, "Premium launches do not use the free-launch requirements.");
  }
  return submission;
}

async function loadRequirementState(
  submission: { toolId: string; badgeVerification: FreeLaunchRequirements["badgeVerification"] },
  founder: Founder,
): Promise<FreeLaunchRequirements> {
  const launches = await listLaunchBoard("weekly");
  const nonOwn = launches
    .map((launch) => launch.tool)
    .filter((tool) => tool.id !== submission.toolId);

  const upvotedIds = new Set(
    await listUserUpvotedToolIds(nonOwn.map((t) => t.id), founder.id),
  );

  const boardTools: RequirementBoardTool[] = nonOwn.map((tool) => ({
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    logoUrl: tool.logoMedia?.url ?? null,
    upvoteCount: tool.upvoteCount ?? 0,
    hasUpvoted: upvotedIds.has(tool.id),
  }));

  return {
    badgeVerification: submission.badgeVerification,
    boardTools,
    requiredCount: computeRequiredBoardUpvotes(boardTools.length),
    eligibleCount: upvotedIds.size,
  };
}

export async function getFreeLaunchRequirements(
  submissionId: string,
  founder: Founder,
): Promise<FreeLaunchRequirements> {
  const submission = await getOwnedFreeSubmission(submissionId, founder);
  return loadRequirementState(submission, founder);
}

export async function castLaunchRequirementVote(
  submissionId: string,
  toolId: string,
  founder: Founder,
): Promise<{ eligibleCount: number; requiredCount: number }> {
  const submission = await getOwnedFreeSubmission(submissionId, founder);
  const before = await loadRequirementState(submission, founder);

  if (toolId === submission.toolId) {
    throw new AppError(400, "You can't upvote your own launch.");
  }

  const target = before.boardTools.find((tool) => tool.id === toolId);
  if (!target) {
    throw new AppError(400, "That launch isn't on this week's board.");
  }
  if (before.eligibleCount >= before.requiredCount) {
    return { eligibleCount: before.eligibleCount, requiredCount: before.requiredCount };
  }

  await recordUpvoteWithoutDailyLimit(toolId, founder.id);

  const after = await loadRequirementState(submission, founder);
  return { eligibleCount: after.eligibleCount, requiredCount: after.requiredCount };
}
