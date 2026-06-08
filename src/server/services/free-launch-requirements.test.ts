import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { submission: { findFirst: vi.fn() } },
}));
vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));

const listLaunchBoard = vi.fn();
const listUserUpvotedToolIds = vi.fn();
const recordUpvoteWithoutDailyLimit = vi.fn();
vi.mock("@/server/services/launch-service", () => ({ listLaunchBoard: (...a: unknown[]) => listLaunchBoard(...a) }));
vi.mock("@/server/services/upvote-service", () => ({
  listUserUpvotedToolIds: (...a: unknown[]) => listUserUpvotedToolIds(...a),
  recordUpvoteWithoutDailyLimit: (...a: unknown[]) => recordUpvoteWithoutDailyLimit(...a),
}));

import { castLaunchRequirementVote, getFreeLaunchRequirements } from "./free-launch-requirements";

const board = [
  { tool: { id: "own", slug: "own", name: "Own", tagline: "", logoMedia: null, upvoteCount: 0 } },
  { tool: { id: "a", slug: "a", name: "A", tagline: "ta", logoMedia: { url: "u" }, upvoteCount: 5 } },
  { tool: { id: "b", slug: "b", name: "B", tagline: "tb", logoMedia: null, upvoteCount: 2 } },
];

describe("getFreeLaunchRequirements", () => {
  beforeEach(() => vi.clearAllMocks());

  it("excludes the own tool, marks upvoted, and computes required=min(3,available)", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({
      id: "s1", toolId: "own", submissionType: "FREE_LAUNCH", badgeVerification: "PENDING",
    });
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce(["a"]);

    const r = await getFreeLaunchRequirements("s1", { id: "u1" });

    expect(r.boardTools.map((t) => t.id)).toEqual(["a", "b"]);
    expect(r.boardTools.find((t) => t.id === "a")?.hasUpvoted).toBe(true);
    expect(r.requiredCount).toBe(2);
    expect(r.eligibleCount).toBe(1);
    expect(r.badgeVerification).toBe("PENDING");
  });

  it("allows an unpaid premium checkout draft to switch back to free requirements", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({
      id: "s1",
      toolId: "own",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PENDING",
      badgeVerification: "NOT_REQUIRED",
    });
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce([]);

    const r = await getFreeLaunchRequirements("s1", { id: "u1" });

    expect(r.badgeVerification).toBe("PENDING");
    expect(r.requiredCount).toBe(2);
  });

  it("rejects a paid premium launch from free requirements", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({
      id: "s1",
      toolId: "own",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      badgeVerification: "NOT_REQUIRED",
    });

    await expect(getFreeLaunchRequirements("s1", { id: "u1" })).rejects.toThrow(
      "Premium launches do not use the free-launch requirements.",
    );
  });
});

describe("castLaunchRequirementVote", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects voting on a tool not on the board", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({ id: "s1", toolId: "own", submissionType: "FREE_LAUNCH", badgeVerification: "PENDING" });
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce([]);
    await expect(castLaunchRequirementVote("s1", "not-on-board", { id: "u1" })).rejects.toThrow();
  });

  it("rejects voting on the founder's own tool", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({ id: "s1", toolId: "own", submissionType: "FREE_LAUNCH", badgeVerification: "PENDING" });
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce([]);
    await expect(castLaunchRequirementVote("s1", "own", { id: "u1" })).rejects.toThrow();
  });

  it("records the vote and returns the updated eligible count", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({ id: "s1", toolId: "own", submissionType: "FREE_LAUNCH", badgeVerification: "PENDING" });
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce([]);
    recordUpvoteWithoutDailyLimit.mockResolvedValueOnce(undefined);
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce(["a"]);

    const r = await castLaunchRequirementVote("s1", "a", { id: "u1" });
    expect(recordUpvoteWithoutDailyLimit).toHaveBeenCalledWith("a", "u1");
    expect(r.eligibleCount).toBe(1);
    expect(r.requiredCount).toBe(2);
  });
});
