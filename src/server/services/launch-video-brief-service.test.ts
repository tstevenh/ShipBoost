import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, sendLaunchVideoBriefReminderEmailMessageMock } = vi.hoisted(() => ({
  prismaMock: {
    launchVideoOrder: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  sendLaunchVideoBriefReminderEmailMessageMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));
vi.mock("@/server/env", () => ({
  getEnv: () => ({
    NEXT_PUBLIC_APP_URL: "https://shipboost.io",
    CLOUDINARY_CLOUD_NAME: "shipboost",
  }),
}));
vi.mock("@/server/email/transactional", () => ({
  sendLaunchVideoBriefReminderEmailMessage: sendLaunchVideoBriefReminderEmailMessageMock,
}));

import {
  getFounderLaunchVideoBrief,
  saveFounderLaunchVideoBrief,
  sendDueLaunchVideoBriefReminders,
} from "@/server/services/launch-video-brief-service";

const founder = { id: "user_1" };

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "lvo_1",
    submissionId: "sub_1",
    status: "PAID",
    standalone: false,
    launchWeekStart: new Date("2026-10-19T00:00:00.000Z"),
    deliverBy: new Date("2026-10-26T00:00:00.000Z"),
    paidAt: new Date("2026-10-10T00:00:00.000Z"),
    focusNote: "Type a question, get a form",
    highlightClaim: null,
    avoidNote: null,
    screenshots: null,
    briefUpdatedAt: null,
    briefReminderSentAt: null,
    submission: {
      id: "sub_1",
      tool: { name: "Acme" },
      user: { email: "founder@example.com", name: "Ana" },
    },
    ...overrides,
  };
}

const input = {
  focusNote: "Type a question, get a form",
  highlightClaim: "2,000 teams",
  avoidNote: "",
  screenshots: [
    {
      role: "after" as const,
      url: "https://res.cloudinary.com/shipboost/image/upload/v1/ShipBoost/a.png",
      publicId: "ShipBoost/a",
    },
  ],
};

describe("launch-video-brief-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("only finds paid orders that belong to the founder", async () => {
    prismaMock.launchVideoOrder.findFirst.mockResolvedValue(null);

    await expect(getFounderLaunchVideoBrief("sub_1", founder)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prismaMock.launchVideoOrder.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          submissionId: "sub_1",
          status: { in: ["PAID", "DELIVERED"] },
          submission: { userId: "user_1" },
        },
      }),
    );
  });

  it("returns the brief with empty strings for unanswered fields", async () => {
    prismaMock.launchVideoOrder.findFirst.mockResolvedValue(order());

    await expect(getFounderLaunchVideoBrief("sub_1", founder)).resolves.toMatchObject({
      toolName: "Acme",
      focusNote: "Type a question, get a form",
      highlightClaim: "",
      screenshots: [],
      briefUpdatedAt: null,
    });
  });

  it("locks the brief once the video is delivered", async () => {
    prismaMock.launchVideoOrder.findFirst.mockResolvedValue(order({ status: "DELIVERED" }));

    await expect(saveFounderLaunchVideoBrief("sub_1", founder, input)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(prismaMock.launchVideoOrder.update).not.toHaveBeenCalled();
  });

  it("rejects screenshots that are not our own uploads", async () => {
    prismaMock.launchVideoOrder.findFirst.mockResolvedValue(order());

    await expect(
      saveFounderLaunchVideoBrief("sub_1", founder, {
        ...input,
        screenshots: [{ role: "after", url: "https://evil.example/a.png", publicId: "x" }],
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("saves the answers and stamps the brief", async () => {
    prismaMock.launchVideoOrder.findFirst.mockResolvedValue(order());
    prismaMock.launchVideoOrder.update.mockResolvedValue(
      order({ highlightClaim: "2,000 teams", briefUpdatedAt: new Date() }),
    );

    await saveFounderLaunchVideoBrief("sub_1", founder, input);

    expect(prismaMock.launchVideoOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lvo_1" },
        data: expect.objectContaining({
          highlightClaim: "2,000 teams",
          avoidNote: null,
          screenshots: input.screenshots,
          briefUpdatedAt: expect.any(Date),
        }),
      }),
    );
  });

  describe("sendDueLaunchVideoBriefReminders", () => {
    it("reminds Premium orders 4 days before the launch week, once", async () => {
      prismaMock.launchVideoOrder.findMany.mockResolvedValue([order()]);
      prismaMock.launchVideoOrder.updateMany.mockResolvedValue({ count: 1 });

      const early = await sendDueLaunchVideoBriefReminders(new Date("2026-10-14T00:00:00.000Z"));
      expect(early.launchVideoBriefRemindersSent).toBe(0);

      const due = await sendDueLaunchVideoBriefReminders(new Date("2026-10-15T09:00:00.000Z"));
      expect(due.launchVideoBriefRemindersSent).toBe(1);
      expect(sendLaunchVideoBriefReminderEmailMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "founder@example.com",
          briefUrl: "https://shipboost.io/dashboard/submissions/sub_1/launch-video",
          delivery: { kind: "premium", launchWeek: "Oct 19, 2026" },
        }),
      );
    });

    it("reminds standalone orders a day after payment", async () => {
      prismaMock.launchVideoOrder.findMany.mockResolvedValue([
        order({
          standalone: true,
          paidAt: new Date("2026-10-12T08:00:00.000Z"),
          deliverBy: new Date("2026-10-19T08:00:00.000Z"),
        }),
      ]);
      prismaMock.launchVideoOrder.updateMany.mockResolvedValue({ count: 1 });

      const result = await sendDueLaunchVideoBriefReminders(new Date("2026-10-13T09:00:00.000Z"));

      expect(result.launchVideoBriefRemindersSent).toBe(1);
      expect(sendLaunchVideoBriefReminderEmailMessageMock).toHaveBeenCalledWith(
        expect.objectContaining({ delivery: { kind: "standalone", deliverBy: "Oct 19, 2026" } }),
      );
    });

    it("skips an order another run already claimed", async () => {
      prismaMock.launchVideoOrder.findMany.mockResolvedValue([order()]);
      prismaMock.launchVideoOrder.updateMany.mockResolvedValue({ count: 0 });

      const result = await sendDueLaunchVideoBriefReminders(new Date("2026-10-16T00:00:00.000Z"));

      expect(result.launchVideoBriefRemindersSent).toBe(0);
      expect(sendLaunchVideoBriefReminderEmailMessageMock).not.toHaveBeenCalled();
    });
  });
});
