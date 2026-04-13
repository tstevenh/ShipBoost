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

type LogoFallbackProps = {
  alt?: string;
  className?: string;
  imageClassName?: string;
  name: string;
  priority?: boolean;
  sizes?: string;
  src?: string | null;
  textClassName?: string;
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
}: LogoFallbackProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src) && !imageFailed;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-muted",
        className,
      )}
    >
      {showImage ? (
        <Image
          src={src ?? ""}
          alt={alt ?? `${name} logo`}
          fill
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
          onError={() => setImageFailed(true)}
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
