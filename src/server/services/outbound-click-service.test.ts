import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, getSessionFromRequestMock, capturePostHogEventMock } =
  vi.hoisted(() => ({
    prismaMock: {
      tool: {
        findFirst: vi.fn(),
      },
    },
    getSessionFromRequestMock: vi.fn(),
    capturePostHogEventMock: vi.fn(),
  }));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/auth/session", () => ({
  getSessionFromRequest: getSessionFromRequestMock,
}));

vi.mock("@/server/posthog", () => ({
  capturePostHogEvent: capturePostHogEventMock,
}));

import { resolveTrackedToolOutboundClick } from "@/server/services/outbound-click-service";

describe("outbound-click-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves a tracked website redirect and captures the event", async () => {
    prismaMock.tool.findFirst.mockResolvedValueOnce({
      id: "tool_1",
      slug: "acme",
      name: "Acme",
      websiteUrl: "https://acme.com",
      affiliateUrl: "https://partner.com/acme",
      isFeatured: true,
      currentLaunchType: "FEATURED",
    });
    getSessionFromRequestMock.mockResolvedValueOnce({
      user: {
        id: "user_1",
      },
    });

    const request = new Request("http://localhost:3000");
    const result = await resolveTrackedToolOutboundClick({
      toolId: "tool_1",
      target: "website",
      source: "tool_page",
      referer: "http://localhost:3000/tools/acme?tab=overview",
      request,
    });

    expect(result.destinationUrl).toBe("https://acme.com");
    expect(capturePostHogEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: "user_1",
        event: "tool_outbound_click",
        properties: expect.objectContaining({
          tool_id: "tool_1",
          destination_type: "website",
          source_surface: "tool_page",
          source_path: "/tools/acme?tab=overview",
        }),
      }),
    );
  });

  it("resolves a tracked affiliate redirect", async () => {
    prismaMock.tool.findFirst.mockResolvedValueOnce({
      id: "tool_1",
      slug: "acme",
      name: "Acme",
      websiteUrl: "https://acme.com",
      affiliateUrl: "https://partner.com/acme",
      isFeatured: false,
      currentLaunchType: null,
    });
    getSessionFromRequestMock.mockResolvedValueOnce(null);

    const result = await resolveTrackedToolOutboundClick({
      toolId: "tool_1",
      target: "affiliate",
      source: "alternatives_page",
      referer: "http://localhost:3000/alternatives/acme",
      request: new Request("http://localhost:3000"),
    });

    expect(result.destinationUrl).toBe("https://partner.com/acme");
  });

  it("rejects missing affiliate links", async () => {
    prismaMock.tool.findFirst.mockResolvedValueOnce({
      id: "tool_1",
      slug: "acme",
      name: "Acme",
      websiteUrl: "https://acme.com",
      affiliateUrl: null,
      isFeatured: false,
      currentLaunchType: null,
    });

    await expect(
      resolveTrackedToolOutboundClick({
        toolId: "tool_1",
        target: "affiliate",
        source: "category_page",
        referer: null,
        request: new Request("http://localhost:3000"),
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Affiliate link not found.",
    });
  });

  it("rejects hidden tools", async () => {
    prismaMock.tool.findFirst.mockResolvedValueOnce(null);

    await expect(
      resolveTrackedToolOutboundClick({
        toolId: "tool_hidden",
        target: "website",
        source: "launch_board",
        referer: null,
        request: new Request("http://localhost:3000"),
      }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Tool not found.",
    });
  });

  it("still resolves redirect when PostHog capture fails", async () => {
    prismaMock.tool.findFirst.mockResolvedValueOnce({
      id: "tool_1",
      slug: "acme",
      name: "Acme",
      websiteUrl: "https://acme.com",
      affiliateUrl: null,
      isFeatured: false,
      currentLaunchType: null,
    });
    getSessionFromRequestMock.mockResolvedValueOnce(null);
    capturePostHogEventMock.mockRejectedValueOnce(new Error("boom"));

    const result = await resolveTrackedToolOutboundClick({
      toolId: "tool_1",
      target: "website",
      source: "launch_board",
      referer: null,
      request: new Request("http://localhost:3000"),
    });

    expect(result.destinationUrl).toBe("https://acme.com");
  });
});
