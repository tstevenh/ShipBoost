"use client";

import dynamic from "next/dynamic";

export const DeferredHomeSearchModal = dynamic(
  () => import("./home-search-modal").then((module) => module.HomeSearchModal),
  {
    ssr: false,
    loading: () => (
      <div className="h-12 w-full max-w-[250px] rounded-xl border border-border bg-card shadow-sm" />
    ),
  },
);
