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
        count: vi.fn().mockResolvedValue(0),
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
        count: vi.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(3),
      },
    };

    const result = await scheduleNextFreeLaunchDate(db as never, {
      weeklySlots: 10,
      fromDate: new Date("2026-05-04T00:00:00.000Z"),
      goLiveAt: new Date("2026-05-04T00:00:00.000Z"),
    });

    expect(result.toISOString()).toBe("2026-05-11T00:00:00.000Z");
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
