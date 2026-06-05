import { describe, expect, it } from "vitest";
import { buildBadgeEmbedSnippet, buildLaunchKit } from "./launch-kit";

const base = { appUrl: "https://shipboost.com/", slug: "acme", toolId: "tool_123" };

describe("buildBadgeEmbedSnippet", () => {
  it("links to the listing, carries the verification marker, and embeds the single combined badge image", () => {
    const snippet = buildBadgeEmbedSnippet({ ...base, theme: "dark" });
    expect(snippet).toContain('href="https://shipboost.com/tools/acme"');
    expect(snippet).toContain('data-shipboost-badge="free-launch"');
    expect(snippet).toContain('src="https://shipboost.com/badge/tool_123?theme=dark"');
    // single <img> now (count is inside the badge), not two
    expect(snippet.match(/<img/g)?.length).toBe(1);
  });

  it("uses the light theme when theme=light", () => {
    const snippet = buildBadgeEmbedSnippet({ ...base, theme: "light" });
    expect(snippet).toContain("/badge/tool_123?theme=light");
  });

  it("never double-slashes when appUrl has a trailing slash", () => {
    expect(buildBadgeEmbedSnippet({ ...base, theme: "dark" })).not.toContain("com//");
  });
});

describe("buildLaunchKit", () => {
  it("returns listing url, badge image urls + snippets per theme, and share text/urls", () => {
    const kit = buildLaunchKit({ ...base, name: "Acme", tagline: "Ship faster" });
    expect(kit.listingUrl).toBe("https://shipboost.com/tools/acme");
    expect(kit.badgeImageUrlDark).toBe("https://shipboost.com/badge/tool_123?theme=dark");
    expect(kit.badgeImageUrlLight).toBe("https://shipboost.com/badge/tool_123?theme=light");
    expect(kit.badgeSnippetDark).toContain("?theme=dark");
    expect(kit.badgeSnippetLight).toContain("?theme=light");
    expect(kit.shareTexts.twitter).toContain("Acme");
    expect(kit.shareTexts.twitter).toContain(kit.listingUrl);
    expect(kit.shareTexts.linkedin).toContain("Ship faster");
    expect(kit.shareUrls.twitter).toContain("twitter.com/intent/tweet");
    expect(kit.shareUrls.linkedin).toContain("linkedin.com");
  });
});
