import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  dodoMock,
  getLaunchVideoOfferMock,
  createPendingLaunchVideoOrderMock,
  cancelPendingLaunchVideoOrderMock,
  attachLaunchVideoCheckoutSessionMock,
  handleLaunchVideoPaymentSucceededMock,
} = vi.hoisted(() => ({
  prismaMock: {
    submission: { findFirst: vi.fn() },
    launchVideoOrder: { findFirst: vi.fn(), updateMany: vi.fn() },
  },
  dodoMock: {
    checkoutSessions: { create: vi.fn() },
    payments: { retrieve: vi.fn() },
  },
  getLaunchVideoOfferMock: vi.fn(),
  createPendingLaunchVideoOrderMock: vi.fn(),
  cancelPendingLaunchVideoOrderMock: vi.fn(),
  attachLaunchVideoCheckoutSessionMock: vi.fn(),
  handleLaunchVideoPaymentSucceededMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));
vi.mock("@/server/dodo", () => ({ getDodoClient: () => dodoMock }));
vi.mock("@/server/env", () => ({
  getEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://shipboost.io" }),
}));
vi.mock("@/server/services/launch-video-service", () => ({
  getLaunchVideoOffer: getLaunchVideoOfferMock,
  createPendingLaunchVideoOrder: createPendingLaunchVideoOrderMock,
  cancelPendingLaunchVideoOrder: cancelPendingLaunchVideoOrderMock,
  attachLaunchVideoCheckoutSession: attachLaunchVideoCheckoutSessionMock,
  handleLaunchVideoPaymentSucceeded: handleLaunchVideoPaymentSucceededMock,
}));

import {
  createLaunchVideoCheckout,
  reconcileLaunchVideoPayment,
} from "@/server/services/launch-video-checkout-service";

const founder = { id: "user_1", email: "founder@example.com", name: "Ana" };

function submission(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_1",
    submissionType: "FEATURED_LAUNCH",
    paymentStatus: "PAID",
    launchVideoOrders: [],
    tool: {
      name: "Acme",
      launches: [
        {
          launchType: "FEATURED",
          status: "APPROVED",
          launchDate: new Date("2099-10-19T00:00:00.000Z"),
        },
      ],
    },
    ...overrides,
  };
}

