import { describe, expect, it } from "vitest";

import { getToolTimelineDisplay } from "@/server/services/tool-page";

describe("getToolTimelineDisplay", () => {
  it("uses the latest real launch date when launches exist", () => {
    const result = getToolTimelineDisplay({
      createdAt: new Date("2026-04-09T00:00:00.000Z"),
      launches: [
        { launchDate: new Date("2026-04-13T00:00:00.000Z") },
        { launchDate: new Date("2026-04-11T00:00:00.000Z") },
      ],
    });

    expect(result.label).toBe("Launch Date");
    expect(result.date.toISOString()).toBe("2026-04-13T00:00:00.000Z");
  });

  it("falls back to createdAt when a tool has no launches", () => {
    const result = getToolTimelineDisplay({
      createdAt: new Date("2026-04-09T00:00:00.000Z"),
      launches: [],
    });

    expect(result.label).toBe("Listed");
    expect(result.date.toISOString()).toBe("2026-04-09T00:00:00.000Z");
  });

  it("falls back to createdAt when launches are missing", () => {
    const result = getToolTimelineDisplay({
      createdAt: new Date("2026-04-09T00:00:00.000Z"),
    });

    expect(result.label).toBe("Listed");
    expect(result.date.toISOString()).toBe("2026-04-09T00:00:00.000Z");
  });
});
