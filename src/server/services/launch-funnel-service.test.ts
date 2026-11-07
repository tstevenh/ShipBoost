import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureMock } = vi.hoisted(() => ({ captureMock: vi.fn() }));

vi.mock("@/server/posthog", () => ({
  capturePostHogEventSafely: captureMock,
}));

import { trackLaunchFunnelEvent } from "@/server/services/launch-funnel-service";

describe("launch-funnel-service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the launch step event to PostHog as the founder", async () => {
    await trackLaunchFunnelEvent(
      { submissionId: "cm0000000000000000000001", event: "launch_type_selected", launchType: "FREE" },
      { id: "user_1" },
    );

    expect(captureMock).toHaveBeenCalledWith(
      {
        distinctId: "user_1",
        event: "launch_type_selected",
        properties: { submission_id: "cm0000000000000000000001", launch_type: "FREE" },
      },
      "trackLaunchFunnelEvent",
    );
  });
});
