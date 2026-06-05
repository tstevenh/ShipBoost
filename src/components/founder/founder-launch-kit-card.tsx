"use client";

import { useState } from "react";
import { Check, Copy, Megaphone } from "lucide-react";

type Theme = "light" | "dark";

type FounderLaunchKitCardProps = {
  listingUrl: string;
  badgeImageUrlLight: string;
  badgeImageUrlDark: string;
  badgeSnippetLight: string;
  badgeSnippetDark: string;
  twitterText: string;
  linkedinText: string;
  twitterUrl: string;
  linkedinUrl: string;
};

function CopyButton({
  value,
  label = "Copy",
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function onCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted ${className}`}
    >
      {copied ? (
        <>
          <Check className="size-3.5" aria-hidden /> Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" aria-hidden /> {label}
        </>
      )}
    </button>
  );
}

export function FounderLaunchKitCard({
  listingUrl,
  badgeImageUrlLight,
  badgeImageUrlDark,
  badgeSnippetLight,
  badgeSnippetDark,
  twitterText,
  linkedinText,
  twitterUrl,
  linkedinUrl,
}: FounderLaunchKitCardProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const snippet = theme === "dark" ? badgeSnippetDark : badgeSnippetLight;
  const badgeImageUrl = theme === "dark" ? badgeImageUrlDark : badgeImageUrlLight;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-border px-6 py-5">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
          <Megaphone className="size-4.5" aria-hidden />
        </span>
        <div>
          <h2 className="font-heading text-base font-semibold tracking-tight">Launch-day kit</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Drive your audience to your launch and earn upvotes to climb this week&apos;s board.
          </p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {/* Step 1 — badge */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">
              <span className="text-muted-foreground">1 ·</span> Add the badge to your site
            </h3>
            {/* segmented theme toggle */}
            <div className="inline-flex rounded-lg border border-border p-0.5">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={theme === t}
                  onClick={() => setTheme(t)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    theme === t
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* live preview */}
          <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeImageUrl} alt="Your live ShipBoost badge preview" height={56} className="h-14 w-auto" />
          </div>

          {/* embed code */}
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="badge-embed" className="text-xs font-medium text-muted-foreground">
                Embed code
              </label>
              <CopyButton value={snippet} label="Copy code" />
            </div>
            <textarea
              id="badge-embed"
              aria-label="Badge embed code"
              readOnly
              value={snippet}
              rows={3}
              spellCheck={false}
              onFocus={(e) => e.currentTarget.select()}
              className="resize-none rounded-lg border border-border bg-muted/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              The upvote count updates automatically. Paste it in your site footer or a “launches” section.
            </p>
          </div>
        </div>

        {/* Step 2 — share */}
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold">
            <span className="text-muted-foreground">2 ·</span> Share your launch
          </h3>

          {/* listing link */}
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="truncate font-mono text-xs text-muted-foreground">{listingUrl}</span>
            <CopyButton value={listingUrl} className="ml-auto shrink-0" />
          </div>

          {/* share actions */}
          <div className="mt-3 grid gap-3">
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Post on X</span>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90"
                >
                  Open
                </a>
              </div>
              <p className="line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">{twitterText}</p>
              <CopyButton value={twitterText} label="Copy text" className="self-start" />
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Post on LinkedIn</span>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity hover:opacity-90"
                >
                  Open
                </a>
              </div>
              <p className="line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">{linkedinText}</p>
              <CopyButton value={linkedinText} label="Copy text" className="self-start" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
