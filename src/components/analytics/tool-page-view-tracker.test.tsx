import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureBrowserPostHogEventMock } = vi.hoisted(() => ({
  captureBrowserPostHogEventMock: vi.fn(),
}));

vi.mock("@/lib/posthog-browser", () => ({
  captureBrowserPostHogEvent: captureBrowserPostHogEventMock,
}));

import { ToolPageViewTracker } from "@/components/analytics/tool-page-view-tracker";

describe("ToolPageViewTracker", () => {
  beforeEach(() => {
    captureBrowserPostHogEventMock.mockReset();
  });

  it("captures a tool page view once per tool slug", () => {
    const { rerender } = render(
      <ToolPageViewTracker
        toolId="tool_1"
        toolSlug="acme"
        toolName="Acme"
        categorySlugs={["marketing"]}
        tagSlugs={["seo"]}
      />,
    );

    expect(captureBrowserPostHogEventMock).toHaveBeenCalledWith(
      "tool_page_viewed",
      {
        tool_id: "tool_1",
        tool_slug: "acme",
        tool_name: "Acme",
        category_slugs: ["marketing"],
        tag_slugs: ["seo"],
        page_type: "tool_page",
        source_surface: "tool_page",
      },
    );

    rerender(
      <ToolPageViewTracker
        toolId="tool_1"
        toolSlug="acme"
        toolName="Acme"
        categorySlugs={["marketing"]}
        tagSlugs={["seo"]}
      />,
    );

    expect(captureBrowserPostHogEventMock).toHaveBeenCalledTimes(1);
  });

  it("does not capture when disabled", () => {
    render(
      <ToolPageViewTracker
        enabled={false}
        toolId="tool_1"
        toolSlug="acme"
        toolName="Acme"
        categorySlugs={[]}
        tagSlugs={[]}
      />,
    );

    expect(captureBrowserPostHogEventMock).not.toHaveBeenCalled();
  });
});
