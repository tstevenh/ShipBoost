import { describe, expect, it } from "vitest";
import { buildBadgeEmbedSnippet, buildLaunchKit } from "./launch-kit";

const base = { appUrl: "https://shipboost.com/", slug: "acme", toolId: "tool_123" };

describe("buildBadgeEmbedSnippet", () => {
  it("links to the listing, carries the verification marker, and pairs badge + count chip", () => {
    const snippet = buildBadgeEmbedSnippet({ ...base, theme: "dark" });
    expect(snippet).toContain('href="https://shipboost.com/tools/acme"');
    expect(snippet).toContain('data-shipboost-badge="free-launch"');
    expect(snippet).toContain('src="https://shipboost.com/badge/featured-dark.svg"');
    expect(snippet).toContain('src="https://shipboost.com/badge/count/tool_123?theme=dark"');
  });

  it("uses the light asset + light theme when theme=light", () => {
    const snippet = buildBadgeEmbedSnippet({ ...base, theme: "light" });
    expect(snippet).toContain("featured-light.svg");
    expect(snippet).toContain("?theme=light");
  });

  it("never double-slashes when appUrl has a trailing slash", () => {
    expect(buildBadgeEmbedSnippet({ ...base, theme: "dark" })).not.toContain("com//");
  });
});

describe("buildLaunchKit", () => {
  it("returns listing url, both badge themes, and share texts with name + url", () => {
    const kit = buildLaunchKit({ ...base, name: "Acme", tagline: "Ship faster" });
    expect(kit.listingUrl).toBe("https://shipboost.com/tools/acme");
    expect(kit.badgeSnippetDark).toContain("featured-dark.svg");
    expect(kit.badgeSnippetLight).toContain("featured-light.svg");
    expect(kit.shareTexts.twitter).toContain("Acme");
    expect(kit.shareTexts.twitter).toContain(kit.listingUrl);
    expect(kit.shareTexts.linkedin).toContain("Ship faster");
  });
});
