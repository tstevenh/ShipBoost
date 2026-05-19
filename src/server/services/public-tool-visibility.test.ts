import { describe, expect, it } from "vitest";

import {
  combinePubliclyVisibleToolWhere,
  getPrelaunchToolPageWhere,
  getPublicLaunchBoardWhere,
  getPubliclyVisibleToolWhere,
  getToolPrelaunchDate,
  isLaunchPubliclyVisible,
  isToolPrelaunchPageVisible,
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
          launchDate: new Date("2026-05-11T00:00:00.000Z"),
        },
        new Date("2026-05-04T00:00:00.000Z"),
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
              launchDate: new Date("2026-05-11T00:00:00.000Z"),
            },
          ],
        },
        new Date("2026-05-04T00:00:00.000Z"),
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

  it("combines public visibility with caller OR filters without overwriting launch visibility", () => {
    const now = new Date("2026-04-08T10:00:00.000Z");
    const callerWhere = {
      OR: [
        { name: { contains: "analytics", mode: "insensitive" as const } },
        { tagline: { contains: "analytics", mode: "insensitive" as const } },
      ],
    };

    expect(combinePubliclyVisibleToolWhere(callerWhere, now)).toEqual({
      AND: [getPubliclyVisibleToolWhere(now), callerWhere],
    });
  });

  it("matches approved scheduled tools for prelaunch pages", () => {
    const now = new Date("2026-05-04T00:00:00.000Z");

    expect(getPrelaunchToolPageWhere(now)).toEqual({
      OR: [
        {
          publicationStatus: "PUBLISHED",
          moderationStatus: "APPROVED",
          launches: {
            some: {
              status: "APPROVED",
              launchDate: {
                gt: now,
              },
            },
          },
        },
        {
          publicationStatus: "UNPUBLISHED",
          moderationStatus: "PENDING",
          submissions: {
            some: {
              reviewStatus: "PENDING",
              preferredLaunchDate: {
                gt: now,
              },
            },
          },
        },
      ],
    });
  });

  it("shows a prelaunch page for approved future launches", () => {
    expect(
      isToolPrelaunchPageVisible(
        {
          publicationStatus: "PUBLISHED",
          moderationStatus: "APPROVED",
          launches: [
            {
              status: "APPROVED",
              launchDate: new Date("2026-05-11T00:00:00.000Z"),
            },
          ],
        },
        new Date("2026-05-04T00:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("shows a prelaunch page for pending review submissions with a future launch date", () => {
    expect(
      isToolPrelaunchPageVisible(
        {
          publicationStatus: "UNPUBLISHED",
          moderationStatus: "PENDING",
          launches: [],
          submissions: [
            {
              reviewStatus: "PENDING",
              preferredLaunchDate: new Date("2026-05-11T00:00:00.000Z"),
            },
          ],
        },
        new Date("2026-05-04T00:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("does not show prelaunch pages for rejected tools", () => {
    expect(
      isToolPrelaunchPageVisible(
        {
          publicationStatus: "UNPUBLISHED",
          moderationStatus: "REJECTED",
          launches: [
            {
              status: "APPROVED",
              launchDate: new Date("2026-05-11T00:00:00.000Z"),
            },
          ],
        },
        new Date("2026-05-04T00:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("uses the next scheduled prelaunch date", () => {
    expect(
      getToolPrelaunchDate(
        {
          launches: [
            {
              status: "APPROVED",
              launchDate: new Date("2026-05-18T00:00:00.000Z"),
            },
            {
              status: "APPROVED",
              launchDate: new Date("2026-05-11T00:00:00.000Z"),
            },
          ],
        },
        new Date("2026-05-04T00:00:00.000Z"),
      ),
    ).toEqual(new Date("2026-05-11T00:00:00.000Z"));
  });
});
