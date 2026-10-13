import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, getLaunchVideoOfferMock, sendLaunchVideoOfferEmailMessageMock } = vi.hoisted(
  () => ({
    prismaMock: {
      launch: { findMany: vi.fn(), updateMany: vi.fn() },
      submission: { findFirst: vi.fn() },
    },
    getLaunchVideoOfferMock: vi.fn(),
    sendLaunchVideoOfferEmailMessageMock: vi.fn(),
  }),
);

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));
vi.mock("@/server/env", () => ({
  getEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://shipboost.io" }),
}));
vi.mock("@/server/email/transactional", () => ({
  sendLaunchVideoOfferEmailMessage: sendLaunchVideoOfferEmailMessageMock,
}));
vi.mock("@/server/services/launch-video-service", () => ({
  getLaunchVideoOffer: getLaunchVideoOfferMock,
  getStandaloneDeliveryWindow: (now: Date) => ({
    deliverBy: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  }),
}));

import { sendDueLaunchVideoOfferEmails } from "@/server/services/launch-video-offer-service";

const now = new Date("2026-10-13T09:00:00.000Z");

function launch(overrides: Record<string, unknown> = {}) {
  return {
    id: "launch_1",
    toolId: "tool_1",
    launchType: "FREE",
    status: "APPROVED",
    launchDate: new Date("2026-10-19T00:00:00.000Z"),
    ...overrides,
  };
}

function submission(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_1",
    submissionType: "FREE_LAUNCH",
    paymentStatus: "NOT_REQUIRED",
    user: { email: "founder@example.com", name: "Ana" },
    tool: { name: "Acme" },
    launchVideoOrders: [],
    ...overrides,
  };
}

const availableOffer = {
  available: true,
  priceUsd: { premium: 99, standalone: 129 },
  launchPriceSpotsLeft: 10,
  demo: null,
};

describe("sendDueLaunchVideoOfferEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLaunchVideoOfferMock.mockResolvedValue(availableOffer);
    prismaMock.launch.updateMany.mockResolvedValue({ count: 1 });
  });

  it("looks only at approved launches in the next 10 days that have not had the offer", async () => {
    prismaMock.launch.findMany.mockResolvedValue([]);

    await sendDueLaunchVideoOfferEmails(now);

    expect(prismaMock.launch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          launchType: { in: ["FREE", "FEATURED"] },
          status: "APPROVED",
          launchVideoOfferSentAt: null,
          launchDate: { gt: now, lte: new Date("2026-10-23T09:00:00.000Z") },
        },
      }),
    );
    expect(getLaunchVideoOfferMock).not.toHaveBeenCalled();
  });

  it("sends a free launch the standalone price with the arrival date", async () => {
    prismaMock.launch.findMany.mockResolvedValue([launch()]);
    prismaMock.submission.findFirst.mockResolvedValue(submission());

    const result = await sendDueLaunchVideoOfferEmails(now);

    expect(result.launchVideoOffersSent).toBe(1);
    expect(sendLaunchVideoOfferEmailMessageMock).toHaveBeenCalledWith({
      to: "founder@example.com",
      name: "Ana",
      toolName: "Acme",
      launchWeek: "Oct 19, 2026",
      offerUrl: "https://shipboost.io/dashboard/submissions/sub_1/launch-video",
      priceUsd: 129,
      delivery: { kind: "standalone", readyBeforeLaunch: false, arrivesBy: "Oct 20, 2026" },
      launchPriceSpotsLeft: 10,
    });
  });

  it("sends a paid Premium launch the Premium price", async () => {
    prismaMock.launch.findMany.mockResolvedValue([launch({ launchType: "FEATURED" })]);
    prismaMock.submission.findFirst.mockResolvedValue(
      submission({ submissionType: "FEATURED_LAUNCH", paymentStatus: "PAID" }),
    );

    await sendDueLaunchVideoOfferEmails(now);

    expect(sendLaunchVideoOfferEmailMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({ priceUsd: 99, delivery: { kind: "premium" } }),
    );
  });

  it("marks a launch that already has a video without emailing it", async () => {
    prismaMock.launch.findMany.mockResolvedValue([launch()]);
    prismaMock.submission.findFirst.mockResolvedValue(
      submission({ launchVideoOrders: [{ id: "lvo_1" }] }),
    );

    const result = await sendDueLaunchVideoOfferEmails(now);

    expect(prismaMock.launch.updateMany).toHaveBeenCalled();
    expect(sendLaunchVideoOfferEmailMessageMock).not.toHaveBeenCalled();
    expect(result.launchVideoOffersSent).toBe(0);
  });

  it("skips a launch another run already claimed", async () => {
    prismaMock.launch.findMany.mockResolvedValue([launch()]);
    prismaMock.submission.findFirst.mockResolvedValue(submission());
    prismaMock.launch.updateMany.mockResolvedValue({ count: 0 });

    await sendDueLaunchVideoOfferEmails(now);

    expect(sendLaunchVideoOfferEmailMessageMock).not.toHaveBeenCalled();
  });

  it("sends nothing while the offer is unavailable", async () => {
    getLaunchVideoOfferMock.mockResolvedValue({ ...availableOffer, available: false });
    prismaMock.launch.findMany.mockResolvedValue([launch()]);

    await sendDueLaunchVideoOfferEmails(now);

    expect(prismaMock.launch.updateMany).not.toHaveBeenCalled();
    expect(sendLaunchVideoOfferEmailMessageMock).not.toHaveBeenCalled();
  });
});
