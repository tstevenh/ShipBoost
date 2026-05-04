import { describe, expect, it } from "vitest";

import { rankLaunchBoardLaunches } from "@/server/services/launch-service";

type RankedLaunchInput = Parameters<typeof rankLaunchBoardLaunches>[0][number];

function makeLaunch(input: {
  id: string;
  toolId: string;
  launchType: RankedLaunchInput["launchType"];
  launchDate: string;
  createdAt: string;
  boardVoteCount: number;
}) {
  return {
    id: input.id,
    toolId: input.toolId,
    launchType: input.launchType,
    status: "APPROVED",
    launchDate: new Date(input.launchDate),
    createdAt: new Date(input.createdAt),
    priorityWeight: input.launchType === "FEATURED" ? 100 : 0,
    boardVoteCount: input.boardVoteCount,
    tool: {
      id: input.toolId,
      slug: input.toolId,
      name: input.toolId,
      tagline: `${input.toolId} tagline`,
      websiteUrl: `https://${input.toolId}.example.com`,
      badgeVerification: input.launchType === "FREE" ? "PENDING" : "NOT_REQUIRED",
      currentLaunchType: input.launchType,
      isFeatured: input.launchType === "FEATURED",
      logoMedia: null,
      toolCategories: [],
      _count: {
        toolVotes: input.boardVoteCount,
      },
    },
  } satisfies RankedLaunchInput;
}

describe("launch-service", () => {
  it("uses board votes for the top three, then premium-first with votes within each tier", () => {
    const ranked = rankLaunchBoardLaunches([
      makeLaunch({
        id: "free-a",
        toolId: "free-a",
        launchType: "FREE",
        launchDate: "2026-05-04T00:00:00.000Z",
        createdAt: "2026-04-20T00:00:00.000Z",
        boardVoteCount: 3,
      }),
      makeLaunch({
        id: "premium-a",
        toolId: "premium-a",
        launchType: "FEATURED",
        launchDate: "2026-05-04T00:00:00.000Z",
        createdAt: "2026-04-18T00:00:00.000Z",
        boardVoteCount: 7,
      }),
      makeLaunch({
        id: "premium-b",
        toolId: "premium-b",
        launchType: "FEATURED",
        launchDate: "2026-05-11T00:00:00.000Z",
        createdAt: "2026-04-19T00:00:00.000Z",
        boardVoteCount: 7,
      }),
      makeLaunch({
        id: "free-b",
        toolId: "free-b",
        launchType: "FREE",
        launchDate: "2026-05-11T00:00:00.000Z",
        createdAt: "2026-04-17T00:00:00.000Z",
        boardVoteCount: 1,
      }),
      makeLaunch({
        id: "premium-c",
        toolId: "premium-c",
        launchType: "FEATURED",
        launchDate: "2026-05-18T00:00:00.000Z",
        createdAt: "2026-04-21T00:00:00.000Z",
        boardVoteCount: 0,
      }),
    ]);

    expect(ranked.map((launch) => launch.id)).toEqual([
      "premium-a",
      "premium-b",
      "free-a",
      "premium-c",
      "free-b",
    ]);
  });

  it("ranks an all-free board purely by vote count", () => {
    const ranked = rankLaunchBoardLaunches([
      makeLaunch({
        id: "free-a",
        toolId: "free-a",
        launchType: "FREE",
        launchDate: "2026-05-04T00:00:00.000Z",
        createdAt: "2026-04-21T00:00:00.000Z",
        boardVoteCount: 3,
      }),
      makeLaunch({
        id: "free-b",
        toolId: "free-b",
        launchType: "FREE",
        launchDate: "2026-05-04T00:00:00.000Z",
        createdAt: "2026-04-22T00:00:00.000Z",
        boardVoteCount: 5,
      }),
      makeLaunch({
        id: "free-c",
        toolId: "free-c",
        launchType: "FREE",
        launchDate: "2026-05-04T00:00:00.000Z",
        createdAt: "2026-04-23T00:00:00.000Z",
        boardVoteCount: 7,
      }),
      makeLaunch({
        id: "free-d",
        toolId: "free-d",
        launchType: "FREE",
        launchDate: "2026-05-04T00:00:00.000Z",
        createdAt: "2026-04-24T00:00:00.000Z",
        boardVoteCount: 0,
      }),
      makeLaunch({
        id: "free-e",
        toolId: "free-e",
        launchType: "FREE",
        launchDate: "2026-05-04T00:00:00.000Z",
        createdAt: "2026-04-25T00:00:00.000Z",
        boardVoteCount: 1,
      }),
    ]);

    expect(ranked.map((launch) => launch.id)).toEqual([
      "free-c",
      "free-b",
      "free-a",
      "free-e",
      "free-d",
    ]);
  });

  it("falls back to premium-first ordering when a fresh week has no votes yet", () => {
    const ranked = rankLaunchBoardLaunches([
      makeLaunch({
        id: "free-a",
        toolId: "free-a",
        launchType: "FREE",
        launchDate: "2026-05-04T00:00:00.000Z",
        createdAt: "2026-04-21T00:00:00.000Z",
        boardVoteCount: 0,
      }),
      makeLaunch({
        id: "premium-a",
        toolId: "premium-a",
        launchType: "FEATURED",
        launchDate: "2026-05-04T00:00:00.000Z",
        createdAt: "2026-04-18T00:00:00.000Z",
        boardVoteCount: 0,
      }),
      makeLaunch({
        id: "premium-b",
        toolId: "premium-b",
        launchType: "FEATURED",
        launchDate: "2026-05-11T00:00:00.000Z",
        createdAt: "2026-04-19T00:00:00.000Z",
        boardVoteCount: 0,
      }),
      makeLaunch({
        id: "free-b",
        toolId: "free-b",
        launchType: "FREE",
        launchDate: "2026-05-11T00:00:00.000Z",
        createdAt: "2026-04-20T00:00:00.000Z",
        boardVoteCount: 0,
      }),
    ]);

    expect(ranked.map((launch) => launch.id)).toEqual([
      "premium-a",
      "premium-b",
      "free-b",
      "free-a",
    ]);
  });
});
