"use client";

import Image from "next/image";
import Link from "next/link";

export function AuthBrand() {
  return (
    <Link
      href="/"
      prefetch={false}
      aria-label="ShipBoost home"
      className="mb-12 flex items-center gap-4 group"
    >
      <div className="relative h-14 w-14 shrink-0">
        <Image
          src="/logos/logo-black.png"
          alt=""
          fill
          className="object-contain block dark:hidden transition-transform group-hover:scale-105"
          sizes="56px"
          priority
        />
        <Image
          src="/logos/logo-white.png"
          alt=""
          fill
          className="object-contain hidden dark:block transition-transform group-hover:scale-105"
          sizes="56px"
          priority
        />
      </div>
      <span className="text-3xl font-black tracking-tighter text-foreground font-heading leading-none">
        ShipBoost
      </span>
    </Link>
  );
}
