"use client";

import { useState } from "react";

type FounderLaunchKitCardProps = {
  listingUrl: string;
  badgeSnippetLight: string;
  badgeSnippetDark: string;
  twitterText: string;
  linkedinText: string;
};

function copy(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    void navigator.clipboard.writeText(value);
  }
}

export function FounderLaunchKitCard({
  listingUrl,
  badgeSnippetLight,
  badgeSnippetDark,
  twitterText,
  linkedinText,
}: FounderLaunchKitCardProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const snippet = theme === "dark" ? badgeSnippetDark : badgeSnippetLight;

  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="font-heading text-lg font-semibold">Launch-day kit</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Share your launch and add the badge to your site to climb this week&apos;s board.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <span className="text-sm font-medium">Your listing</span>
        <div className="flex items-center gap-2">
          <code className="truncate rounded bg-muted px-2 py-1 text-sm">{listingUrl}</code>
          <button type="button" className="text-sm underline" onClick={() => copy(listingUrl)}>
            Copy
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="badge-embed">
            Badge embed code
          </label>
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              aria-pressed={theme === "dark"}
              className={theme === "dark" ? "rounded bg-primary px-2 py-1 text-primary-foreground" : "rounded px-2 py-1"}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              aria-pressed={theme === "light"}
              className={theme === "light" ? "rounded bg-primary px-2 py-1 text-primary-foreground" : "rounded px-2 py-1"}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
          </div>
        </div>
        <textarea
          id="badge-embed"
          aria-label="Badge embed code"
          readOnly
          value={snippet}
          rows={4}
          className="rounded border bg-muted px-2 py-1 font-mono text-xs"
        />
        <button type="button" className="self-start text-sm underline" onClick={() => copy(snippet)}>
          Copy embed code
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Share on X</span>
          <p className="whitespace-pre-line rounded bg-muted px-2 py-1 text-sm">{twitterText}</p>
          <button type="button" className="self-start text-sm underline" onClick={() => copy(twitterText)}>
            Copy
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Share on LinkedIn</span>
          <p className="whitespace-pre-line rounded bg-muted px-2 py-1 text-sm">{linkedinText}</p>
          <button type="button" className="self-start text-sm underline" onClick={() => copy(linkedinText)}>
            Copy
          </button>
        </div>
      </div>
    </section>
  );
}
