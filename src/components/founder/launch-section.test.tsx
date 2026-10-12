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

  it("adds the launch video to a premium checkout", async () => {
    const offer = {
      available: true,
      priceUsd: { premium: 99, standalone: 129 },
      launchPriceSpotsLeft: 7,
      bookedWeekStarts: [],
      standaloneBooked: false,
      demo: null,
    };
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/launch-video/offer") {
        return Promise.resolve({ ok: true, json: async () => ({ data: offer }) });
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

    const checkbox = await screen.findByLabelText(/Add a launch video/);
    expect(
      screen.getByText("Launch price for the first 10 videos · 7 left · $149 after that"),
    ).toBeInTheDocument();

    fireEvent.click(checkbox);
    fireEvent.change(screen.getByLabelText(/What should people see your product do/), {
      target: { value: "Paste a URL, get a report" },
    });

    expect(screen.getByText("Premium Launch + launch video")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue to checkout — $118" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/dodo/checkout/launch-bundle",
        expect.objectContaining({
          body: expect.stringContaining(
            '"launchVideo":{"focusNote":"Paste a URL, get a report"}',
          ),
        }),
      );
    });
  });

  it("blocks the launch video when the week is fully booked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () =>
            url === "/api/launch-video/offer"
              ? {
                  data: {
                    available: true,
                    priceUsd: { premium: 99, standalone: 129 },
                    launchPriceSpotsLeft: 0,
                    bookedWeekStarts: ["2099-10-19T00:00:00.000Z"],
                    standaloneBooked: true,
                    demo: null,
                  },
                }
              : { data: {} },
        }),
      ),
    );

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
        freeLaunchRequirements={{
          badgeVerification: "VERIFIED",
          boardTools: [],
          eligibleCount: 0,
          requiredCount: 0,
        }}
      />,
    );

    expect(await screen.findByLabelText(/Add a launch video/)).toBeDisabled();
    expect(
      screen.getByText("Booked for this launch week. Pick another week to add a video."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Free launch").closest("button") as HTMLButtonElement);

    expect(screen.getByLabelText(/Add a launch video/)).toBeDisabled();
    expect(
      screen.getByText("Fully booked this week. Check back next week."),
    ).toBeInTheDocument();
  });

  it("sells the launch video to free launchers at the standalone price", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: async () =>
          url === "/api/launch-video/offer"
            ? {
                data: {
                  available: true,
                  priceUsd: { premium: 99, standalone: 129 },
                  launchPriceSpotsLeft: 7,
                  bookedWeekStarts: [],
                  standaloneBooked: false,
                  demo: null,
                },
              }
            : {
                data: {
                  checkoutUrl: null,
                  launchScheduled: false,
                  scheduledLaunch: null,
                  submission: null,
                },
              },
      }),
    );
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
        freeLaunchRequirements={{
          badgeVerification: "VERIFIED",
          boardTools: [],
          eligibleCount: 0,
          requiredCount: 0,
        }}
      />,
    );

    expect(
      await screen.findByText("Launch video add-on for $99 ($129 without Premium)"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Free launch").closest("button") as HTMLButtonElement);
    fireEvent.click(screen.getByLabelText(/Add a launch video/));

    expect(screen.getByText("Delivered within 7 days of your order")).toBeInTheDocument();
    expect(screen.getByText("Premium Launch + video is $118")).toBeInTheDocument();
    expect(screen.getByText("Free Launch + launch video")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue to checkout — $129" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/dodo/checkout/launch-bundle",
        expect.objectContaining({
          body: expect.stringContaining('"launchType":"FREE"'),
        }),
      );
    });
    const checkoutCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/dodo/checkout/launch-bundle",
    );
    expect(JSON.parse(checkoutCall?.[1]?.body as string).launchVideo).toEqual({});

    fireEvent.click(screen.getByRole("button", { name: "Switch to Premium" }));
    expect(screen.getByRole("button", { name: "Continue to checkout — $118" })).toBeInTheDocument();
  });

  it("starts with the launch video ticked when the founder came from the pricing page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () =>
            url === "/api/launch-video/offer"
              ? {
                  data: {
                    available: true,
                    priceUsd: { premium: 99, standalone: 129 },
                    launchPriceSpotsLeft: 7,
                    bookedWeekStarts: [],
                    standaloneBooked: false,
                    demo: null,
                  },
                }
              : { data: {} },
        }),
      ),
    );

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
        initialLaunchVideoSelected
      />,
    );

    expect(await screen.findByLabelText(/Add a launch video/)).toBeChecked();
    expect(screen.getByRole("button", { name: "Continue to checkout — $118" })).toBeInTheDocument();
  });
});
