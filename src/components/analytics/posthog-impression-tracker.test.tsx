import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { captureBrowserPostHogEventMock, usePathnameMock } = vi.hoisted(() => ({
  captureBrowserPostHogEventMock: vi.fn(),
  usePathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("@/lib/posthog-browser", () => ({
  captureBrowserPostHogEvent: captureBrowserPostHogEventMock,
}));

type IntersectionObserverCallback = ConstructorParameters<
  typeof IntersectionObserver
>[0];

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  callback: IntersectionObserverCallback;
  observed = new Set<Element>();
  disconnected = false;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  observe = (target: Element) => {
    this.observed.add(target);
  };

  unobserve = (target: Element) => {
    this.observed.delete(target);
  };

  disconnect = () => {
    this.disconnected = true;
    this.observed.clear();
  };

  takeRecords = () => [];

  trigger(target: Element, intersectionRatio: number) {
    this.callback(
      [
        {
          target,
          isIntersecting: intersectionRatio > 0,
          intersectionRatio,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
}

import { PostHogImpressionTracker } from "@/components/analytics/posthog-impression-tracker";

describe("PostHogImpressionTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    captureBrowserPostHogEventMock.mockReset();
    MockIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    usePathnameMock.mockReturnValue("/launches/weekly");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("captures a product card impression after the card is viewable for one second", () => {
    const { container } = render(
      <article>
        <PostHogImpressionTracker
          eventName="product_card_impression"
          impressionId="product_card:tool_1:1"
          properties={{
            placement_type: "product_card",
            tool_id: "tool_1",
            tool_slug: "acme",
            tool_name: "Acme",
            source_surface: "launch_board",
            position: 1,
            is_featured: true,
            current_launch_type: "FEATURED",
          }}
        />
      </article>,
    );

    const observer = MockIntersectionObserver.instances[0];
    const target = container.querySelector("article");
    expect(observer).toBeDefined();
    expect(target).toBeTruthy();

    observer.trigger(target!, 0.5);
    vi.advanceTimersByTime(999);
    expect(captureBrowserPostHogEventMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(captureBrowserPostHogEventMock).toHaveBeenCalledWith(
      "product_card_impression",
      expect.objectContaining({
        placement_type: "product_card",
        tool_id: "tool_1",
        tool_slug: "acme",
        tool_name: "Acme",
        source_surface: "launch_board",
        route: "/launches/weekly",
        position: 1,
        is_featured: true,
        current_launch_type: "FEATURED",
        visible_ratio: 0.5,
        viewable_threshold: 0.5,
        viewable_duration_ms: 1000,
      }),
    );
  });

  it("does not capture when visibility drops before one second", () => {
    const { container } = render(
      <aside>
        <PostHogImpressionTracker
          eventName="sponsor_impression"
          impressionId="sidebar_sponsor:placement_1"
          properties={{
            placement_type: "sidebar_sponsor",
            placement_id: "placement_1",
            tool_id: "tool_1",
            tool_slug: "acme",
            tool_name: "Acme",
            source_surface: "sponsor_slot",
          }}
        />
      </aside>,
    );

    const observer = MockIntersectionObserver.instances[0];
    const target = container.querySelector("aside");

    observer.trigger(target!, 0.6);
    vi.advanceTimersByTime(500);
    observer.trigger(target!, 0.2);
    vi.advanceTimersByTime(1000);

    expect(captureBrowserPostHogEventMock).not.toHaveBeenCalled();
  });

  it("does not track private dashboard routes", () => {
    usePathnameMock.mockReturnValue("/dashboard");

    render(
      <article>
        <PostHogImpressionTracker
          eventName="product_card_impression"
          impressionId="product_card:tool_private:1"
          properties={{
            placement_type: "product_card",
            tool_id: "tool_private",
            tool_slug: "private-tool",
            tool_name: "Private Tool",
          }}
        />
      </article>,
    );

    expect(MockIntersectionObserver.instances).toHaveLength(0);
    expect(captureBrowserPostHogEventMock).not.toHaveBeenCalled();
  });
});
