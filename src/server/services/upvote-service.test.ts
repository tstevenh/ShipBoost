import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    tool: {
      findFirst: vi.fn(),
    },
    toolVote: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import {
  getDailyVotesRemaining,
  hasUserUpvotedTool,
  toggleToolUpvote,
} from "@/server/services/upvote-service";

describe("upvote-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a vote for a public tool", async () => {
    prismaMock.toolVote.findUnique.mockResolvedValueOnce(null);
    prismaMock.tool.findFirst.mockResolvedValueOnce({ id: "tool_1" });
    prismaMock.toolVote.count.mockResolvedValueOnce(1);
    prismaMock.toolVote.create.mockResolvedValueOnce({
      id: "vote_1",
    });
    prismaMock.toolVote.count.mockResolvedValueOnce(1);
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
    prismaMock.toolVote.count.mockResolvedValueOnce(0);
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

  it("detects whether a user has upvoted a tool", async () => {
    prismaMock.toolVote.findUnique.mockResolvedValueOnce({ id: "vote_1" });

    await expect(hasUserUpvotedTool("tool_1", "user_1")).resolves.toBe(true);
  });
});
