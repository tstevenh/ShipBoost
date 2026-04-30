import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, dodoMock, sendSponsorPlacementRenewalReminderEmailMessageMock } =
  vi.hoisted(() => ({
  prismaMock: {
    tool: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    sponsorPlacement: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  dodoMock: {
    checkoutSessions: { create: vi.fn() },
    payments: { retrieve: vi.fn() },
  },
  sendSponsorPlacementRenewalReminderEmailMessageMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));
vi.mock("@/server/dodo", () => ({
  getDodoClient: () => dodoMock,
}));
vi.mock("@/server/env", () => ({
  getEnv: () => ({
    DODO_SPONSOR_PLACEMENT_PRODUCT_ID: "product_sponsor",
    NEXT_PUBLIC_APP_URL: "https://shipboost.io",
  }),
}));
vi.mock("@/server/email/transactional", () => ({
  sendSponsorPlacementRenewalReminderEmailMessage:
    sendSponsorPlacementRenewalReminderEmailMessageMock,
}));

import {
  createSponsorPlacementCheckout,
  handleSponsorPlacementPaymentSucceeded,
  listActiveSponsorPlacements,
  processSponsorPlacementLifecycle,
  reconcileSponsorPlacementPayment,
} from "@/server/services/sponsor-placement-service";

describe("sponsor-placement-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects checkout when the founder does not own the tool", async () => {
    prismaMock.tool.findFirst.mockResolvedValue(null);

    await expect(
      createSponsorPlacementCheckout("tool_1", {
        id: "user_1",
        email: "founder@example.com",
        name: "Founder",
      }),
    ).rejects.toThrow("Tool is not eligible for sponsor placement.");
  });

  it("rejects checkout when all three sponsor slots are active", async () => {
    prismaMock.tool.findFirst.mockResolvedValue({ id: "tool_1", name: "Tool" });
    prismaMock.sponsorPlacement.count.mockResolvedValue(3);

    await expect(
      createSponsorPlacementCheckout("tool_1", {
        id: "user_1",
        email: "founder@example.com",
        name: "Founder",
      }),
    ).rejects.toThrow("Sponsor placements are sold out.");
  });

  it("creates a pending placement and Dodo checkout", async () => {
    prismaMock.tool.findFirst.mockResolvedValue({ id: "tool_1", name: "Tool" });
    prismaMock.sponsorPlacement.count.mockResolvedValue(0);
    prismaMock.sponsorPlacement.create.mockResolvedValue({ id: "placement_1" });
    dodoMock.checkoutSessions.create.mockResolvedValue({
      session_id: "checkout_1",
      checkout_url: "https://checkout.example",
    });
    prismaMock.sponsorPlacement.update.mockResolvedValue({ id: "placement_1" });

    await expect(
      createSponsorPlacementCheckout("tool_1", {
        id: "user_1",
        email: "founder@example.com",
        name: "Founder",
      }),
    ).resolves.toEqual({
      checkoutUrl: "https://checkout.example",
      checkoutId: "checkout_1",
    });
    expect(dodoMock.checkoutSessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url:
          "https://shipboost.io/advertise?checkout=success&sponsor_placement_id=placement_1",
      }),
    );
  });

  it("disables a fresh pending placement when Dodo checkout creation fails", async () => {
    prismaMock.tool.findFirst.mockResolvedValue({ id: "tool_1", name: "Tool" });
    prismaMock.sponsorPlacement.count.mockResolvedValue(0);
    prismaMock.sponsorPlacement.create.mockResolvedValue({ id: "placement_1" });
    dodoMock.checkoutSessions.create.mockRejectedValue(new Error("Dodo down"));
    prismaMock.sponsorPlacement.update.mockResolvedValue({
      id: "placement_1",
      status: "DISABLED",
    });

    await expect(
      createSponsorPlacementCheckout("tool_1", {
        id: "user_1",
        email: "founder@example.com",
        name: "Founder",
      }),
    ).rejects.toThrow("Dodo down");

    expect(prismaMock.sponsorPlacement.update).toHaveBeenCalledWith({
      where: { id: "placement_1" },
      data: {
        status: "DISABLED",
        disabledAt: expect.any(Date),
      },
    });
  });

  it("activates a paid placement for 30 days when inventory is available", async () => {
    const now = new Date("2026-04-29T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prismaMock.sponsorPlacement.findUnique.mockResolvedValue({
      id: "placement_1",
      toolId: "tool_1",
      status: "PENDING_PAYMENT",
      tool: {
        launches: [],
      },
    });
    prismaMock.sponsorPlacement.count.mockResolvedValue(2);
    prismaMock.sponsorPlacement.update.mockResolvedValue({
      id: "placement_1",
      status: "ACTIVE",
    });

    await handleSponsorPlacementPaymentSucceeded({
      paymentId: "payment_1",
      checkoutSessionId: "checkout_1",
      metadata: { shipboostSponsorPlacementId: "placement_1" },
    });

    expect(prismaMock.sponsorPlacement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "placement_1" },
        data: expect.objectContaining({
          status: "ACTIVE",
          paidAt: now,
          startsAt: now,
          endsAt: new Date("2026-05-29T00:00:00.000Z"),
        }),
      }),
    );
  });

  it("waitlists a paid placement when inventory fills before payment succeeds", async () => {
    const now = new Date("2026-04-29T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prismaMock.sponsorPlacement.findUnique.mockResolvedValue({
      id: "placement_1",
      toolId: "tool_1",
      status: "PENDING_PAYMENT",
      tool: {
        launches: [],
      },
    });
    prismaMock.sponsorPlacement.count.mockResolvedValue(3);
    prismaMock.sponsorPlacement.update.mockResolvedValue({
      id: "placement_1",
      status: "PAID_WAITLISTED",
    });

    await handleSponsorPlacementPaymentSucceeded({
      paymentId: "payment_1",
      checkoutSessionId: "checkout_1",
      metadata: { shipboostSponsorPlacementId: "placement_1" },
    });

    expect(prismaMock.sponsorPlacement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "placement_1" },
        data: expect.objectContaining({
          status: "PAID_WAITLISTED",
          paidAt: now,
          paymentId: "payment_1",
        }),
      }),
    );
  });

  it("starts an approved scheduled tool placement immediately", async () => {
    const now = new Date("2026-04-29T00:00:00.000Z");
    const launchDate = new Date("2026-05-11T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prismaMock.sponsorPlacement.findUnique.mockResolvedValue({
      id: "placement_1",
      toolId: "tool_1",
      status: "PENDING_PAYMENT",
      tool: {
        launches: [{ status: "APPROVED", launchDate }],
      },
    });
    prismaMock.sponsorPlacement.count.mockResolvedValue(2);
    prismaMock.sponsorPlacement.update.mockResolvedValue({
      id: "placement_1",
      status: "ACTIVE",
    });

    await handleSponsorPlacementPaymentSucceeded({
      paymentId: "payment_1",
      checkoutSessionId: "checkout_1",
      metadata: { shipboostSponsorPlacementId: "placement_1" },
    });

    expect(prismaMock.sponsorPlacement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "placement_1" },
        data: expect.objectContaining({
          status: "ACTIVE",
          paidAt: now,
          startsAt: now,
          endsAt: new Date("2026-05-29T00:00:00.000Z"),
        }),
      }),
    );
  });

  it("reconciles a successful Dodo payment from advertise return parameters", async () => {
    const now = new Date("2026-04-29T00:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prismaMock.sponsorPlacement.findUnique
      .mockResolvedValueOnce({
        id: "placement_1",
        status: "PENDING_PAYMENT",
        paymentId: null,
        tool: {
          ownerUserId: "user_1",
          launches: [],
        },
      })
      .mockResolvedValueOnce({
        id: "placement_1",
        status: "PENDING_PAYMENT",
        tool: {
          launches: [],
        },
      });
    dodoMock.payments.retrieve.mockResolvedValue({
      payment_id: "payment_1",
      status: "succeeded",
      checkout_session_id: "checkout_1",
      metadata: {
        shipboostProduct: "sponsor_placement",
        shipboostSponsorPlacementId: "placement_1",
      },
    });
    prismaMock.sponsorPlacement.count.mockResolvedValue(2);
    prismaMock.sponsorPlacement.update.mockResolvedValue({
      id: "placement_1",
      status: "ACTIVE",
    });

    await expect(
      reconcileSponsorPlacementPayment({
        placementId: "placement_1",
        paymentId: "payment_1",
        founderUserId: "user_1",
      }),
    ).resolves.toMatchObject({
      id: "placement_1",
      status: "ACTIVE",
    });

    expect(dodoMock.payments.retrieve).toHaveBeenCalledWith("payment_1");
    expect(prismaMock.sponsorPlacement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "placement_1" },
        data: expect.objectContaining({
          status: "ACTIVE",
          paymentId: "payment_1",
          startsAt: now,
          endsAt: new Date("2026-05-29T00:00:00.000Z"),
        }),
      }),
    );
  });

  it("does not activate a sponsor placement when Dodo payment is not succeeded", async () => {
    prismaMock.sponsorPlacement.findUnique.mockResolvedValueOnce({
      id: "placement_1",
      status: "PENDING_PAYMENT",
      paymentId: null,
      tool: {
        ownerUserId: "user_1",
        launches: [],
      },
    });
    dodoMock.payments.retrieve.mockResolvedValue({
      payment_id: "payment_1",
      status: "failed",
      checkout_session_id: "checkout_1",
      metadata: {
        shipboostProduct: "sponsor_placement",
        shipboostSponsorPlacementId: "placement_1",
      },
    });

    await expect(
      reconcileSponsorPlacementPayment({
        placementId: "placement_1",
        paymentId: "payment_1",
        founderUserId: "user_1",
      }),
    ).resolves.toMatchObject({
      id: "placement_1",
      status: "PENDING_PAYMENT",
    });

    expect(prismaMock.sponsorPlacement.update).not.toHaveBeenCalled();
  });

  it("can reconcile an older advertise return that only has payment id", async () => {
    prismaMock.sponsorPlacement.findUnique
      .mockResolvedValueOnce({
        id: "placement_1",
        status: "PENDING_PAYMENT",
        paymentId: null,
        tool: {
          ownerUserId: "user_1",
          launches: [],
        },
      })
      .mockResolvedValueOnce({
        id: "placement_1",
        status: "PENDING_PAYMENT",
        tool: {
          launches: [],
        },
      });
    dodoMock.payments.retrieve.mockResolvedValue({
      payment_id: "payment_1",
      status: "succeeded",
      checkout_session_id: "checkout_1",
      metadata: {
        shipboostProduct: "sponsor_placement",
        shipboostSponsorPlacementId: "placement_1",
      },
    });
    prismaMock.sponsorPlacement.count.mockResolvedValue(2);
    prismaMock.sponsorPlacement.update.mockResolvedValue({
      id: "placement_1",
      status: "ACTIVE",
    });

    await expect(
      reconcileSponsorPlacementPayment({
        paymentId: "payment_1",
        founderUserId: "user_1",
      }),
    ).resolves.toMatchObject({
      id: "placement_1",
      status: "ACTIVE",
    });

    expect(dodoMock.payments.retrieve).toHaveBeenCalledWith("payment_1");
    expect(prismaMock.sponsorPlacement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "placement_1" },
        data: expect.objectContaining({
          status: "ACTIVE",
          paymentId: "payment_1",
        }),
      }),
    );
  });

  it("rejects sponsor payment reconciliation for another founder account", async () => {
    prismaMock.sponsorPlacement.findUnique.mockResolvedValueOnce({
      id: "placement_1",
      status: "PENDING_PAYMENT",
      paymentId: null,
      tool: {
        ownerUserId: "user_2",
        launches: [],
      },
    });

    await expect(
      reconcileSponsorPlacementPayment({
        placementId: "placement_1",
        paymentId: "payment_1",
        founderUserId: "user_1",
      }),
    ).rejects.toThrow("This sponsor placement does not belong to your account.");

    expect(dodoMock.payments.retrieve).not.toHaveBeenCalled();
    expect(prismaMock.sponsorPlacement.update).not.toHaveBeenCalled();
  });

  it("lists only active unexpired public placements", async () => {
    prismaMock.sponsorPlacement.findMany.mockResolvedValue([]);

    await listActiveSponsorPlacements();

    expect(prismaMock.sponsorPlacement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ACTIVE",
          disabledAt: null,
          endsAt: { gt: expect.any(Date) },
          tool: expect.objectContaining({
            publicationStatus: "PUBLISHED",
            moderationStatus: "APPROVED",
          }),
        }),
        take: 3,
      }),
    );
  });

  it("marks ended active sponsor placements as expired", async () => {
    prismaMock.sponsorPlacement.updateMany.mockResolvedValue({ count: 2 });
    prismaMock.sponsorPlacement.findMany.mockResolvedValue([]);

    await expect(
      processSponsorPlacementLifecycle(
        new Date("2026-04-29T00:00:00.000Z"),
      ),
    ).resolves.toEqual({ expiredCount: 2, remindersSent: 0 });

    expect(prismaMock.sponsorPlacement.updateMany).toHaveBeenCalledWith({
      where: {
        status: "ACTIVE",
        endsAt: { lte: new Date("2026-04-29T00:00:00.000Z") },
      },
      data: {
        status: "EXPIRED",
      },
    });
  });

  it("sends one renewal reminder for active placements ending within seven days", async () => {
    const now = new Date("2026-04-29T00:00:00.000Z");
    prismaMock.sponsorPlacement.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.sponsorPlacement.findMany.mockResolvedValue([
      {
        id: "placement_1",
        endsAt: new Date("2026-05-03T00:00:00.000Z"),
        tool: {
          name: "Sponsor Tool",
          owner: { email: "founder@example.com" },
        },
      },
    ]);
    sendSponsorPlacementRenewalReminderEmailMessageMock.mockResolvedValue(
      undefined,
    );
    prismaMock.sponsorPlacement.update.mockResolvedValue({ id: "placement_1" });

    await expect(processSponsorPlacementLifecycle(now)).resolves.toEqual({
      expiredCount: 0,
      remindersSent: 1,
    });

    expect(
      sendSponsorPlacementRenewalReminderEmailMessageMock,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "founder@example.com",
        toolName: "Sponsor Tool",
        advertiseUrl: "https://shipboost.io/advertise",
      }),
    );
    expect(prismaMock.sponsorPlacement.update).toHaveBeenCalledWith({
      where: { id: "placement_1" },
      data: { renewalReminderSentAt: now },
    });
  });
});
