import { describe, expect, it } from "vitest";

import {
  getPublicLaunchBoardWhere,
  getPubliclyVisibleToolWhere,
  isLaunchPubliclyVisible,
  isToolPubliclyVisible,
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

  it("requires launch-board entries to belong to publicly visible tools", () => {
    const now = new Date("2026-04-08T10:00:00.000Z");
    const where = getPublicLaunchBoardWhere(now);

    expect(where).toEqual({
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
      tool: {
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
        OR: [
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
        ],
      },
    });
  });

  it("treats overdue approved launches as publicly visible", () => {
    expect(
      isLaunchPubliclyVisible({
        status: "APPROVED",
        launchDate: new Date("2026-04-08T00:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("does not treat future approved launches as public", () => {
    expect(
      isLaunchPubliclyVisible(
        {
          status: "APPROVED",
          launchDate: new Date("2026-05-08T00:00:00.000Z"),
        },
        new Date("2026-05-01T00:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("treats future scheduled tools as non-public even when published", () => {
    expect(
      isToolPubliclyVisible(
        {
          publicationStatus: "PUBLISHED",
          moderationStatus: "APPROVED",
          launches: [
            {
              status: "APPROVED",
              launchDate: new Date("2026-05-08T00:00:00.000Z"),
            },
          ],
        },
        new Date("2026-05-01T00:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("treats published tools with no launches as public", () => {
    expect(
      isToolPubliclyVisible({
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
        launches: [],
      }),
    ).toBe(true);
  });
});
