"use client";

import dynamic from "next/dynamic";

export const DeferredHomeSearchModal = dynamic(
  () => import("./home-search-modal").then((module) => module.HomeSearchModal),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 rounded-2xl border border-border bg-card shadow-sm" />
    ),
  },
);
