import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  posthogInitMock,
} = vi.hoisted(() => ({
  posthogInitMock: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: {
    init: posthogInitMock,
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));

import {
  PostHogPageTracker,
  resetPostHogPageTrackerForTest,
} from "@/components/analytics/posthog-page-tracker";

describe("posthog-page-tracker", () => {
  beforeEach(() => {
    posthogInitMock.mockReset();
    resetPostHogPageTrackerForTest();
  });

  afterEach(() => {
    resetPostHogPageTrackerForTest();
  });

  it("does not initialize when the api key is missing", () => {
    render(<PostHogPageTracker />);

    expect(posthogInitMock).not.toHaveBeenCalled();
  });

  it("initializes PostHog with anonymous pageview tracking", () => {
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

});
