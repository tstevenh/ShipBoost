import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, sendLaunchPrepEmailMessageMock } = vi.hoisted(() => ({
  prismaMock: {
    launch: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
  sendLaunchPrepEmailMessageMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/email/transactional", () => ({
  sendLaunchPrepEmailMessage: sendLaunchPrepEmailMessageMock,
}));

vi.mock("@/server/env", () => ({
  getEnv: () => ({
    NEXT_PUBLIC_APP_URL: "https://shipboost.io",
  }),
}));

import { sendDueLaunchPrepReminders } from "@/server/services/launch-prep-reminder-service";

describe("launch-prep-reminder-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendLaunchPrepEmailMessageMock.mockResolvedValue(undefined);
  });

  it("sends one reminder for approved launches due within the next day", async () => {
    const now = new Date("2026-05-03T00:00:00.000Z");
    prismaMock.launch.findMany.mockResolvedValueOnce([
      {
        id: "launch_1",
        toolId: "tool_1",
        launchDate: new Date("2026-05-04T00:00:00.000Z"),
        priorityWeight: 0,
        createdBy: {
          email: "creator@example.com",
          name: "Creator",
        },
        tool: {
          name: "Acme",
          owner: {
            email: "owner@example.com",
            name: "Owner",
          },
        },
      },
    ]);

    const result = await sendDueLaunchPrepReminders(now);

    expect(prismaMock.launch.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "APPROVED",
          preLaunchEmailSentAt: null,
          launchDate: {
            gt: now,
            lte: new Date("2026-05-04T00:00:00.000Z"),
          },
        }),
      }),
    );
    expect(sendLaunchPrepEmailMessageMock).toHaveBeenCalledWith({
      to: "owner@example.com",
      name: "Owner",
      launchBoardUrl: "https://shipboost.io/launches/weekly",
      toolName: "Acme",
      launchDate: "May 4, 2026",
    });
    expect(prismaMock.launch.update).toHaveBeenCalledWith({
      where: { id: "launch_1" },
      data: { preLaunchEmailSentAt: now },
    });
    expect(result).toEqual({
      sentCount: 1,
      processedAt: now.toISOString(),
    });
  });

  it("falls back to the launch creator when the tool has no owner email", async () => {
    const now = new Date("2026-05-03T00:00:00.000Z");
    prismaMock.launch.findMany.mockResolvedValueOnce([
      {
        id: "launch_1",
        toolId: "tool_1",
        launchDate: new Date("2026-05-04T00:00:00.000Z"),
        priorityWeight: 0,
        createdBy: {
          email: "creator@example.com",
          name: "Creator",
        },
        tool: {
          name: "Acme",
          owner: null,
        },
      },
    ]);

    await sendDueLaunchPrepReminders(now);

    expect(sendLaunchPrepEmailMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "creator@example.com",
        name: "Creator",
      }),
    );
  });

  it("does not mark a reminder sent when email delivery fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const now = new Date("2026-05-03T00:00:00.000Z");
    prismaMock.launch.findMany.mockResolvedValueOnce([
      {
        id: "launch_1",
        toolId: "tool_1",
        launchDate: new Date("2026-05-04T00:00:00.000Z"),
        priorityWeight: 0,
        createdBy: {
          email: "creator@example.com",
          name: "Creator",
        },
        tool: {
          name: "Acme",
          owner: null,
        },
      },
    ]);
    sendLaunchPrepEmailMessageMock.mockRejectedValueOnce(new Error("Resend error"));

    const result = await sendDueLaunchPrepReminders(now);

    expect(prismaMock.launch.update).not.toHaveBeenCalled();
    expect(result.sentCount).toBe(0);
    consoleErrorSpy.mockRestore();
  });
});
