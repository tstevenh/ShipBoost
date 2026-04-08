import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import { getSubmissionById } from "@/server/repositories/submission-repository";
import { getToolByOwner } from "@/server/repositories/tool-repository";
import { isLaunchPubliclyVisible } from "@/server/services/public-tool-visibility";
import type { AuthenticatedFounder } from "@/server/services/submission-service-shared";

export async function createRelaunchSubmission(
  toolId: string,
  founder: AuthenticatedFounder,
) {
  const tool = await getToolByOwner(prisma, founder.id, toolId);

  if (!tool) {
    throw new AppError(404, "Tool not found.");
  }

  const hasLaunchHistory = tool.launches.some((launch) =>
    isLaunchPubliclyVisible(launch),
  );

  if (!hasLaunchHistory) {
    throw new AppError(400, "Only launched products can be relaunched.");
  }

  const existingDraft = await prisma.submission.findFirst({
    where: {
      userId: founder.id,
      toolId,
      submissionType: "RELAUNCH",
      reviewStatus: {
        in: ["DRAFT", "PENDING"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingDraft) {
    const submission = await getSubmissionById(prisma, existingDraft.id);

    if (!submission) {
      throw new AppError(500, "Relaunch draft exists but could not be reloaded.");
    }

    return submission;
  }

  const created = await prisma.submission.create({
    data: {
      userId: founder.id,
      toolId,
      submissionType: "RELAUNCH",
      requestedSlug: tool.slug,
      preferredLaunchDate: null,
      paymentStatus: "NOT_REQUIRED",
      badgeFooterUrl: null,
      badgeVerification: "NOT_REQUIRED",
      reviewStatus: "DRAFT",
    },
  });

  const submission = await getSubmissionById(prisma, created.id);

  if (!submission) {
    throw new AppError(500, "Relaunch draft created but could not be reloaded.");
  }

  return submission;
}
