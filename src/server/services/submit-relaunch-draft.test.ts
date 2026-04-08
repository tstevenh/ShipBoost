import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  getSubmissionByIdForFounderMock,
  getSubmissionByIdMock,
  sendSubmissionReceivedEmailMessageMock,
  sendProductEmailSafelyMock,
} = vi.hoisted(() => ({
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
  getSubmissionByIdMock: vi.fn(),
  sendSubmissionReceivedEmailMessageMock: vi.fn(),
  sendProductEmailSafelyMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/repositories/submission-repository", () => ({
  getSubmissionByIdForFounder: getSubmissionByIdForFounderMock,
  getSubmissionById: getSubmissionByIdMock,
}));

vi.mock("@/server/email/transactional", () => ({
  sendSubmissionReceivedEmailMessage: sendSubmissionReceivedEmailMessageMock,
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

import { submitSubmissionDraft } from "@/server/services/submission-draft-service";

describe("submit-relaunch-draft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the existing listing public when submitting a relaunch draft", async () => {
    const submission = {
      id: "submission_1",
      toolId: "tool_1",
      submissionType: "RELAUNCH",
      reviewStatus: "DRAFT",
      badgeVerification: "NOT_REQUIRED",
      user: {
        email: "founder@acme.com",
        name: "Founder",
      },
      tool: {
        id: "tool_1",
        name: "Acme",
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
    getSubmissionByIdMock.mockResolvedValueOnce({
      ...submission,
      reviewStatus: "PENDING",
    });
    sendSubmissionReceivedEmailMessageMock.mockReturnValue(Promise.resolve());
    sendProductEmailSafelyMock.mockResolvedValue(undefined);

    await submitSubmissionDraft("submission_1", {
      id: "founder_1",
    });

    expect(prismaMock.submission.update).toHaveBeenCalledWith({
      where: { id: "submission_1" },
      data: {
        reviewStatus: "PENDING",
      },
    });
    expect(prismaMock.tool.update).not.toHaveBeenCalled();
  });
});
