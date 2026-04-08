import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  getSubmissionByIdMock,
  sendSubmissionApprovedEmailMessageMock,
  sendSubmissionRejectedEmailMessageMock,
  sendProductEmailSafelyMock,
  scheduleNextFreeLaunchDateMock,
} = vi.hoisted(() => ({
  prismaMock: {
    submission: {
      update: vi.fn(),
    },
    tool: {
      update: vi.fn(),
    },
    launch: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  getSubmissionByIdMock: vi.fn(),
  sendSubmissionApprovedEmailMessageMock: vi.fn(),
  sendSubmissionRejectedEmailMessageMock: vi.fn(),
  sendProductEmailSafelyMock: vi.fn(),
  scheduleNextFreeLaunchDateMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/repositories/submission-repository", () => ({
  getSubmissionById: getSubmissionByIdMock,
}));

vi.mock("@/server/email/transactional", () => ({
  sendSubmissionApprovedEmailMessage: sendSubmissionApprovedEmailMessageMock,
  sendSubmissionRejectedEmailMessage: sendSubmissionRejectedEmailMessageMock,
}));

vi.mock("@/server/services/submission-service-shared", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/services/submission-service-shared")>(
      "@/server/services/submission-service-shared",
    );

  return {
    ...actual,
    getDashboardUrl: () => "https://app.shipboost.test/dashboard",
    sendProductEmailSafely: sendProductEmailSafelyMock,
  };
});

vi.mock("@/server/services/launch-scheduling", () => ({
  DEFAULT_FREE_LAUNCH_SLOTS_PER_DAY: 10,
  scheduleNextFreeLaunchDate: scheduleNextFreeLaunchDateMock,
}));

import { reviewSubmission } from "@/server/services/submission-review-service";

describe("submission-review-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a relaunch record with LaunchType.RELAUNCH", async () => {
    const submission = {
      id: "submission_1",
      toolId: "tool_1",
      submissionType: "RELAUNCH",
      reviewStatus: "PENDING",
      preferredLaunchDate: new Date("2026-04-10T00:00:00.000Z"),
      user: {
        email: "founder@acme.com",
        name: "Founder",
      },
      tool: {
        name: "Acme",
        launches: [],
      },
    };

    getSubmissionByIdMock
      .mockResolvedValueOnce(submission)
      .mockResolvedValueOnce({
        ...submission,
        reviewStatus: "APPROVED",
        tool: {
          ...submission.tool,
          launches: [{ launchDate: new Date("2026-04-10T00:00:00.000Z") }],
        },
      });
    prismaMock.$transaction.mockImplementation(
      async (
        callback: (tx: {
          submission: typeof prismaMock.submission;
          tool: typeof prismaMock.tool;
          launch: typeof prismaMock.launch;
        }) => Promise<unknown>,
      ) =>
        callback({
          submission: {
            update: prismaMock.submission.update,
          },
        tool: {
          update: prismaMock.tool.update,
        },
        launch: {
          create: prismaMock.launch.create,
        },
        }),
    );
    sendSubmissionApprovedEmailMessageMock.mockReturnValue(Promise.resolve());
    sendProductEmailSafelyMock.mockResolvedValue(undefined);

    await reviewSubmission(
      "submission_1",
      {
        action: "APPROVE",
        founderVisibleNote: undefined,
        internalReviewNote: undefined,
        publishTool: true,
        goLiveNow: true,
      },
      "admin_1",
    );

    expect(prismaMock.launch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        toolId: "tool_1",
        createdById: "admin_1",
        launchType: "RELAUNCH",
      }),
    });
  });

  it("does not unpublish the existing tool when a relaunch is rejected", async () => {
    const submission = {
      id: "submission_2",
      toolId: "tool_2",
      submissionType: "RELAUNCH",
      reviewStatus: "PENDING",
      preferredLaunchDate: null,
      user: {
        email: "founder@acme.com",
        name: "Founder",
      },
      tool: {
        name: "Acme",
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
        launches: [],
      },
    };

    getSubmissionByIdMock
      .mockResolvedValueOnce(submission)
      .mockResolvedValueOnce({
        ...submission,
        reviewStatus: "REJECTED",
        founderVisibleNote: "Needs stronger update",
      });
    prismaMock.$transaction.mockImplementation(
      async (
        callback: (tx: {
          submission: typeof prismaMock.submission;
          tool: typeof prismaMock.tool;
          launch: typeof prismaMock.launch;
        }) => Promise<unknown>,
      ) =>
        callback({
          submission: {
            update: prismaMock.submission.update,
          },
          tool: {
            update: prismaMock.tool.update,
          },
          launch: {
            create: prismaMock.launch.create,
          },
        }),
    );
    sendSubmissionRejectedEmailMessageMock.mockReturnValue(Promise.resolve());
    sendProductEmailSafelyMock.mockResolvedValue(undefined);

    await reviewSubmission(
      "submission_2",
      {
        action: "REJECT",
        founderVisibleNote: "Needs stronger update",
        internalReviewNote: "keep listing live",
        publishTool: true,
        goLiveNow: true,
      },
      "admin_1",
    );

    expect(prismaMock.tool.update).toHaveBeenCalledWith({
      where: { id: "tool_2" },
      data: {
        internalNote: "keep listing live",
      },
    });
  });
});
