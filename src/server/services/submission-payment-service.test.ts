import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  capturePostHogEventSafelyMock,
  prismaMock,
  getEnvMock,
  getSubmissionByIdMock,
  getSubmissionByIdForFounderMock,
  getDodoClientMock,
  getDodoDashboardReturnUrlMock,
  sendPremiumLaunchPaidEmailMessageMock,
  sendProductEmailSafelyMock,
} = vi.hoisted(() => ({
  capturePostHogEventSafelyMock: vi.fn(),
  prismaMock: {
    $transaction: vi.fn(),
    submission: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    submissionSpotlightBrief: {
      upsert: vi.fn(),
    },
  },
  getEnvMock: vi.fn(),
  getSubmissionByIdMock: vi.fn(),
  getSubmissionByIdForFounderMock: vi.fn(),
  getDodoClientMock: vi.fn(),
  getDodoDashboardReturnUrlMock: vi.fn(),
  sendPremiumLaunchPaidEmailMessageMock: vi.fn(),
  sendProductEmailSafelyMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/env", () => ({
  getEnv: getEnvMock,
}));

vi.mock("@/server/repositories/submission-repository", () => ({
  getSubmissionById: getSubmissionByIdMock,
  getSubmissionByIdForFounder: getSubmissionByIdForFounderMock,
}));

vi.mock("@/server/dodo", () => ({
  getDodoClient: getDodoClientMock,
  getDodoDashboardReturnUrl: getDodoDashboardReturnUrlMock,
}));

vi.mock("@/server/email/transactional", () => ({
  sendPremiumLaunchPaidEmailMessage: sendPremiumLaunchPaidEmailMessageMock,
}));

vi.mock("@/server/posthog", () => ({
  capturePostHogEventSafely: capturePostHogEventSafelyMock,
}));

