import type { BadgeTheme } from "./count-chip-svg";

export type EmbedSnippetInput = {
  appUrl: string;
  slug: string;
  toolId: string;
  theme: BadgeTheme;
};

export type LaunchKitInput = {
  appUrl: string;
  slug: string;
  toolId: string;
  name: string;
  tagline: string;
};

export type LaunchKit = {
  listingUrl: string;
  badgeSnippetLight: string;
  badgeSnippetDark: string;
  shareTexts: { twitter: string; linkedin: string };
};

function normalizeBase(appUrl: string): string {
  return appUrl.replace(/\/+$/, "");
}

export function buildBadgeEmbedSnippet({
  appUrl,
  slug,
  toolId,
  theme,
}: EmbedSnippetInput): string {
  const base = normalizeBase(appUrl);
  return `<a href="${base}/tools/${slug}" data-shipboost-badge="free-launch" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;">
  <img src="${base}/badge/featured-${theme}.svg" alt="Featured on ShipBoost" height="40" />
  <img src="${base}/badge/count/${toolId}?theme=${theme}" alt="upvotes on ShipBoost" width="92" height="40" />
</a>`;
}

export function buildLaunchKit(input: LaunchKitInput): LaunchKit {
  const base = normalizeBase(input.appUrl);
  const listingUrl = `${base}/tools/${input.slug}`;
  const snippetArgs = { appUrl: input.appUrl, slug: input.slug, toolId: input.toolId };

  return {
    listingUrl,
    badgeSnippetLight: buildBadgeEmbedSnippet({ ...snippetArgs, theme: "light" }),
    badgeSnippetDark: buildBadgeEmbedSnippet({ ...snippetArgs, theme: "dark" }),
    shareTexts: {
      twitter: `🚀 ${input.name} is live on ShipBoost!\n\n${input.tagline}\n\nA quick upvote would mean a lot 🙏\n${listingUrl}`,
      linkedin: `Excited to share that ${input.name} is now live on ShipBoost.\n\n${input.tagline}\n\nIf it's useful to you, an upvote would help us climb this week's board: ${listingUrl}`,
    },
  };
}
