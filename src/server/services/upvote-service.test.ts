import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
    tool: {
      findFirst: vi.fn(),
    },
    toolVote: {
      aggregate: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

const { getVoteMultiplierMock, recordStreakActivityMock } = vi.hoisted(() => ({
  getVoteMultiplierMock: vi.fn(),
  recordStreakActivityMock: vi.fn(),
}));

vi.mock("@/server/services/streak-service", () => ({
  getVoteMultiplier: getVoteMultiplierMock,
  recordStreakActivity: recordStreakActivityMock,
}));

import {
  getDailyVotesRemaining,
  getToolUpvoteCount,
  hasUserUpvotedTool,
  listToolUpvoteCounts,
  toggleToolUpvote,
} from "@/server/services/upvote-service";

describe("upvote-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ role: "FOUNDER" });
    getVoteMultiplierMock.mockResolvedValue(1);
    recordStreakActivityMock.mockResolvedValue({ recorded: true, streakCount: 1, crossedMilestone: null });
  });

  it("creates a vote for a public tool", async () => {
    prismaMock.toolVote.findUnique.mockResolvedValueOnce(null);
    prismaMock.tool.findFirst.mockResolvedValueOnce({ id: "tool_1" });
    prismaMock.toolVote.count.mockResolvedValueOnce(1);
    prismaMock.toolVote.create.mockResolvedValueOnce({
      id: "vote_1",
    });
    prismaMock.toolVote.aggregate.mockResolvedValueOnce({
      _sum: {
        weight: 1,
      },
    });
    prismaMock.toolVote.findUnique.mockResolvedValueOnce({ id: "vote_1" });
    prismaMock.toolVote.count.mockResolvedValueOnce(1);

    const result = await toggleToolUpvote(
      "tool_1",
      "user_1",
      new Date("2026-04-07T10:00:00.000Z"),
    );

    expect(prismaMock.toolVote.create).toHaveBeenCalledWith({
      data: {
        toolId: "tool_1",
        userId: "user_1",
        weight: 1,
      },
    });
    expect(result).toEqual({
      hasUpvoted: true,
      upvoteCount: 1,
      dailyVotesRemaining: 2,
    });
  });

  it("removes an existing vote and refunds a slot", async () => {
    prismaMock.toolVote.findUnique.mockResolvedValueOnce({ id: "vote_1" });
    prismaMock.toolVote.delete.mockResolvedValueOnce({ id: "vote_1" });
    prismaMock.toolVote.aggregate.mockResolvedValueOnce({
      _sum: {
        weight: 0,
      },
    });
    prismaMock.toolVote.findUnique.mockResolvedValueOnce(null);
    prismaMock.toolVote.count.mockResolvedValueOnce(0);

    const result = await toggleToolUpvote(
      "tool_1",
      "user_1",
      new Date("2026-04-07T10:00:00.000Z"),
    );

    expect(prismaMock.toolVote.delete).toHaveBeenCalledWith({
      where: {
        toolId_userId: {
          toolId: "tool_1",
          userId: "user_1",
        },
      },
    });
    expect(result).toEqual({
      hasUpvoted: false,
      upvoteCount: 0,
      dailyVotesRemaining: 3,
    });
  });

  it("blocks the fourth active same-day vote", async () => {
    prismaMock.toolVote.findUnique.mockResolvedValueOnce(null);
    prismaMock.tool.findFirst.mockResolvedValueOnce({ id: "tool_4" });
    prismaMock.toolVote.count.mockResolvedValueOnce(3);

    await expect(
      toggleToolUpvote(
        "tool_4",
        "user_1",
        new Date("2026-04-07T10:00:00.000Z"),
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Daily upvote limit reached.",
    });
  });

  it("rejects voting on a hidden tool", async () => {
    prismaMock.toolVote.findUnique.mockResolvedValueOnce(null);
    prismaMock.tool.findFirst.mockResolvedValueOnce(null);

    await expect(
      toggleToolUpvote(
        "tool_hidden",
        "user_1",
        new Date("2026-04-07T10:00:00.000Z"),
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Tool not found.",
    });
  });

  it("reports remaining daily votes", async () => {
    prismaMock.toolVote.count.mockResolvedValueOnce(2);

    await expect(
      getDailyVotesRemaining("user_1", new Date("2026-04-07T10:00:00.000Z")),
    ).resolves.toBe(1);
  });

  it("lets admin users vote with triple weight and no daily limit", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "ADMIN" });
    prismaMock.toolVote.findUnique.mockResolvedValueOnce(null);
    prismaMock.tool.findFirst.mockResolvedValueOnce({ id: "tool_1" });
    prismaMock.toolVote.create.mockResolvedValueOnce({
      id: "vote_1",
    });
    prismaMock.toolVote.aggregate.mockResolvedValueOnce({
      _sum: {
        weight: 3,
      },
    });
    prismaMock.toolVote.findUnique.mockResolvedValueOnce({ id: "vote_1" });

    const result = await toggleToolUpvote(
      "tool_1",
      "admin_1",
      new Date("2026-04-07T10:00:00.000Z"),
    );

    expect(prismaMock.toolVote.create).toHaveBeenCalledWith({
      data: {
        toolId: "tool_1",
        userId: "admin_1",
        weight: 3,
      },
    });
    expect(result).toEqual({
      hasUpvoted: true,
      upvoteCount: 3,
      dailyVotesRemaining: Number.MAX_SAFE_INTEGER,
    });
  });

  it("reports unlimited remaining daily votes for admin users", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "ADMIN" });

    await expect(
      getDailyVotesRemaining("admin_1", new Date("2026-04-07T10:00:00.000Z")),
    ).resolves.toBe(Number.MAX_SAFE_INTEGER);
    expect(prismaMock.toolVote.count).not.toHaveBeenCalled();
  });

  it("detects whether a user has upvoted a tool", async () => {
    prismaMock.toolVote.findUnique.mockResolvedValueOnce({ id: "vote_1" });

    await expect(hasUserUpvotedTool("tool_1", "user_1")).resolves.toBe(true);
  });

  it("sums weighted vote counts for a single tool", async () => {
    prismaMock.toolVote.aggregate.mockResolvedValueOnce({
      _sum: {
        weight: 4,
      },
    });

    await expect(getToolUpvoteCount("tool_1")).resolves.toBe(4);
  });

  it("lists weighted vote counts by tool", async () => {
    prismaMock.toolVote.groupBy.mockResolvedValueOnce([
      {
        toolId: "tool_1",
        _sum: {
          weight: 4,
        },
      },
      {
        toolId: "tool_2",
        _sum: {
          weight: 1,
        },
      },
    ]);

    await expect(listToolUpvoteCounts(["tool_1", "tool_2"])).resolves.toEqual(
      new Map([
        ["tool_1", 4],
        ["tool_2", 1],
      ]),
    );
  });

  it("applies streak multiplier to vote weight for 5-day-streak user", async () => {
    getVoteMultiplierMock.mockResolvedValueOnce(2);
    prismaMock.toolVote.findUnique.mockResolvedValueOnce(null);
    prismaMock.tool.findFirst.mockResolvedValueOnce({ id: "tool_1" });
    prismaMock.toolVote.count.mockResolvedValueOnce(1);
    prismaMock.toolVote.create.mockResolvedValueOnce({ id: "vote_1" });
    prismaMock.toolVote.aggregate.mockResolvedValueOnce({ _sum: { weight: 2 } });
    prismaMock.toolVote.findUnique.mockResolvedValueOnce({ id: "vote_1" });
    prismaMock.toolVote.count.mockResolvedValueOnce(1);

    await toggleToolUpvote("tool_1", "user_streak", new Date("2026-01-06T10:00:00.000Z"));

    expect(prismaMock.toolVote.create).toHaveBeenCalledWith({
      data: {
        toolId: "tool_1",
        userId: "user_streak",
        weight: 2,
      },
    });
  });
});
