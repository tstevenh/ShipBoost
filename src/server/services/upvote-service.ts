import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import { startOfDay } from "@/server/services/time";

const DAILY_UPVOTE_LIMIT = 3;

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function ensurePublicTool(toolId: string) {
  const tool = await prisma.tool.findFirst({
    where: {
      id: toolId,
      ...getPubliclyVisibleToolWhere(),
    },
    select: {
      id: true,
    },
  });

  if (!tool) {
    throw new AppError(404, "Tool not found.");
  }

  return tool;
}

export async function getToolUpvoteCount(toolId: string) {
  return prisma.toolVote.count({
    where: {
      toolId,
    },
  });
}

export async function hasUserUpvotedTool(
  toolId: string,
  userId: string | null | undefined,
) {
  if (!userId) {
    return false;
  }

  const vote = await prisma.toolVote.findUnique({
    where: {
      toolId_userId: {
        toolId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(vote);
}

export async function getDailyVotesRemaining(
  userId: string,
  now = new Date(),
) {
  const activeVotesToday = await prisma.toolVote.count({
    where: {
      userId,
      createdAt: {
        gte: startOfDay(now),
      },
    },
  });

  return Math.max(0, DAILY_UPVOTE_LIMIT - activeVotesToday);
}

async function getToolVoteState(toolId: string, userId: string, now: Date) {
  const [upvoteCount, hasUpvoted, dailyVotesRemaining] = await Promise.all([
    getToolUpvoteCount(toolId),
    hasUserUpvotedTool(toolId, userId),
    getDailyVotesRemaining(userId, now),
  ]);

  return {
    hasUpvoted,
    upvoteCount,
    dailyVotesRemaining,
  };
}

export async function toggleToolUpvote(
  toolId: string,
  userId: string,
  now = new Date(),
) {
  const existingVote = await prisma.toolVote.findUnique({
    where: {
      toolId_userId: {
        toolId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingVote) {
    await prisma.toolVote.delete({
      where: {
        toolId_userId: {
          toolId,
          userId,
        },
      },
    });

    return getToolVoteState(toolId, userId, now);
  }

  await ensurePublicTool(toolId);

  const dailyVotesRemaining = await getDailyVotesRemaining(userId, now);

  if (dailyVotesRemaining <= 0) {
    throw new AppError(409, "Daily upvote limit reached.");
  }

  try {
    await prisma.toolVote.create({
      data: {
        toolId,
        userId,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }

  return getToolVoteState(toolId, userId, now);
}
