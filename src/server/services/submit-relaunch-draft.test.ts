import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  capturePostHogEventSafelyMock,
  prismaMock,
  getSubmissionByIdForFounderMock,
  sendSubmissionReceivedEmailMessageMock,
} = vi.hoisted(() => ({
  capturePostHogEventSafelyMock: vi.fn(),
  prismaMock: {
    $transaction: vi.fn(),
    submission: {
      update: vi.fn(),
    },
    tool: {
      update: vi.fn(),
    },
  },
  getSubmissionByIdForFounderMock: vi.fn(),
  sendSubmissionReceivedEmailMessageMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/repositories/submission-repository", () => ({
  getSubmissionByIdForFounder: getSubmissionByIdForFounderMock,
}));

vi.mock("@/server/email/transactional", () => ({
  sendSubmissionReceivedEmailMessage: sendSubmissionReceivedEmailMessageMock,
}));

vi.mock("@/server/posthog", () => ({
  capturePostHogEventSafely: capturePostHogEventSafelyMock,
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

import { submitSubmissionDraft } from "@/server/services/submission-draft-service";

describe("submit-relaunch-draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the existing listing public when submitting a relaunch draft", async () => {
    const submission = {
      id: "submission_1",
      toolId: "tool_1",
      userId: "founder_1",
      submissionType: "RELAUNCH",
      reviewStatus: "DRAFT",
      badgeVerification: "NOT_REQUIRED",
      user: {
        email: "founder@acme.com",
        name: "Founder",
      },
      tool: {
        id: "tool_1",
        slug: "acme",
        name: "Acme",
        affiliateUrl: "https://partner.example/acme",
        toolCategories: [{ categoryId: "cat_1" }],
        toolTags: [{ tagId: "tag_1" }, { tagId: "tag_2" }],
        launches: [],
      },
    };

    getSubmissionByIdForFounderMock.mockResolvedValueOnce(submission);
    prismaMock.$transaction.mockImplementation(
      async (
        callback: (tx: {
          submission: typeof prismaMock.submission;
          tool: typeof prismaMock.tool;
        }) => Promise<unknown>,
      ) =>
        callback({
          submission: {
            update: prismaMock.submission.update,
          },
          tool: {
            update: prismaMock.tool.update,
          },
        }),
    );
    sendSubmissionReceivedEmailMessageMock.mockReturnValue(Promise.resolve());
    const result = await submitSubmissionDraft("submission_1", {
      id: "founder_1",
    });

    expect(prismaMock.submission.update).toHaveBeenCalledWith({
      where: { id: "submission_1" },
      data: {
        reviewStatus: "PENDING",
      },
    });
    expect(prismaMock.tool.update).not.toHaveBeenCalled();
    expect(sendSubmissionReceivedEmailMessageMock).not.toHaveBeenCalled();
    expect(capturePostHogEventSafelyMock).toHaveBeenCalledWith(
      {
        distinctId: "founder_1",
        event: "tool_submission_completed",
        properties: {
          submission_id: "submission_1",
          submission_type: "RELAUNCH",
          tool_id: "tool_1",
          tool_slug: "acme",
          tool_name: "Acme",
          has_affiliate_url: true,
          category_count: 1,
          tag_count: 2,
        },
      },
      "submitSubmissionDraft",
    );

    sendSubmissionReceivedEmailMessageMock.mockReturnValue(Promise.resolve());
    await result.emailTask();

    expect(sendSubmissionReceivedEmailMessageMock).toHaveBeenCalledWith({
      to: "founder@acme.com",
      name: "Founder",
      dashboardUrl: "https://app.shipboost.test/dashboard",
      toolName: "Acme",
      submissionType: "RELAUNCH",
      preferredLaunchDate: null,
    });
  });
});
