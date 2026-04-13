import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  getSubmissionByIdMock,
  getSubmissionByIdForFounderMock,
  getPolarClientMock,
  sendFeaturedLaunchPaidEmailMessageMock,
  sendProductEmailSafelyMock,
} = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    submission: {
      findFirst: vi.fn(),
    },
  },
  getSubmissionByIdMock: vi.fn(),
  getSubmissionByIdForFounderMock: vi.fn(),
  getPolarClientMock: vi.fn(),
  sendFeaturedLaunchPaidEmailMessageMock: vi.fn(),
  sendProductEmailSafelyMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/repositories/submission-repository", () => ({
  getSubmissionById: getSubmissionByIdMock,
  getSubmissionByIdForFounder: getSubmissionByIdForFounderMock,
}));

vi.mock("@/server/polar", () => ({
  getPolarClient: getPolarClientMock,
  getPolarCheckoutUrls: vi.fn(),
}));

vi.mock("@/server/email/transactional", () => ({
  sendFeaturedLaunchPaidEmailMessage: sendFeaturedLaunchPaidEmailMessageMock,
}));

vi.mock("@/server/services/launch-scheduling", () => ({
  getLaunchpadGoLiveAtUtc: () => new Date("2026-05-01T00:00:00.000Z"),
  isAnchoredLaunchWeekStart: (date: Date, options?: { goLiveAt?: Date }) => {
    const launchpadGoLiveAt =
      options?.goLiveAt ?? new Date("2026-05-01T00:00:00.000Z");
    const normalized = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    return (
      normalized.getTime() >= launchpadGoLiveAt.getTime() &&
      (normalized.getTime() - launchpadGoLiveAt.getTime()) %
        (7 * 24 * 60 * 60 * 1000) ===
        0
    );
  },
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

import {
  handleFeaturedLaunchOrderPaid,
  reconcileFeaturedLaunchCheckout,
  rescheduleFeaturedLaunch,
} from "@/server/services/submission-payment-service";

type PaymentTx = {
  submission: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  tool: {
    update: ReturnType<typeof vi.fn>;
  };
  launch: {
    create: ReturnType<typeof vi.fn>;
  };
};

describe("submission-payment-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendFeaturedLaunchPaidEmailMessageMock.mockReturnValue(Promise.resolve());
    sendProductEmailSafelyMock.mockResolvedValue(undefined);
  });

  it("matches order.paid to a submission by checkoutId when metadata is missing", async () => {
    const submission = {
      id: "submission_1",
      toolId: "tool_1",
      userId: "founder_1",
      submissionType: "FEATURED_LAUNCH",
      preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
      paymentStatus: "PENDING",
      polarCheckoutId: "checkout_1",
      tool: {
        launches: [],
      },
    };
    const updatedSubmission = {
      ...submission,
      paymentStatus: "PAID",
      user: {
        email: "founder@acme.com",
        name: "Founder",
      },
      tool: {
        ...submission.tool,
        name: "Acme",
        launches: [
          {
            launchType: "FEATURED",
            launchDate: new Date("2026-05-08T00:00:00.000Z"),
          },
        ],
      },
    };

    prismaMock.$transaction.mockImplementationOnce(
      async (callback: (tx: PaymentTx) => Promise<unknown>) => {
        const tx: PaymentTx = {
          submission: {
            findUnique: vi.fn().mockResolvedValue(null),
            findFirst: vi.fn().mockResolvedValue(submission),
            update: vi.fn(),
          },
          tool: {
            update: vi.fn(),
          },
          launch: {
            create: vi.fn(),
          },
        };
        await callback(tx);
        expect(tx.submission.findFirst).toHaveBeenCalledWith({
          where: {
            polarCheckoutId: "checkout_1",
          },
          include: {
            tool: {
              include: {
                launches: true,
              },
            },
          },
        });
        expect(tx.submission.update).toHaveBeenCalledWith({
          where: { id: "submission_1" },
          data: expect.objectContaining({
            paymentStatus: "PAID",
            polarOrderId: "order_1",
            polarCheckoutId: "checkout_1",
            reviewStatus: "APPROVED",
          }),
        });
        return updatedSubmission;
      },
    );
    getSubmissionByIdMock.mockResolvedValueOnce(updatedSubmission);

    await handleFeaturedLaunchOrderPaid({
      data: {
        id: "order_1",
        checkoutId: "checkout_1",
        metadata: {},
      },
    } as never);
  });

  it("reconciles a successful checkout from checkoutId on dashboard return", async () => {
    const submission = {
      id: "submission_1",
      toolId: "tool_1",
      userId: "founder_1",
      submissionType: "FEATURED_LAUNCH",
      preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
      paymentStatus: "PENDING",
      polarCheckoutId: "checkout_1",
      tool: {
        launches: [],
      },
    };
    const updatedSubmission = {
      ...submission,
      paymentStatus: "PAID",
      user: {
        email: "founder@acme.com",
        name: "Founder",
      },
      tool: {
        ...submission.tool,
        name: "Acme",
        launches: [],
      },
    };

    prismaMock.submission.findFirst
      .mockResolvedValueOnce({
        id: "submission_1",
        paymentStatus: "PENDING",
        polarOrderId: null,
      })
      .mockResolvedValueOnce(null);

    const order = {
      id: "order_1",
      paid: true,
      checkoutId: "checkout_1",
      metadata: {},
    };
    getPolarClientMock.mockReturnValue({
      orders: {
        list: vi.fn().mockResolvedValue({
          result: {
            items: [order],
          },
        }),
      },
    });
    prismaMock.$transaction.mockImplementationOnce(
      async (callback: (tx: PaymentTx) => Promise<unknown>) => {
        const tx: PaymentTx = {
          submission: {
            findUnique: vi.fn().mockResolvedValue(null),
            findFirst: vi.fn().mockResolvedValue(submission),
            update: vi.fn(),
          },
          tool: {
            update: vi.fn(),
          },
          launch: {
            create: vi.fn(),
          },
        };
        await callback(tx);
        return "submission_1";
      },
    );
    getSubmissionByIdMock.mockResolvedValueOnce(updatedSubmission);

    const result = await reconcileFeaturedLaunchCheckout("checkout_1");

    expect(getPolarClientMock).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: "submission_1",
      paymentStatus: "PAID",
    });
  });

  it("rejects premium launch dates before the launchpad go-live date", async () => {
    getSubmissionByIdForFounderMock.mockResolvedValueOnce({
      id: "submission_1",
      toolId: "tool_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
      tool: {
        launches: [
          {
            id: "launch_1",
            launchType: "FEATURED",
            status: "APPROVED",
            launchDate: new Date("2026-05-08T00:00:00.000Z"),
          },
        ],
      },
    });

    await expect(
      rescheduleFeaturedLaunch(
        "submission_1",
        {
          preferredLaunchDate: new Date("2026-04-28T00:00:00.000Z"),
        },
        { id: "founder_1" },
      ),
    ).rejects.toThrow("Choose May 1, 2026 UTC or later.");
  });

  it("rejects premium launch dates that are not aligned to launch week boundaries", async () => {
    getSubmissionByIdForFounderMock.mockResolvedValueOnce({
      id: "submission_1",
      toolId: "tool_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
      tool: {
        launches: [
          {
            id: "launch_1",
            launchType: "FEATURED",
            status: "APPROVED",
            launchDate: new Date("2026-05-08T00:00:00.000Z"),
          },
        ],
      },
    });

    await expect(
      rescheduleFeaturedLaunch(
        "submission_1",
        {
          preferredLaunchDate: new Date("2026-05-10T00:00:00.000Z"),
        },
        { id: "founder_1" },
      ),
    ).rejects.toThrow("Choose one of the available weekly launch windows.");
  });
});
