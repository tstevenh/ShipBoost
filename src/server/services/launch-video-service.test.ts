import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  dodoMock,
  envMock,
  sendLaunchVideoBookedEmailMessageMock,
  sendLaunchVideoOrderAdminEmailMessageMock,
  capturePostHogEventSafelyMock,
} = vi.hoisted(() => ({
  prismaMock: {
    launchVideoOrder: {
      count: vi.fn(),
      groupBy: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
  dodoMock: {
    products: { retrieve: vi.fn() },
  },
  envMock: {
    DODO_LAUNCH_VIDEO_PRODUCT_ID: "pdt_launch_video" as string | undefined,
    DODO_LAUNCH_VIDEO_STANDALONE_PRODUCT_ID: "pdt_launch_video_solo" as string | undefined,
    LAUNCHPAD_GO_LIVE_AT: "2026-05-04T00:00:00.000Z",
    LAUNCH_VIDEO_DEMO_CLOUDINARY_ID: undefined as string | undefined,
    LAUNCH_VIDEO_DEMO_PORTRAIT_CLOUDINARY_ID: undefined as string | undefined,
    CLOUDINARY_CLOUD_NAME: "shipboost",
    NEXT_PUBLIC_APP_URL: "https://shipboost.io",
    ADMIN_EMAIL: "tim@shipboost.io",
    RESEND_REPLY_TO_TRANSACTIONAL: undefined,
  },
  sendLaunchVideoBookedEmailMessageMock: vi.fn(),
  sendLaunchVideoOrderAdminEmailMessageMock: vi.fn(),
  capturePostHogEventSafelyMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));
vi.mock("@/server/dodo", () => ({ getDodoClient: () => dodoMock }));
vi.mock("@/server/env", () => ({ getEnv: () => envMock }));
vi.mock("@/server/email/transactional", () => ({
  sendLaunchVideoBookedEmailMessage: sendLaunchVideoBookedEmailMessageMock,
  sendLaunchVideoOrderAdminEmailMessage: sendLaunchVideoOrderAdminEmailMessageMock,
}));
vi.mock("@/server/posthog", () => ({
  capturePostHogEventSafely: capturePostHogEventSafelyMock,
}));

import {
  buildLaunchVideoDemo,
  createPendingLaunchVideoOrder,
  getLaunchVideoOffer,
  handleLaunchVideoPaymentSucceeded,
  handleLaunchVideoRefundSucceeded,
} from "@/server/services/launch-video-service";

const weekStart = new Date("2026-10-19T00:00:00.000Z");

describe("launch-video-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.DODO_LAUNCH_VIDEO_PRODUCT_ID = "pdt_launch_video";
    envMock.DODO_LAUNCH_VIDEO_STANDALONE_PRODUCT_ID = "pdt_launch_video_solo";
    envMock.LAUNCH_VIDEO_DEMO_CLOUDINARY_ID = undefined;
    envMock.LAUNCH_VIDEO_DEMO_PORTRAIT_CLOUDINARY_ID = undefined;
    dodoMock.products.retrieve.mockImplementation(async (productId: string) => ({
      price: {
        type: "one_time_price",
        price: productId === "pdt_launch_video_solo" ? 12900 : 9900,
        currency: "USD",
      },
    }));
  });

  describe("getLaunchVideoOffer", () => {
    it("is unavailable until both Dodo products are configured", async () => {
      envMock.DODO_LAUNCH_VIDEO_STANDALONE_PRODUCT_ID = undefined;

      const offer = await getLaunchVideoOffer();

      expect(offer.available).toBe(false);
      expect(prismaMock.launchVideoOrder.count).not.toHaveBeenCalled();
    });

    it("reads both prices from Dodo and counts launch-price spots left", async () => {
      prismaMock.launchVideoOrder.count.mockResolvedValue(3);
      prismaMock.launchVideoOrder.groupBy.mockResolvedValue([]);

      const offer = await getLaunchVideoOffer(new Date("2026-10-11T00:00:00.000Z"));

      expect(offer).toMatchObject({
        available: true,
        priceUsd: { premium: 99, standalone: 129 },
        launchPriceSpotsLeft: 7,
        bookedWeekStarts: [],
        standaloneBooked: false,
      });
    });

    it("marks standalone videos booked when the week they are due in is full", async () => {
      prismaMock.launchVideoOrder.count.mockResolvedValue(3);
      // Ordered Oct 11 → due Oct 18, which falls in the launch week starting Oct 12.
      prismaMock.launchVideoOrder.groupBy.mockResolvedValue([
        { launchWeekStart: new Date("2026-10-12T00:00:00.000Z"), _count: { _all: 5 } },
      ]);

      const offer = await getLaunchVideoOffer(new Date("2026-10-11T00:00:00.000Z"));

      expect(offer.standaloneBooked).toBe(true);
    });

    it("never reports negative spots once the launch price is used up", async () => {
      prismaMock.launchVideoOrder.count.mockResolvedValue(14);
      prismaMock.launchVideoOrder.groupBy.mockResolvedValue([]);

      const offer = await getLaunchVideoOffer();

      expect(offer.launchPriceSpotsLeft).toBe(0);
    });

    it("lists weeks that reached the weekly capacity", async () => {
      prismaMock.launchVideoOrder.count.mockResolvedValue(6);
      prismaMock.launchVideoOrder.groupBy.mockResolvedValue([
        { launchWeekStart: weekStart, _count: { _all: 5 } },
        { launchWeekStart: new Date("2026-10-26T00:00:00.000Z"), _count: { _all: 1 } },
      ]);

      const offer = await getLaunchVideoOffer();

      expect(offer.bookedWeekStarts).toEqual([weekStart.toISOString()]);
    });

    it("hides the add-on when the order table cannot be read", async () => {
      prismaMock.launchVideoOrder.count.mockRejectedValue(new Error("relation does not exist"));
      prismaMock.launchVideoOrder.groupBy.mockResolvedValue([]);
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const offer = await getLaunchVideoOffer();

      expect(offer.available).toBe(false);
      consoleError.mockRestore();
    });
  });

  describe("buildLaunchVideoDemo", () => {
    it("returns null until a demo video is configured", () => {
      expect(buildLaunchVideoDemo()).toBeNull();
    });

    it("builds Cloudinary video and poster urls", () => {
      envMock.LAUNCH_VIDEO_DEMO_CLOUDINARY_ID = "launch-videos/shipboost-demo";

      expect(buildLaunchVideoDemo()).toEqual({
        videoUrl:
          "https://res.cloudinary.com/shipboost/video/upload/q_auto,vc_auto,w_1280/launch-videos/shipboost-demo.mp4",
        posterUrl:
          "https://res.cloudinary.com/shipboost/video/upload/so_10,q_auto,w_1280/launch-videos/shipboost-demo.jpg",
        portrait: null,
      });
    });

    it("adds the 9:16 cut when it is configured", () => {
      envMock.LAUNCH_VIDEO_DEMO_CLOUDINARY_ID = "launch-videos/demo-16x9";
      envMock.LAUNCH_VIDEO_DEMO_PORTRAIT_CLOUDINARY_ID = "launch-videos/demo-9x16";

      expect(buildLaunchVideoDemo()?.portrait).toEqual({
        videoUrl:
          "https://res.cloudinary.com/shipboost/video/upload/q_auto,vc_auto,w_720/launch-videos/demo-9x16.mp4",
        posterUrl:
          "https://res.cloudinary.com/shipboost/video/upload/so_10,q_auto,w_720/launch-videos/demo-9x16.jpg",
      });
    });
  });

  describe("createPendingLaunchVideoOrder", () => {
    it("rejects a week that is fully booked", async () => {
      prismaMock.launchVideoOrder.count.mockResolvedValue(5);

      await expect(
        createPendingLaunchVideoOrder({
          mode: "premium",
          submissionId: "sub_1",
          launchWeekStart: weekStart,
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(prismaMock.launchVideoOrder.create).not.toHaveBeenCalled();
    });

    it("creates a pending Premium order due by the end of the launch week", async () => {
      prismaMock.launchVideoOrder.count.mockResolvedValue(2);
      prismaMock.launchVideoOrder.create.mockResolvedValue({ id: "lvo_1" });

      const result = await createPendingLaunchVideoOrder({
        mode: "premium",
        submissionId: "sub_1",
        launchWeekStart: weekStart,
        focusNote: "  Paste a URL, get a report  ",
      });

      expect(result).toEqual({ order: { id: "lvo_1" }, productId: "pdt_launch_video" });
      expect(prismaMock.launchVideoOrder.create).toHaveBeenCalledWith({
        data: {
          submissionId: "sub_1",
          standalone: false,
          launchWeekStart: weekStart,
          deliverBy: new Date("2026-10-26T00:00:00.000Z"),
          focusNote: "Paste a URL, get a report",
          priceCents: 9900,
        },
      });
    });

    it("creates a standalone order due 7 days later at the standalone price", async () => {
      prismaMock.launchVideoOrder.count.mockResolvedValue(0);
      prismaMock.launchVideoOrder.create.mockResolvedValue({ id: "lvo_2" });

      const result = await createPendingLaunchVideoOrder({
        mode: "standalone",
        submissionId: "sub_2",
        now: new Date("2026-10-11T09:00:00.000Z"),
      });

      expect(result.productId).toBe("pdt_launch_video_solo");
      expect(prismaMock.launchVideoOrder.create).toHaveBeenCalledWith({
        data: {
          submissionId: "sub_2",
          standalone: true,
          launchWeekStart: new Date("2026-10-12T00:00:00.000Z"),
          deliverBy: new Date("2026-10-18T09:00:00.000Z"),
          focusNote: null,
          priceCents: 12900,
        },
      });
    });
  });

  describe("handleLaunchVideoPaymentSucceeded", () => {
    it("does nothing when the order was already paid", async () => {
      prismaMock.launchVideoOrder.findUnique.mockResolvedValue({
        standalone: false,
        deliverBy: weekStart,
      });
      prismaMock.launchVideoOrder.updateMany.mockResolvedValue({ count: 0 });

      const result = await handleLaunchVideoPaymentSucceeded({
        orderId: "lvo_1",
        paymentId: "pay_1",
      });

      expect(result).toBeNull();
      expect(sendLaunchVideoBookedEmailMessageMock).not.toHaveBeenCalled();
    });

    it("marks the order paid and notifies the founder and admin", async () => {
      prismaMock.launchVideoOrder.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.launchVideoOrder.count.mockResolvedValue(10);
      prismaMock.launchVideoOrder.findUnique.mockResolvedValueOnce({
        standalone: false,
        deliverBy: new Date("2026-10-26T00:00:00.000Z"),
      });
      prismaMock.launchVideoOrder.findUnique.mockResolvedValueOnce({
        id: "lvo_1",
        submissionId: "sub_1",
        standalone: false,
        launchWeekStart: weekStart,
        deliverBy: new Date("2026-10-26T00:00:00.000Z"),
        focusNote: null,
        priceCents: 9900,
        submission: {
          user: { id: "user_1", email: "founder@example.com", name: "Ana" },
          tool: {
            id: "tool_1",
            slug: "acme",
            name: "Acme",
            websiteUrl: "https://acme.dev",
          },
        },
      });

      await handleLaunchVideoPaymentSucceeded({ orderId: "lvo_1", paymentId: "pay_1" });

      expect(prismaMock.launchVideoOrder.updateMany).toHaveBeenCalledWith({
        where: { id: "lvo_1", status: "PENDING" },
        data: expect.objectContaining({ status: "PAID", paymentId: "pay_1" }),
      });
      expect(sendLaunchVideoBookedEmailMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "founder@example.com",
          toolName: "Acme",
          delivery: { kind: "premium", launchWeek: "Oct 19, 2026" },
        }),
      );
      expect(sendLaunchVideoOrderAdminEmailMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "tim@shipboost.io",
          listingUrl: "https://shipboost.io/tools/acme",
          deliverBy: "Oct 26, 2026",
          launchPriceSpotsLeft: 0,
        }),
      );
    });
  });

  describe("handleLaunchVideoRefundSucceeded", () => {
    it("treats a partial refund on a payment with a video as video-only", async () => {
      prismaMock.launchVideoOrder.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        handleLaunchVideoRefundSucceeded({ paymentId: "pay_1", isPartial: true }),
      ).resolves.toBe(true);
    });

    it("lets a full refund also refund the premium launch", async () => {
      prismaMock.launchVideoOrder.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        handleLaunchVideoRefundSucceeded({ paymentId: "pay_1", isPartial: false }),
      ).resolves.toBe(false);
    });

    it("ignores payments without a video", async () => {
      prismaMock.launchVideoOrder.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        handleLaunchVideoRefundSucceeded({ paymentId: "pay_2", isPartial: true }),
      ).resolves.toBe(false);
    });
  });
});