describe("launch-video-checkout-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLaunchVideoOfferMock.mockResolvedValue({
      available: true,
      priceUsd: { premium: 99, standalone: 129 },
      launchPriceSpotsLeft: 10,
      demo: null,
    });
    createPendingLaunchVideoOrderMock.mockResolvedValue({
      order: { id: "lvo_1" },
      productId: "pdt_launch_video",
    });
    dodoMock.checkoutSessions.create.mockResolvedValue({
      checkout_url: "https://checkout.dodo/abc",
      session_id: "cks_1",
    });
  });

  describe("createLaunchVideoCheckout", () => {
    it("opens a video-only checkout for the Premium launch week", async () => {
      prismaMock.submission.findFirst.mockResolvedValue(submission());

      await expect(
        createLaunchVideoCheckout({ submissionId: "sub_1", founder }),
      ).resolves.toEqual({ checkoutUrl: "https://checkout.dodo/abc" });

      expect(prismaMock.submission.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "sub_1", userId: "user_1" } }),
      );
      expect(prismaMock.launchVideoOrder.updateMany).toHaveBeenCalledWith({
        where: { submissionId: "sub_1", status: "PENDING" },
        data: { status: "CANCELED" },
      });
      expect(createPendingLaunchVideoOrderMock).toHaveBeenCalledWith({
        mode: "premium",
        delivery: "launch_week",
        submissionId: "sub_1",
        launchWeekStart: new Date("2099-10-19T00:00:00.000Z"),
      });
      expect(dodoMock.checkoutSessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          product_cart: [{ product_id: "pdt_launch_video", quantity: 1 }],
          return_url: "https://shipboost.io/api/dodo/return/launch-video?order_id=lvo_1",
          metadata: {
            shipboostProduct: "launch_video",
            shipboostSubmissionId: "sub_1",
            shipboostLaunchVideoOrderId: "lvo_1",
          },
        }),
      );
      expect(attachLaunchVideoCheckoutSessionMock).toHaveBeenCalledWith("lvo_1", "cks_1");
    });

    it("uses the standalone product for a free launch", async () => {
      prismaMock.submission.findFirst.mockResolvedValue(
        submission({
          submissionType: "FREE_LAUNCH",
          paymentStatus: "NOT_REQUIRED",
          tool: {
            name: "Acme",
            launches: [
              { launchType: "FREE", status: "APPROVED", launchDate: new Date("2099-12-07T00:00:00.000Z") },
            ],
          },
        }),
      );

      await createLaunchVideoCheckout({ submissionId: "sub_1", founder });

      expect(createPendingLaunchVideoOrderMock).toHaveBeenCalledWith({
        mode: "standalone",
        delivery: "seven_days",
        submissionId: "sub_1",
        launchWeekStart: undefined,
      });
    });

    it("sells a past Premium launch the Premium product with 7-day delivery", async () => {
      prismaMock.submission.findFirst.mockResolvedValue(
        submission({
          tool: {
            name: "Acme",
            launches: [
              { launchType: "FEATURED", status: "LIVE", launchDate: new Date("2026-06-01T00:00:00.000Z") },
            ],
          },
        }),
      );

      await createLaunchVideoCheckout({ submissionId: "sub_1", founder });

      expect(createPendingLaunchVideoOrderMock).toHaveBeenCalledWith({
        mode: "premium",
        delivery: "seven_days",
        submissionId: "sub_1",
        launchWeekStart: undefined,
      });
    });

    it("refuses a submission that already has a video", async () => {
      prismaMock.submission.findFirst.mockResolvedValue(
        submission({ launchVideoOrders: [{ id: "lvo_0" }] }),
      );

      await expect(
        createLaunchVideoCheckout({ submissionId: "sub_1", founder }),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(createPendingLaunchVideoOrderMock).not.toHaveBeenCalled();
    });

    it("returns 404 for another founder's submission", async () => {
      prismaMock.submission.findFirst.mockResolvedValue(null);

      await expect(
        createLaunchVideoCheckout({ submissionId: "sub_1", founder }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("cancels the order when Dodo fails", async () => {
      prismaMock.submission.findFirst.mockResolvedValue(submission());
      dodoMock.checkoutSessions.create.mockRejectedValue(new Error("dodo down"));

      await expect(
        createLaunchVideoCheckout({ submissionId: "sub_1", founder }),
      ).rejects.toThrow("dodo down");
      expect(cancelPendingLaunchVideoOrderMock).toHaveBeenCalledWith("lvo_1");
    });
  });

  describe("reconcileLaunchVideoPayment", () => {
    const input = { orderId: "lvo_1", paymentId: "pay_1", founderUserId: "user_1" };

    it("marks the order paid when the payment is for that order", async () => {
      prismaMock.launchVideoOrder.findFirst.mockResolvedValue({
        submissionId: "sub_1",
        status: "PENDING",
      });
      dodoMock.payments.retrieve.mockResolvedValue({
        payment_id: "pay_1",
        status: "succeeded",
        metadata: { shipboostLaunchVideoOrderId: "lvo_1" },
      });

      await expect(reconcileLaunchVideoPayment(input)).resolves.toBe("sub_1");
      expect(handleLaunchVideoPaymentSucceededMock).toHaveBeenCalledWith({
        orderId: "lvo_1",
        paymentId: "pay_1",
      });
    });

    it("ignores a payment made for a different order", async () => {
      prismaMock.launchVideoOrder.findFirst.mockResolvedValue({
        submissionId: "sub_1",
        status: "PENDING",
      });
      dodoMock.payments.retrieve.mockResolvedValue({
        payment_id: "pay_1",
        status: "succeeded",
        metadata: { shipboostLaunchVideoOrderId: "lvo_other" },
      });

      await expect(reconcileLaunchVideoPayment(input)).resolves.toBeNull();
      expect(handleLaunchVideoPaymentSucceededMock).not.toHaveBeenCalled();
    });

    it("only finds the founder's own orders", async () => {
      prismaMock.launchVideoOrder.findFirst.mockResolvedValue(null);

      await expect(reconcileLaunchVideoPayment(input)).resolves.toBeNull();
      expect(prismaMock.launchVideoOrder.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "lvo_1", submission: { userId: "user_1" } },
        }),
      );
      expect(dodoMock.payments.retrieve).not.toHaveBeenCalled();
    });
  });
});
