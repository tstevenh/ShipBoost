import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    launch: { findMany: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));

// getLaunchBoardWindow calls getLaunchpadGoLiveAtUtc which calls getEnv() and
// requires real DB env vars. Mock it with a fixed window instead.
vi.mock("@/server/services/launch-scheduling", () => ({
  getLaunchBoardWindow: vi.fn(() => ({
    windowStart: new Date("2026-06-01T00:00:00Z"),
    windowEnd: new Date("2026-06-07T23:59:59Z"),
  })),
}));

import { listCurrentWeekBoardToolIds } from "./launch-service";

describe("listCurrentWeekBoardToolIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns de-duplicated tool ids for the current week's board", async () => {
    prismaMock.launch.findMany.mockResolvedValueOnce([
      { toolId: "tool_a" },
      { toolId: "tool_b" },
      { toolId: "tool_a" },
    ]);

    const ids = await listCurrentWeekBoardToolIds(new Date("2026-06-03T00:00:00Z"));

    expect(ids.sort()).toEqual(["tool_a", "tool_b"]);
    expect(prismaMock.launch.findMany).toHaveBeenCalledTimes(1);
  });

  it("returns an empty array when the board is empty", async () => {
    prismaMock.launch.findMany.mockResolvedValueOnce([]);
    expect(await listCurrentWeekBoardToolIds(new Date("2026-06-03T00:00:00Z"))).toEqual([]);
  });
});
