"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

function buildInitials(name: string) {
  const tokens = name.toUpperCase().match(/[A-Z0-9]+/g) ?? [];

  if (tokens.length >= 2) {
    return `${tokens[0]?.[0] ?? "S"}${tokens[1]?.[0] ?? "B"}`;
  }

  if (tokens.length === 1) {
    const token = tokens[0] ?? "SB";
    return token.slice(0, 2).padEnd(2, token[0] ?? "S");
  }

  return "SB";
}

function buildFaviconFallbackUrl(websiteUrl?: string | null) {
  if (!websiteUrl) {
    return null;
  }

  try {
    const hostname = new URL(websiteUrl).hostname.replace(/^www\./, "");

    if (!hostname) {
      return null;
    }

    return `https://favicon.im/${hostname}`;
  } catch {
    return null;
  }
}

type LogoFallbackProps = {
  alt?: string;
  className?: string;
  imageClassName?: string;
  name: string;
  priority?: boolean;
  sizes?: string;
  src?: string | null;
  textClassName?: string;
  websiteUrl?: string | null;
};

export function LogoFallback({
  alt,
  className,
  imageClassName,
  name,
  priority = false,
  sizes = "64px",
  src,
  textClassName,
  websiteUrl,
}: LogoFallbackProps) {
  const fallbackSrc = buildFaviconFallbackUrl(websiteUrl);
  const imageSources = [src, fallbackSrc].filter(
    (value, index, array): value is string =>
      Boolean(value) && array.indexOf(value) === index,
  );
  const [imageIndex, setImageIndex] = useState(0);
  const currentImageSrc = imageSources[imageIndex];
  const showImage = Boolean(currentImageSrc);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-muted",
        className,
      )}
    >
      {showImage ? (
        <Image
          src={currentImageSrc ?? ""}
          alt={alt ?? `${name} logo`}
          fill
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
          onError={() => setImageIndex((current) => current + 1)}
          priority={priority}
        />
      ) : (
        <span
          className={cn(
            "text-sm font-black  tracking-wide text-muted-foreground/50",
            textClassName,
          )}
        >
          {buildInitials(name)}
        </span>
      )}
    </div>
  );
}
