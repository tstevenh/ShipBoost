import { describe, expect, it, vi } from "vitest";

import {
  getPremiumLaunchMonthIndexForDate,
  groupPremiumLaunchWeeksByMonth,
} from "@/components/founder/submit-product-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("submit-product-form scheduling helpers", () => {
  it("groups premium launch weeks by UTC month for calendar navigation", () => {
    const months = groupPremiumLaunchWeeksByMonth([
      { value: "2026-05-04", label: "Week of May 4, 2026" },
      { value: "2026-05-11", label: "Week of May 11, 2026" },
      { value: "2026-06-01", label: "Week of June 1, 2026" },
    ]);

    expect(months).toEqual([
      {
        key: "2026-05",
        label: "May 2026",
        weeks: [
          { value: "2026-05-04", label: "Week of May 4, 2026" },
          { value: "2026-05-11", label: "Week of May 11, 2026" },
        ],
      },
      {
        key: "2026-06",
        label: "June 2026",
        weeks: [{ value: "2026-06-01", label: "Week of June 1, 2026" }],
      },
    ]);
  });

  it("opens the calendar on the selected premium launch month", () => {
    const months = groupPremiumLaunchWeeksByMonth([
      { value: "2026-05-04", label: "Week of May 4, 2026" },
      { value: "2027-01-04", label: "Week of January 4, 2027" },
    ]);

    expect(getPremiumLaunchMonthIndexForDate(months, "2027-01-04")).toBe(1);
    expect(getPremiumLaunchMonthIndexForDate(months, "2028-01-03")).toBe(0);
  });
});
