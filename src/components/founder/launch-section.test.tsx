import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LaunchSection } from "@/components/founder/launch-section";

let revealFreeRequirements: (() => void) | null = null;

beforeEach(() => {
  revealFreeRequirements = null;
  class MockIntersectionObserver {
    readonly observe = vi.fn();
    readonly unobserve = vi.fn();
    readonly disconnect = vi.fn();
    readonly takeRecords = vi.fn(() => []);

    constructor(callback: IntersectionObserverCallback) {
      revealFreeRequirements = () => {
        callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      };
    }
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    }),
  );
});

describe("LaunchSection", () => {
  it("does not offer a discounted Premium Launch to free launchers", () => {
    render(
      <LaunchSection
        submissionId="submission_1"
        toolId="tool_1"
        freeLaunchEstimateDate="2099-10-19T00:00:00.000Z"
        premiumLaunchWeeks={[
          { value: "2099-10-19", label: "Week of Oct 19, 2099" },
        ]}
        foundingPremiumSpotsLeft={0}
        foundingPremiumLaunchLimit={20}
        paidPremiumLaunchCount={20}
        currentScheduledLaunch={null}
        isPremiumScheduled={false}
        isFreeScheduled={false}
        onBack={vi.fn()}
        onFreeScheduled={vi.fn()}
        badges={[]}
        freeLaunchRequirements={{
          badgeVerification: "VERIFIED",
          boardTools: [],
          eligibleCount: 0,
          requiredCount: 0,
        }}
      />,
    );

    const freeLaunchCard = screen.getByText("Free launch").closest("button");
    expect(freeLaunchCard).not.toBeNull();
    fireEvent.click(freeLaunchCard as HTMLButtonElement);
    act(() => {
      revealFreeRequirements?.();
    });

    expect(screen.queryByText(/Unlock Premium Launch/)).not.toBeInTheDocument();
    expect(screen.queryByText(/LAUNCH9/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Schedule free launch" }),
    ).toBeInTheDocument();
  });

  it("keeps the launch video out of the launch step", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { checkoutUrl: null, launchScheduled: false, scheduledLaunch: null, submission: null },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LaunchSection
        submissionId="submission_1"
        toolId="tool_1"
        freeLaunchEstimateDate="2099-10-19T00:00:00.000Z"
        premiumLaunchWeeks={[{ value: "2099-10-19", label: "Week of Oct 19, 2099" }]}
        foundingPremiumSpotsLeft={0}
        foundingPremiumLaunchLimit={20}
        paidPremiumLaunchCount={20}
        currentScheduledLaunch={null}
        isPremiumScheduled={false}
        isFreeScheduled={false}
        onBack={vi.fn()}
        onFreeScheduled={vi.fn()}
        badges={[]}
        freeLaunchRequirements={null}
      />,
    );

    expect(screen.queryByLabelText(/Add a launch video/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Launch video add-on/)).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/launch-video/offer");

    fireEvent.click(screen.getByRole("button", { name: "Continue to checkout — $19" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/dodo/checkout/launch-bundle",
        expect.anything(),
      );
    });
    const checkoutCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/dodo/checkout/launch-bundle",
    );
    expect(JSON.parse(checkoutCall?.[1]?.body as string)).not.toHaveProperty("launchVideo");
  });

  it("tracks the launch step view and each launch type pick", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LaunchSection
        submissionId="submission_1"
        toolId={null}
        freeLaunchEstimateDate="2099-10-19T00:00:00.000Z"
        premiumLaunchWeeks={[{ value: "2099-10-19", label: "Week of Oct 19, 2099" }]}
        foundingPremiumSpotsLeft={0}
        foundingPremiumLaunchLimit={20}
        paidPremiumLaunchCount={20}
        currentScheduledLaunch={null}
        isPremiumScheduled={false}
        isFreeScheduled={false}
        onBack={vi.fn()}
        onFreeScheduled={vi.fn()}
        badges={[]}
        freeLaunchRequirements={null}
      />,
    );

    fireEvent.click(screen.getByText("Free launch").closest("button") as HTMLButtonElement);

    await waitFor(() => {
      const funnelBodies = fetchMock.mock.calls
        .filter(([url]) => url === "/api/submissions/submission_1/launch-funnel")
        .map(([, init]) => JSON.parse((init as RequestInit).body as string));
      expect(funnelBodies).toEqual([
        { event: "launch_step_viewed", launchType: "FEATURED" },
        { event: "launch_type_selected", launchType: "FREE" },
      ]);
    });
  });
});
