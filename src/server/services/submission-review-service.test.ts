import { beforeEach, describe, expect, it, vi } from "vitest";

import { formatLaunchDateForEmail } from "@/server/services/submission-service-shared";

const {
  prismaMock,
  getSubmissionByIdMock,
  sendSubmissionApprovedEmailMessageMock,
  sendSubmissionRejectedEmailMessageMock,
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

vi.mock("@/server/env", () => ({
  getEnv: () => ({
    FREE_LAUNCH_SLOTS_PER_WEEK: 10,
  }),
}));

vi.mock("@/server/services/submission-service-shared", async () => {
  const actual =
    await vi.importActual<typeof import("@/server/services/submission-service-shared")>(
      "@/server/services/submission-service-shared",
    );

  return {
    ...actual,
    getDashboardUrl: () => "https://app.shipboost.test/dashboard",
  };
});

vi.mock("@/server/services/launch-scheduling", () => ({
  getLaunchpadGoLiveAtUtc: () => new Date("2026-05-04T00:00:00.000Z"),
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
        id: "user_1",
        email: "founder@acme.com",
        name: "Founder",
      },
      paymentStatus: "NOT_REQUIRED",
      badgeFooterUrl: null,
      badgeVerification: "NOT_REQUIRED",
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      tool: {
        id: "tool_1",
        slug: "acme",
        name: "Acme",
        tagline: "Ship faster",
        websiteUrl: "https://acme.test",
        logoMedia: null,
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
        launches: [],
      },
    };

    getSubmissionByIdMock.mockResolvedValueOnce(submission);
    prismaMock.launch.create.mockResolvedValue({
      id: "launch_1",
      launchType: "RELAUNCH",
      status: "LIVE",
      launchDate: new Date("2026-04-10T00:00:00.000Z"),
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
    const result = await reviewSubmission(
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

    expect(prismaMock.launch.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          toolId: "tool_1",
          createdById: "admin_1",
          launchType: "RELAUNCH",
        }),
      }),
    );
    expect(sendSubmissionApprovedEmailMessageMock).not.toHaveBeenCalled();

    sendSubmissionApprovedEmailMessageMock.mockReturnValue(Promise.resolve());
    await result.emailTask();

    expect(sendSubmissionApprovedEmailMessageMock).toHaveBeenCalledWith({
      to: "founder@acme.com",
      name: "Founder",
      dashboardUrl: "https://app.shipboost.test/dashboard",
      toolName: "Acme",
      launchDate: formatLaunchDateForEmail(
        new Date("2026-04-10T00:00:00.000Z"),
      ),
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
        id: "user_2",
        email: "founder@acme.com",
        name: "Founder",
      },
      paymentStatus: "NOT_REQUIRED",
      badgeFooterUrl: null,
      badgeVerification: "NOT_REQUIRED",
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      tool: {
        id: "tool_2",
        slug: "acme",
        name: "Acme",
        tagline: "Ship faster",
        websiteUrl: "https://acme.test",
        logoMedia: null,
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
        launches: [],
      },
    };

    getSubmissionByIdMock.mockResolvedValueOnce(submission);
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
    const result = await reviewSubmission(
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
    expect(sendSubmissionRejectedEmailMessageMock).not.toHaveBeenCalled();

    sendSubmissionRejectedEmailMessageMock.mockReturnValue(Promise.resolve());
    await result.emailTask();

    expect(sendSubmissionRejectedEmailMessageMock).toHaveBeenCalledWith({
      to: "founder@acme.com",
      name: "Founder",
      dashboardUrl: "https://app.shipboost.test/dashboard",
      toolName: "Acme",
      founderVisibleNote: "Needs stronger update",
    });
  });

  it("schedules approved free launches into the next weekly slot", async () => {
    const submission = {
      id: "submission_3",
      toolId: "tool_3",
      submissionType: "FREE_LAUNCH",
      reviewStatus: "PENDING",
      preferredLaunchDate: null,
      user: {
        id: "user_3",
        email: "founder@acme.com",
        name: "Founder",
      },
      paymentStatus: "NOT_REQUIRED",
      badgeFooterUrl: null,
      badgeVerification: "VERIFIED",
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
      tool: {
        id: "tool_3",
        slug: "acme-free",
        name: "Acme Free",
        tagline: "Ship faster",
        websiteUrl: "https://acme.test",
        logoMedia: null,
        publicationStatus: "UNPUBLISHED",
        moderationStatus: "PENDING",
        launches: [],
      },
    };

    getSubmissionByIdMock.mockResolvedValueOnce(submission);
    scheduleNextFreeLaunchDateMock.mockResolvedValueOnce(
      new Date("2026-05-04T00:00:00.000Z"),
    );
    prismaMock.launch.create.mockResolvedValue({
      id: "launch_free_1",
      launchType: "FREE",
      status: "APPROVED",
      launchDate: new Date("2026-05-04T00:00:00.000Z"),
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

    await reviewSubmission(
      "submission_3",
      {
        action: "APPROVE",
        founderVisibleNote: undefined,
        internalReviewNote: undefined,
        publishTool: true,
        goLiveNow: true,
      },
      "admin_1",
    );

    expect(scheduleNextFreeLaunchDateMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        weeklySlots: 10,
        fromDate: expect.any(Date),
      }),
    );
  });
});
