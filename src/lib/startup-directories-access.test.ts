import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  captureBrowserPostHogEventMock,
  signInMagicLinkMock,
} = vi.hoisted(() => ({
  captureBrowserPostHogEventMock: vi.fn(),
  signInMagicLinkMock: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      magicLink: signInMagicLinkMock,
    },
  },
}));

vi.mock("@/lib/posthog-browser", () => ({
  captureBrowserPostHogEvent: captureBrowserPostHogEventMock,
}));

import { requestStartupDirectoriesAccess } from "@/lib/startup-directories-access";

describe("startup-directories-access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures the lead event after the access link succeeds", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "lead_1" }), { status: 201 }),
    );
    signInMagicLinkMock.mockResolvedValueOnce({});

    await requestStartupDirectoriesAccess({
      email: "Founder@Example.com",
      source: "home_page",
      leadMagnet: "startup-directories",
      utmSource: "twitter",
      utmMedium: "social",
      utmCampaign: "founder-thread",
    });

    expect(captureBrowserPostHogEventMock).toHaveBeenCalledWith(
      "lead_magnet_submitted",
      expect.objectContaining({
        source: "home_page",
        lead_magnet: "startup-directories",
        email_domain: "example.com",
        utm_source: "twitter",
        utm_medium: "social",
        utm_campaign: "founder-thread",
      }),
    );
    expect(signInMagicLinkMock).toHaveBeenCalledWith({
      email: "founder@example.com",
      callbackURL: "/resources/startup-directories",
      metadata: {
        intent: "directories-access",
        resource: "startup-directories",
      },
    });
    fetchMock.mockRestore();
  });
});
