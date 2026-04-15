import type { Metadata } from "next";

import { getEnv } from "@/server/env";

const DEFAULT_SITE_OG_IMAGE_PATH = "/ShipBoost-OGImage.png";

type PublicMetadataInput = {
  title: string;
  description: string;
  url: string;
  openGraphType?: "website" | "article";
  twitterCard?: "summary" | "summary_large_image";
  imageUrl?: string | null;
};

function normalizeCanonicalUrl(url: URL) {
  url.hash = "";

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

export function resolveCanonicalUrl(url: string) {
  const env = getEnv();
  const canonical = /^https?:\/\//i.test(url)
    ? new URL(url)
    : new URL(url, env.NEXT_PUBLIC_APP_URL);

  return normalizeCanonicalUrl(canonical);
}

export function resolveSameOriginCanonicalUrl(
  candidateUrl: string | null | undefined,
  fallbackUrl: string,
) {
  const appOrigin = new URL(getEnv().NEXT_PUBLIC_APP_URL).origin;
  const fallbackCanonical = resolveCanonicalUrl(fallbackUrl);

  if (!candidateUrl?.trim()) {
    return fallbackCanonical;
  }

  const candidateCanonical = resolveCanonicalUrl(candidateUrl.trim());

  if (new URL(candidateCanonical).origin !== appOrigin) {
    return fallbackCanonical;
  }

  return candidateCanonical;
}

export function resolvePublicImageUrl(url: string) {
  const env = getEnv();

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return new URL(url, env.NEXT_PUBLIC_APP_URL).toString();
}

export function getDefaultPublicPageImage() {
  return resolvePublicImageUrl(DEFAULT_SITE_OG_IMAGE_PATH);
}

export function buildPublicPageMetadata(
  input: PublicMetadataInput,
): Metadata {
  const canonical = resolveCanonicalUrl(input.url);
  const resolvedImageUrl = input.imageUrl
    ? resolvePublicImageUrl(input.imageUrl)
    : getDefaultPublicPageImage();
  const images = [
    {
      url: resolvedImageUrl,
      alt: input.title,
    },
  ];

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
      images,
    },
    twitter: {
      card: input.twitterCard ?? "summary",
      title: input.title,
      description: input.description,
      images: [resolvedImageUrl],
    },
  };
}
