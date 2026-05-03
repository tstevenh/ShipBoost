import { Prisma, type UserRole } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import { startOfDay } from "@/server/services/time";

const DAILY_UPVOTE_LIMIT = 3;
const STANDARD_VOTE_WEIGHT = 1;
const ADMIN_VOTE_WEIGHT = 3;
const ADMIN_DAILY_VOTES_REMAINING = Number.MAX_SAFE_INTEGER;

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

function getVoteWeightForRole(role: UserRole) {
  return role === "ADMIN" ? ADMIN_VOTE_WEIGHT : STANDARD_VOTE_WEIGHT;
}

async function getUserVoteRole(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found.");
  }

  return user.role;
}

export async function getToolUpvoteCount(toolId: string) {
  const result = await prisma.toolVote.aggregate({
    where: {
      toolId,
    },
    _sum: {
      weight: true,
    },
  });

  return result._sum.weight ?? 0;
}

export async function listToolUpvoteCounts(toolIds: string[]) {
  if (toolIds.length === 0) {
    return new Map<string, number>();
  }

  const voteCounts = await prisma.toolVote.groupBy({
    by: ["toolId"],
    where: {
      toolId: {
        in: toolIds,
      },
    },
    _sum: {
      weight: true,
    },
  });

  return new Map(
    voteCounts.map((voteCount) => [
      voteCount.toolId,
      voteCount._sum.weight ?? 0,
    ]),
  );
}

export async function applyWeightedUpvoteCounts<
  T extends { id: string; _count?: { toolVotes?: number } },
>(tools: T[]) {
  const voteCountByToolId = await listToolUpvoteCounts(
    tools.map((tool) => tool.id),
  );

  return tools.map((tool) => ({
    ...tool,
    _count: {
      ...tool._count,
      toolVotes: voteCountByToolId.get(tool.id) ?? 0,
    },
  }));
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

export async function listUserUpvotedToolIds(
  toolIds: string[],
  userId: string | null | undefined,
) {
  if (!userId || toolIds.length === 0) {
    return new Set<string>();
  }

  const votes = await prisma.toolVote.findMany({
    where: {
      userId,
      toolId: {
        in: toolIds,
      },
    },
    select: {
      toolId: true,
    },
  });

  return new Set(votes.map((vote) => vote.toolId));
}

export async function getDailyVotesRemaining(
  userId: string,
  now = new Date(),
) {
  const role = await getUserVoteRole(userId);

  if (role === "ADMIN") {
    return ADMIN_DAILY_VOTES_REMAINING;
  }

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
  const role = await getUserVoteRole(userId);
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

  const dailyVotesRemaining =
    role === "ADMIN"
      ? ADMIN_DAILY_VOTES_REMAINING
      : await getDailyVotesRemaining(userId, now);

  if (dailyVotesRemaining <= 0) {
    throw new AppError(409, "Daily upvote limit reached.");
  }

  try {
    await prisma.toolVote.create({
      data: {
        toolId,
        userId,
        weight: getVoteWeightForRole(role),
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }

  return getToolVoteState(toolId, userId, now);
}
