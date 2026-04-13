import type { Metadata } from "next";

import { getEnv } from "@/server/env";

const env = getEnv();

type PublicMetadataInput = {
  title: string;
  description: string;
  url: string;
  openGraphType?: "website" | "article";
  twitterCard?: "summary" | "summary_large_image";
};

function resolveCanonicalUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return new URL(url, env.NEXT_PUBLIC_APP_URL).toString();
}

export function buildPublicPageMetadata(
  input: PublicMetadataInput,
): Metadata {
  const canonical = resolveCanonicalUrl(input.url);

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: "ShipBoost",
      type: input.openGraphType ?? "website",
    },
    twitter: {
      card: input.twitterCard ?? "summary",
      title: input.title,
      description: input.description,
    },
  };
}
