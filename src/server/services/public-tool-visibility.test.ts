import { describe, expect, it } from "vitest";

import {
  getPubliclyVisibleToolWhere,
  isLaunchPubliclyVisible,
} from "@/server/services/public-tool-visibility";

describe("getPubliclyVisibleToolWhere", () => {
  it("requires published and approved tools", () => {
    const where = getPubliclyVisibleToolWhere();

    expect(where.publicationStatus).toBe("PUBLISHED");
    expect(where.moderationStatus).toBe("APPROVED");
  });

  it("allows tools with no launches or a live-ended launch history", () => {
    const now = new Date("2026-04-08T10:00:00.000Z");
    const where = getPubliclyVisibleToolWhere(now);

    expect(where.OR).toEqual([
      {
        launches: {
          none: {},
        },
      },
      {
        launches: {
          some: {
            OR: [
              {
                status: {
                  in: ["LIVE", "ENDED"],
                },
              },
              {
                status: "APPROVED",
                launchDate: {
                  lte: now,
                },
              },
            ],
          },
        },
      },
    ]);
  });

  it("treats overdue approved launches as publicly visible", () => {
    expect(
      isLaunchPubliclyVisible({
        status: "APPROVED",
        launchDate: new Date("2026-04-08T00:00:00.000Z"),
      }),
    ).toBe(true);
  });
});
