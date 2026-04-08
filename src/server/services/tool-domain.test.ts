import { describe, expect, it, vi } from "vitest";

import {
  buildDuplicateSubmissionDetails,
  findDuplicateToolByRootDomain,
  getToolRootDomain,
} from "@/server/services/tool-domain";

describe("tool-domain", () => {
  it("extracts root domains from plain domains and subdomains", () => {
    expect(getToolRootDomain("https://acme.com")).toBe("acme.com");
    expect(getToolRootDomain("https://www.acme.com")).toBe("acme.com");
    expect(getToolRootDomain("https://app.acme.com")).toBe("acme.com");
  });

  it("throws for invalid website URLs", () => {
    expect(() => getToolRootDomain("not-a-url")).toThrow(
      "Website URL must be a valid public URL.",
    );
  });

  it("finds duplicates by root domain while excluding the current tool", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "tool_1",
        slug: "acme",
        name: "Acme",
        ownerUserId: "user_1",
        websiteUrl: "https://www.acme.com",
      },
      {
        id: "tool_2",
        slug: "other",
        name: "Other",
        ownerUserId: "user_2",
        websiteUrl: "https://other.com",
      },
    ]);

    const duplicate = await findDuplicateToolByRootDomain(
      {
        tool: {
          findMany,
        },
      },
      "https://app.acme.com",
      { excludeToolId: "tool_current" },
    );

    expect(duplicate?.id).toBe("tool_1");
  });

  it("builds founder-facing duplicate metadata", () => {
    expect(
      buildDuplicateSubmissionDetails(
        {
          id: "tool_1",
          slug: "acme",
          name: "Acme",
          ownerUserId: "user_1",
        },
        "user_1",
      ),
    ).toEqual({
      duplicateTool: {
        id: "tool_1",
        slug: "acme",
        name: "Acme",
        ownedByYou: true,
        ctaHref: "/dashboard/tools/tool_1",
        ctaLabel: "Manage existing listing",
      },
    });
  });
});
