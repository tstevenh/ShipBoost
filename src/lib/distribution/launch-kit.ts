import { BADGE_HEIGHT, BADGE_WIDTH, type BadgeTheme } from "./badge-svg";

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
  badgeImageUrlLight: string;
  badgeImageUrlDark: string;
  badgeSnippetLight: string;
  badgeSnippetDark: string;
  shareTexts: { twitter: string; linkedin: string };
  shareUrls: { twitter: string; linkedin: string };
};

function normalizeBase(appUrl: string): string {
  return appUrl.replace(/\/+$/, "");
}

/** URL of the combined (artwork + live count) badge image for a theme. */
export function buildBadgeImageUrl({
  appUrl,
  toolId,
  theme,
}: Pick<EmbedSnippetInput, "appUrl" | "toolId" | "theme">): string {
  return `${normalizeBase(appUrl)}/badge/${toolId}?theme=${theme}`;
}

export function buildBadgeEmbedSnippet({
  appUrl,
  slug,
  toolId,
  theme,
}: EmbedSnippetInput): string {
  const base = normalizeBase(appUrl);
  const imageUrl = buildBadgeImageUrl({ appUrl, toolId, theme });
  return `<a href="${base}/tools/${slug}" data-shipboost-badge="free-launch" target="_blank" rel="noopener">
  <img src="${imageUrl}" alt="Featured on ShipBoost" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" style="width:${BADGE_WIDTH}px;height:${BADGE_HEIGHT}px;" />
</a>`;
}

export function buildLaunchKit(input: LaunchKitInput): LaunchKit {
  const base = normalizeBase(input.appUrl);
  const listingUrl = `${base}/tools/${input.slug}`;
  const snippetArgs = { appUrl: input.appUrl, slug: input.slug, toolId: input.toolId };

  const twitterText = `🚀 ${input.name} is live on ShipBoost!\n\n${input.tagline}\n\nA quick upvote would mean a lot 🙏`;
  const linkedinText = `Excited to share that ${input.name} is now live on ShipBoost.\n\n${input.tagline}\n\nIf it's useful to you, an upvote would help us climb this week's board.`;

  return {
    listingUrl,
    badgeImageUrlLight: buildBadgeImageUrl({ ...snippetArgs, theme: "light" }),
    badgeImageUrlDark: buildBadgeImageUrl({ ...snippetArgs, theme: "dark" }),
    badgeSnippetLight: buildBadgeEmbedSnippet({ ...snippetArgs, theme: "light" }),
    badgeSnippetDark: buildBadgeEmbedSnippet({ ...snippetArgs, theme: "dark" }),
    shareTexts: {
      twitter: `${twitterText}\n${listingUrl}`,
      linkedin: `${linkedinText}\n${listingUrl}`,
    },
    shareUrls: {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(listingUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(listingUrl)}`,
    },
  };
}
