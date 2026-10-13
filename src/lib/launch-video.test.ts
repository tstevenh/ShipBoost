import { describe, expect, it } from "vitest";

import { getLaunchVideoAddOn } from "@/lib/launch-video";

const now = new Date("2026-10-13T09:00:00.000Z");
const offer = {
  available: true,
  priceUsd: { premium: 99, standalone: 129 },
};

function submission(overrides: Partial<Parameters<typeof getLaunchVideoAddOn>[0]> = {}) {
  return {
    submissionType: "FEATURED_LAUNCH" as const,
    paymentStatus: "PAID" as const,
    hasVideo: false,
    launches: [
      { launchType: "FEATURED" as const, status: "APPROVED" as const, launchDate: "2026-10-19T00:00:00.000Z" },
    ],
    ...overrides,
  };
}

describe("getLaunchVideoAddOn", () => {
  it("offers the Premium price to a paid Premium launch before its week starts", () => {
    expect(getLaunchVideoAddOn(submission(), offer, now)).toEqual({
      ok: true,
      mode: "premium",
      delivery: "launch_week",
      priceUsd: 99,
      launchWeekStart: "2026-10-19T00:00:00.000Z",
    });
  });

  it("keeps the Premium price with 7-day delivery once the launch week has started", () => {
    expect(
      getLaunchVideoAddOn(submission(), offer, new Date("2026-10-19T08:00:00.000Z")),
    ).toEqual({
      ok: true,
      mode: "premium",
      delivery: "seven_days",
      priceUsd: 99,
      launchWeekStart: "2026-10-19T00:00:00.000Z",
    });

    for (const status of ["LIVE", "ENDED"] as const) {
      expect(
        getLaunchVideoAddOn(
          submission({
            launches: [{ launchType: "FEATURED", status, launchDate: "2026-06-01T00:00:00.000Z" }],
          }),
          offer,
          now,
        ),
      ).toMatchObject({ mode: "premium", delivery: "seven_days", priceUsd: 99 });
    }
  });

  it("offers the standalone price to free launches that already ended", () => {
    expect(
      getLaunchVideoAddOn(
        submission({
          submissionType: "FREE_LAUNCH",
          paymentStatus: "NOT_REQUIRED",
          launches: [{ launchType: "FREE", status: "ENDED", launchDate: "2026-09-07T00:00:00.000Z" }],
        }),
        offer,
        now,
      ),
    ).toMatchObject({ ok: true, mode: "standalone", delivery: "seven_days", priceUsd: 129 });
  });

  it("compares against the most recent launch", () => {
    expect(
      getLaunchVideoAddOn(
        submission({
          submissionType: "FREE_LAUNCH",
          paymentStatus: "NOT_REQUIRED",
          launches: [
            { launchType: "FREE", status: "ENDED", launchDate: "2026-06-01T00:00:00.000Z" },
            { launchType: "FREE", status: "APPROVED", launchDate: "2026-12-07T00:00:00.000Z" },
          ],
        }),
        offer,
        now,
      ),
    ).toMatchObject({ launchWeekStart: "2026-12-07T00:00:00.000Z" });
  });

  it("offers the standalone price to a free launch, live or scheduled", () => {
    for (const status of ["APPROVED", "LIVE"] as const) {
      expect(
        getLaunchVideoAddOn(
          submission({
            submissionType: "FREE_LAUNCH",
            paymentStatus: "NOT_REQUIRED",
            launches: [{ launchType: "FREE", status, launchDate: "2026-12-07T00:00:00.000Z" }],
          }),
          offer,
          now,
        ),
      ).toMatchObject({ ok: true, mode: "standalone", priceUsd: 129 });
    }
  });

  it("uses the free launch when a Premium checkout was started but never paid", () => {
    expect(
      getLaunchVideoAddOn(
        submission({
          paymentStatus: "PENDING",
          launches: [{ launchType: "FREE", status: "APPROVED", launchDate: "2026-12-07T00:00:00.000Z" }],
        }),
        offer,
        now,
      ),
    ).toMatchObject({ ok: true, mode: "standalone" });
  });

  it("skips launches that already have a video, were rejected, or when the offer is off", () => {
    expect(getLaunchVideoAddOn(submission({ hasVideo: true }), offer, now)).toEqual({
      ok: false,
      reason: "has_video",
    });
    expect(getLaunchVideoAddOn(submission(), { ...offer, available: false }, now)).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(
      getLaunchVideoAddOn(
        submission({
          submissionType: "FREE_LAUNCH",
          launches: [{ launchType: "FREE", status: "REJECTED", launchDate: "2026-09-07T00:00:00.000Z" }],
        }),
        offer,
        now,
      ),
    ).toEqual({ ok: false, reason: "no_launch" });
  });
});
