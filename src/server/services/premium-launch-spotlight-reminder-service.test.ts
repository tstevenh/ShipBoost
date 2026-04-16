import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  sendPremiumLaunchSpotlightReminderEmailMessageMock,
} = vi.hoisted(() => ({
  prismaMock: {
    submissionSpotlightBrief: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
  sendPremiumLaunchSpotlightReminderEmailMessageMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/email/transactional", () => ({
  sendPremiumLaunchSpotlightReminderEmailMessage:
    sendPremiumLaunchSpotlightReminderEmailMessageMock,
}));

vi.mock("@/server/services/submission-service-shared", () => ({
  getDashboardUrl: () => "https://shipboost.io/dashboard",
}));

import { sendDuePremiumLaunchSpotlightReminders } from "@/server/services/premium-launch-spotlight-reminder-service";

describe("premium-launch-spotlight-reminder-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendPremiumLaunchSpotlightReminderEmailMessageMock.mockResolvedValue(undefined);
  });

  it("skips published spotlights", async () => {
    prismaMock.submissionSpotlightBrief.findMany.mockResolvedValueOnce([]);

    const result = await sendDuePremiumLaunchSpotlightReminders(
      new Date("2026-05-05T00:00:00.000Z"),
    );

    expect(result).toEqual({
      threeDaysBeforeCount: 0,
      launchWeekStartCount: 0,
    });
    expect(sendPremiumLaunchSpotlightReminderEmailMessageMock).not.toHaveBeenCalled();
  });

  it("sends the three-days-before reminder once", async () => {
    prismaMock.submissionSpotlightBrief.findMany.mockResolvedValueOnce([
      {
        submissionId: "submission_1",
        reminderThreeDaysSentAt: null,
        reminderLaunchWeekSentAt: null,
        submission: {
          preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
          user: {
            email: "founder@example.com",
            name: "Founder",
          },
          tool: {
            name: "Acme",
          },
        },
      },
    ]);

    const now = new Date("2026-05-05T00:00:00.000Z");
    const result = await sendDuePremiumLaunchSpotlightReminders(now);

    expect(sendPremiumLaunchSpotlightReminderEmailMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "founder@example.com",
        toolName: "Acme",
        dashboardUrl: "https://shipboost.io/dashboard?tab=submissions",
        stage: "THREE_DAYS_BEFORE",
      }),
    );
    expect(prismaMock.submissionSpotlightBrief.update).toHaveBeenCalledWith({
      where: { submissionId: "submission_1" },
      data: {
        reminderThreeDaysSentAt: now,
      },
    });
    expect(result).toEqual({
      threeDaysBeforeCount: 1,
      launchWeekStartCount: 0,
    });
  });

  it("sends the launch-week-start reminder once", async () => {
    prismaMock.submissionSpotlightBrief.findMany.mockResolvedValueOnce([
      {
        submissionId: "submission_1",
        reminderThreeDaysSentAt: new Date("2026-05-05T00:00:00.000Z"),
        reminderLaunchWeekSentAt: null,
        submission: {
          preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
          user: {
            email: "founder@example.com",
            name: "Founder",
          },
          tool: {
            name: "Acme",
          },
        },
      },
    ]);

    const now = new Date("2026-05-08T00:00:00.000Z");
    const result = await sendDuePremiumLaunchSpotlightReminders(now);

    expect(sendPremiumLaunchSpotlightReminderEmailMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: "LAUNCH_WEEK_START",
      }),
    );
    expect(prismaMock.submissionSpotlightBrief.update).toHaveBeenCalledWith({
      where: { submissionId: "submission_1" },
      data: {
        reminderLaunchWeekSentAt: now,
      },
    });
    expect(result).toEqual({
      threeDaysBeforeCount: 0,
      launchWeekStartCount: 1,
    });
  });

  it("does not duplicate sends once timestamps exist", async () => {
    prismaMock.submissionSpotlightBrief.findMany.mockResolvedValueOnce([
      {
        submissionId: "submission_1",
        reminderThreeDaysSentAt: new Date("2026-05-05T00:00:00.000Z"),
        reminderLaunchWeekSentAt: new Date("2026-05-08T00:00:00.000Z"),
        submission: {
          preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
          user: {
            email: "founder@example.com",
            name: "Founder",
          },
          tool: {
            name: "Acme",
          },
        },
      },
    ]);

    const result = await sendDuePremiumLaunchSpotlightReminders(
      new Date("2026-05-08T12:00:00.000Z"),
    );

    expect(sendPremiumLaunchSpotlightReminderEmailMessageMock).not.toHaveBeenCalled();
    expect(prismaMock.submissionSpotlightBrief.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      threeDaysBeforeCount: 0,
      launchWeekStartCount: 0,
    });
  });
});
