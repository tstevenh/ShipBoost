import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  clearPendingAuthIntentMock,
  getPendingAuthIntentMock,
  posthogCaptureMock,
  posthogIdentifyMock,
  posthogInitMock,
  posthogResetMock,
  useSessionMock,
} = vi.hoisted(() => ({
  clearPendingAuthIntentMock: vi.fn(),
  getPendingAuthIntentMock: vi.fn(),
  posthogCaptureMock: vi.fn(),
  posthogIdentifyMock: vi.fn(),
  posthogInitMock: vi.fn(),
  posthogResetMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: {
    capture: posthogCaptureMock,
    identify: posthogIdentifyMock,
    init: posthogInitMock,
    reset: posthogResetMock,
  },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: useSessionMock,
  },
}));

vi.mock("@/lib/posthog-browser", () => ({
  clearPendingAuthIntent: clearPendingAuthIntentMock,
  getPendingAuthIntent: getPendingAuthIntentMock,
}));

import {
  PostHogPageTracker,
  resetPostHogPageTrackerForTest,
} from "@/components/analytics/posthog-page-tracker";

describe("posthog-page-tracker", () => {
  beforeEach(() => {
    clearPendingAuthIntentMock.mockReset();
    getPendingAuthIntentMock.mockReset();
    posthogCaptureMock.mockReset();
    posthogIdentifyMock.mockReset();
    posthogInitMock.mockReset();
    posthogResetMock.mockReset();
    resetPostHogPageTrackerForTest();
    useSessionMock.mockReturnValue({ data: null, isPending: false });
  });

  afterEach(() => {
    resetPostHogPageTrackerForTest();
  });

  it("does not initialize when the api key is missing", () => {
    render(<PostHogPageTracker />);

    expect(posthogInitMock).not.toHaveBeenCalled();
  });

  it("initializes PostHog with pageview-only browser tracking", () => {
    render(
      <PostHogPageTracker
        apiKey="phc_test"
        apiHost="https://us.i.posthog.com"
      />,
    );

    expect(posthogInitMock).toHaveBeenCalledWith("phc_test", {
      api_host: "https://us.i.posthog.com",
      defaults: "2026-01-30",
      autocapture: false,
      capture_pageview: "history_change",
      capture_pageleave: false,
    });
  });

  it("initializes only once even if rendered again", () => {
    const { rerender } = render(
      <PostHogPageTracker
        apiKey="phc_test"
        apiHost="https://us.i.posthog.com"
      />,
    );

    rerender(
      <PostHogPageTracker
        apiKey="phc_test"
        apiHost="https://us.i.posthog.com"
      />,
    );

    expect(posthogInitMock).toHaveBeenCalledTimes(1);
  });

  it("identifies a new authenticated session and emits sign-in completion", () => {
    useSessionMock.mockReturnValue({
      data: {
        user: {
          id: "user_1",
          email: "founder@example.com",
          name: "Founder",
          role: "FOUNDER",
        },
      },
      isPending: false,
    });
    getPendingAuthIntentMock.mockReturnValue({
      intent: "sign-in",
      method: "magic_link",
      email: "founder@example.com",
      redirectTo: "/dashboard",
      source: "auth_form",
      createdAt: Date.now(),
    });

    render(
      <PostHogPageTracker
        apiKey="phc_test"
        apiHost="https://us.i.posthog.com"
      />,
    );

    expect(posthogIdentifyMock).toHaveBeenCalledWith("user_1", {
      email: "founder@example.com",
      name: "Founder",
      role: "FOUNDER",
    });
    expect(posthogCaptureMock).toHaveBeenCalledWith("sign_in_completed", {
      auth_method: "magic_link",
      auth_source: "auth_form",
      email_domain: "example.com",
      redirect_to: "/dashboard",
    });
    expect(clearPendingAuthIntentMock).toHaveBeenCalledTimes(1);
  });

  it("resets PostHog after sign-out", () => {
    useSessionMock
      .mockReturnValueOnce({
        data: {
          user: {
            id: "user_1",
            email: "founder@example.com",
            name: "Founder",
            role: "FOUNDER",
          },
        },
        isPending: false,
      })
      .mockReturnValueOnce({ data: null, isPending: false });

    const { rerender } = render(
      <PostHogPageTracker
        apiKey="phc_test"
        apiHost="https://us.i.posthog.com"
      />,
    );

    rerender(
      <PostHogPageTracker
        apiKey="phc_test"
        apiHost="https://us.i.posthog.com"
      />,
    );

    expect(posthogResetMock).toHaveBeenCalledTimes(1);
  });
});