vi.mock("@/server/services/launch-scheduling", () => ({
  getLaunchpadGoLiveAtUtc: () => new Date("2026-05-04T00:00:00.000Z"),
  isAnchoredLaunchWeekStart: (date: Date, options?: { goLiveAt?: Date }) => {
    const launchpadGoLiveAt =
      options?.goLiveAt ?? new Date("2026-05-04T00:00:00.000Z");
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
    await vi.importActual<
      typeof import("@/server/services/submission-service-shared")
    >("@/server/services/submission-service-shared");

  return {
    ...actual,
    getDashboardUrl: () => "https://app.shipboost.test/dashboard",
    sendProductEmailSafely: sendProductEmailSafelyMock,
  };
});

import {
  createPremiumLaunchCheckout,
  handlePremiumLaunchPaymentSucceeded,
  handlePremiumLaunchRefundSucceeded,
  reconcilePremiumLaunchPayment,
  reschedulePremiumLaunch,
} from "@/server/services/submission-payment-service";

type PaymentTx = {
  submission: {
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  submissionSpotlightBrief: {
    upsert: ReturnType<typeof vi.fn>;
  };
  tool: {
    update: ReturnType<typeof vi.fn>;
  };
  launch: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe("submission-payment-service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T00:00:00.000Z"));
    vi.clearAllMocks();
    getEnvMock.mockReturnValue({
      DODO_PREMIUM_LAUNCH_PRODUCT_ID: "prod_premium_1",
    });
    sendPremiumLaunchPaidEmailMessageMock.mockReturnValue(Promise.resolve());
    sendProductEmailSafelyMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a Dodo checkout session and stores the checkout session id", async () => {
    getSubmissionByIdForFounderMock.mockResolvedValueOnce({
      id: "submission_1",
      toolId: "tool_1",
      submissionType: "FEATURED_LAUNCH",
      preferredLaunchDate: new Date("2026-05-11T00:00:00.000Z"),
      paymentStatus: "PENDING",
      reviewStatus: "DRAFT",
    });
    getDodoDashboardReturnUrlMock.mockReturnValue(
      "https://shipboost.io/dashboard?checkout=success&submission_id=submission_1",
    );

    const createMock = vi.fn().mockResolvedValue({
      session_id: "cs_test_1",
      checkout_url: "https://checkout.dodopayments.com/session/cs_test_1",
    });

    getDodoClientMock.mockReturnValue({
      checkoutSessions: {
        create: createMock,
      },
    });

    const result = await createPremiumLaunchCheckout("submission_1", {
      id: "founder_1",
      email: "founder@acme.com",
      name: "Founder",
    });

    expect(createMock).toHaveBeenCalledWith({
      product_cart: [{ product_id: "prod_premium_1", quantity: 1 }],
      customer: {
        email: "founder@acme.com",
        name: "Founder",
      },
      return_url:
        "https://shipboost.io/dashboard?checkout=success&submission_id=submission_1",
      metadata: {
        shipboostSubmissionId: "submission_1",
        shipboostToolId: "tool_1",
        shipboostSubmissionType: "FEATURED_LAUNCH",
        shipboostPreferredLaunchDate: "2026-05-11T00:00:00.000Z",
      },
    });
    expect(prismaMock.submission.update).toHaveBeenCalledWith({
      where: { id: "submission_1" },
      data: {
        polarCheckoutId: "cs_test_1",
        paymentStatus: "PENDING",
      },
    });
    expect(result).toEqual({
      checkoutUrl: "https://checkout.dodopayments.com/session/cs_test_1",
      checkoutId: "cs_test_1",
    });
  });

  it("matches payment.succeeded to a submission by checkout session id when metadata is missing", async () => {
    const submission = {
      id: "submission_1",
      toolId: "tool_1",
      userId: "founder_1",
      submissionType: "FEATURED_LAUNCH",
      preferredLaunchDate: new Date("2026-05-11T00:00:00.000Z"),
      paymentStatus: "PENDING",
      polarCheckoutId: "cs_test_1",
      tool: {
        launches: [],
      },
    };
    const updatedSubmission = {
      ...submission,
      paymentStatus: "PAID",
      user: {
        id: "founder_1",
        email: "founder@acme.com",
        name: "Founder",
      },
      tool: {
        ...submission.tool,
        id: "tool_1",
        name: "Acme",
        launches: [
          {
            launchType: "FEATURED",
            launchDate: new Date("2026-05-11T00:00:00.000Z"),
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
          submissionSpotlightBrief: {
            upsert: vi.fn(),
          },
          tool: {
            update: vi.fn(),
          },
          launch: {
            create: vi.fn(),
            update: vi.fn(),
          },
        };
        const result = await callback(tx);
        expect(result).toBe("submission_1");
        expect(tx.submission.findFirst).toHaveBeenCalledWith({
          where: {
            polarCheckoutId: "cs_test_1",
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
            polarOrderId: "pay_1",
            polarCheckoutId: "cs_test_1",
            reviewStatus: "APPROVED",
          }),
        });
        expect(tx.submissionSpotlightBrief.upsert).toHaveBeenCalledWith({
          where: { submissionId: "submission_1" },
          update: {},
          create: {
            submissionId: "submission_1",
            status: "NOT_STARTED",
          },
        });
        return result;
      },
    );
    getSubmissionByIdMock.mockResolvedValueOnce(updatedSubmission);

    await handlePremiumLaunchPaymentSucceeded({
      paymentId: "pay_1",
      checkoutSessionId: "cs_test_1",
      metadata: {},
    });

    expect(sendProductEmailSafelyMock).toHaveBeenCalledTimes(1);
    expect(capturePostHogEventSafelyMock).toHaveBeenCalledWith(
      {
        distinctId: "founder_1",
        event: "premium_launch_paid",
        properties: {
          submission_id: "submission_1",
          tool_id: "tool_1",
          tool_slug: undefined,
          tool_name: "Acme",
          payment_id: "pay_1",
          checkout_session_id: "cs_test_1",
          launch_date: "2026-05-11T00:00:00.000Z",
        },
      },
      "handlePremiumLaunchPaymentSucceeded",
    );
  });

  it("reconciles a successful Dodo payment from dashboard return parameters", async () => {
    const submission = {
      id: "submission_1",
      toolId: "tool_1",
      userId: "founder_1",
      submissionType: "FEATURED_LAUNCH",
      preferredLaunchDate: new Date("2026-05-11T00:00:00.000Z"),
      paymentStatus: "PENDING",
      polarCheckoutId: "cs_test_1",
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

    prismaMock.submission.findUnique.mockResolvedValueOnce({
      id: "submission_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PENDING",
      polarOrderId: null,
    });

    const retrieveMock = vi.fn().mockResolvedValue({
      payment_id: "pay_1",
      status: "succeeded",
      checkout_session_id: "cs_test_1",
      metadata: {
        shipboostSubmissionId: "submission_1",
      },
    });
    getDodoClientMock.mockReturnValue({
      payments: {
        retrieve: retrieveMock,
      },
    });

    prismaMock.$transaction.mockImplementationOnce(
      async (callback: (tx: PaymentTx) => Promise<unknown>) => {
        const tx: PaymentTx = {
          submission: {
            findUnique: vi.fn().mockResolvedValue(submission),
            findFirst: vi.fn().mockResolvedValue(null),
            update: vi.fn(),
          },
          submissionSpotlightBrief: {
            upsert: vi.fn(),
          },
          tool: {
            update: vi.fn(),
          },
          launch: {
            create: vi.fn(),
            update: vi.fn(),
          },
        };
        const result = await callback(tx);
        expect(result).toBe("submission_1");
        return result;
      },
    );
    getSubmissionByIdMock.mockResolvedValueOnce(updatedSubmission);

    const result = await reconcilePremiumLaunchPayment({
      submissionId: "submission_1",
      paymentId: "pay_1",
    });

    expect(retrieveMock).toHaveBeenCalledWith("pay_1");
    expect(result).toMatchObject({
      id: "submission_1",
      paymentStatus: "PAID",
    });
  });

  it("marks the submission refunded from a Dodo refund event", async () => {
    await handlePremiumLaunchRefundSucceeded({
      paymentId: "pay_1",
    });

    expect(prismaMock.submission.updateMany).toHaveBeenCalledWith({
      where: { polarOrderId: "pay_1" },
      data: { paymentStatus: "REFUNDED" },
    });
  });

  it("rejects premium launch dates before the launchpad go-live date", async () => {
    getSubmissionByIdForFounderMock.mockResolvedValueOnce({
      id: "submission_1",
      toolId: "tool_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      preferredLaunchDate: new Date("2026-05-11T00:00:00.000Z"),
      tool: {
        launches: [
          {
            id: "launch_1",
            launchType: "FEATURED",
            status: "APPROVED",
            launchDate: new Date("2026-05-11T00:00:00.000Z"),
          },
        ],
      },
    });

    await expect(
      reschedulePremiumLaunch(
        "submission_1",
        {
          preferredLaunchDate: new Date("2026-04-28T00:00:00.000Z"),
        },
        { id: "founder_1" },
      ),
    ).rejects.toThrow("Choose May 4, 2026 UTC or later.");
  });

  it("rejects premium launch dates that are not aligned to launch week boundaries", async () => {
    getSubmissionByIdForFounderMock.mockResolvedValueOnce({
      id: "submission_1",
      toolId: "tool_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      preferredLaunchDate: new Date("2026-05-11T00:00:00.000Z"),
      tool: {
        launches: [
          {
            id: "launch_1",
            launchType: "FEATURED",
            status: "APPROVED",
            launchDate: new Date("2026-05-11T00:00:00.000Z"),
          },
        ],
      },
    });

    await expect(
      reschedulePremiumLaunch(
        "submission_1",
        {
          preferredLaunchDate: new Date("2026-05-10T00:00:00.000Z"),
        },
        { id: "founder_1" },
      ),
    ).rejects.toThrow("Choose one of the available weekly launch windows.");
  });
});
