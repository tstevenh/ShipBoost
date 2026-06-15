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
  it("shows the LAUNCH9 upgrade offer after Free Launch requirements are viewed", () => {
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

    expect(
      screen.queryByText("Unlock Premium Launch for $9"),
    ).not.toBeInTheDocument();

    act(() => {
      revealFreeRequirements?.();
    });

    expect(screen.getByText("Unlock Premium Launch for $9")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose week" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Schedule free launch" }),
    ).toBeInTheDocument();
  });

  it("passes LAUNCH9 to premium checkout from the Free Launch offer", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/sponsor/eligibility") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: {} }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: {
            checkoutUrl: null,
            launchScheduled: false,
            scheduledLaunch: null,
            submission: null,
          },
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

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
    fireEvent.click(screen.getByRole("button", { name: "Choose week" }));

    expect(screen.getByText("LAUNCH9")).toBeInTheDocument();
    expect(screen.getByText(/applied at checkout/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue to checkout — $9" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue to checkout — $9" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/dodo/checkout/launch-bundle",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"discountCode":"LAUNCH9"'),
        }),
      );
    });
  });
});
