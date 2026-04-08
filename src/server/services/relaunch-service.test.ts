import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, getToolByOwnerMock, getSubmissionByIdMock } = vi.hoisted(
  () => ({
    prismaMock: {
      submission: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    },
    getToolByOwnerMock: vi.fn(),
    getSubmissionByIdMock: vi.fn(),
  }),
);

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/repositories/tool-repository", () => ({
  getToolByOwner: getToolByOwnerMock,
}));

vi.mock("@/server/repositories/submission-repository", () => ({
  getSubmissionById: getSubmissionByIdMock,
}));

import { createRelaunchSubmission } from "@/server/services/relaunch-service";

describe("relaunch-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks relaunch drafts for tools without launch history", async () => {
    getToolByOwnerMock.mockResolvedValueOnce({
      id: "tool_1",
      slug: "acme",
      launches: [],
    });

    await expect(
      createRelaunchSubmission("tool_1", { id: "founder_1" }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Only launched products can be relaunched.",
    });
  });

  it("returns the existing relaunch draft when one is already open", async () => {
    getToolByOwnerMock.mockResolvedValueOnce({
      id: "tool_1",
      slug: "acme",
      launches: [
        {
          status: "LIVE",
          launchDate: new Date("2026-04-07T00:00:00.000Z"),
        },
      ],
    });
    prismaMock.submission.findFirst.mockResolvedValueOnce({
      id: "submission_1",
    });
    getSubmissionByIdMock.mockResolvedValueOnce({
      id: "submission_1",
      submissionType: "RELAUNCH",
    });

    const result = await createRelaunchSubmission("tool_1", {
      id: "founder_1",
    });

    expect(prismaMock.submission.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      id: "submission_1",
      submissionType: "RELAUNCH",
    });
  });
});
