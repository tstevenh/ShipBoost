import { describe, expect, it, vi } from "vitest";

import {
  isAnchoredLaunchWeekStart,
  listSelectableLaunchWeeks,
  scheduleNextFreeLaunchDate,
} from "@/server/services/launch-scheduling";

describe("launch-scheduling", () => {
  it("never schedules a free launch before the go-live floor", async () => {
    const db = {
      launch: {
        groupBy: vi.fn().mockResolvedValue([]),
      },
    };

    const result = await scheduleNextFreeLaunchDate(db as never, {
      weeklySlots: 10,
      fromDate: new Date("2026-04-14T12:00:00.000Z"),
      goLiveAt: new Date("2026-05-04T00:00:00.000Z"),
    });

    expect(result.toISOString()).toBe("2026-05-04T00:00:00.000Z");
  });

  it("moves to the next week once the current week is full", async () => {
    const db = {
      launch: {
        groupBy: vi.fn().mockResolvedValue([
          {
            launchDate: new Date("2026-05-04T00:00:00.000Z"),
            _count: { _all: 10 },
          },
          {
            launchDate: new Date("2026-05-11T00:00:00.000Z"),
            _count: { _all: 3 },
          },
        ]),
      },
    };

    const result = await scheduleNextFreeLaunchDate(db as never, {
      weeklySlots: 10,
      fromDate: new Date("2026-05-04T00:00:00.000Z"),
      goLiveAt: new Date("2026-05-04T00:00:00.000Z"),
    });

    expect(result.toISOString()).toBe("2026-05-11T00:00:00.000Z");
    expect(db.launch.groupBy).toHaveBeenCalledTimes(1);
  });

  it("skips multiple consecutive full weeks in a single query", async () => {
    const groupBy = vi.fn().mockResolvedValue([
      { launchDate: new Date("2026-05-04T00:00:00.000Z"), _count: { _all: 10 } },
      { launchDate: new Date("2026-05-11T00:00:00.000Z"), _count: { _all: 10 } },
      { launchDate: new Date("2026-05-18T00:00:00.000Z"), _count: { _all: 10 } },
      { launchDate: new Date("2026-05-25T00:00:00.000Z"), _count: { _all: 4 } },
    ]);
    const db = { launch: { groupBy } };

    const result = await scheduleNextFreeLaunchDate(db as never, {
      weeklySlots: 10,
      fromDate: new Date("2026-05-04T00:00:00.000Z"),
      goLiveAt: new Date("2026-05-04T00:00:00.000Z"),
    });

    expect(result.toISOString()).toBe("2026-05-25T00:00:00.000Z");
    expect(groupBy).toHaveBeenCalledTimes(1);
  });

  it("offers the next anchored launch week once the current week has started", () => {
    const result = listSelectableLaunchWeeks({
      count: 2,
      fromDate: new Date("2026-05-06T12:00:00.000Z"),
      goLiveAt: new Date("2026-05-04T00:00:00.000Z"),
    });

    expect(result.map((date) => date.toISOString())).toEqual([
      "2026-05-11T00:00:00.000Z",
      "2026-05-18T00:00:00.000Z",
    ]);
  });

  it("offers two years of premium launch weeks by default", () => {
    const result = listSelectableLaunchWeeks({
      fromDate: new Date("2026-05-04T00:00:00.000Z"),
      goLiveAt: new Date("2026-05-04T00:00:00.000Z"),
    });

    expect(result).toHaveLength(104);
    expect(result.at(-1)?.toISOString()).toBe("2028-04-24T00:00:00.000Z");
  });

  it("recognizes only anchored launch week starts as valid premium weeks", () => {
    expect(
      isAnchoredLaunchWeekStart(new Date("2026-05-11T00:00:00.000Z"), {
        goLiveAt: new Date("2026-05-04T00:00:00.000Z"),
      }),
    ).toBe(true);

    expect(
      isAnchoredLaunchWeekStart(new Date("2026-05-12T00:00:00.000Z"), {
        goLiveAt: new Date("2026-05-04T00:00:00.000Z"),
      }),
    ).toBe(false);
  });
});
