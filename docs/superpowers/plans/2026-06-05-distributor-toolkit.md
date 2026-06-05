# Distributor Toolkit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn dormant founders into traffic sources by giving every tool ONE embeddable badge (the existing ShipBoost "Featured on" lockup + a live vote-count chip), a brand-matched dynamic OG share card, and a one-click launch-day kit in the founder dashboard.

**Architecture:** The badge is the founder's *existing* designed SVG served unchanged as a static asset, placed in the embed snippet next to a small **dynamic count-chip SVG** we generate (`/badge/count/[toolId]`). Side-by-side `<img>`s avoid compositing the 90KB artwork. The same `<a>` wrapper carries `data-shipboost-badge="free-launch"`, so this ONE badge also satisfies free-launch verification (no separate "mandatory badge"). The OG card is a single `ImageResponse` template matched to the monochrome brand theme. Pure formatting helpers are unit-tested; image routes are verified by request.

**Tech Stack:** Next.js 16 App Router (route handlers + `opengraph-image` convention + `next/og` `ImageResponse`), React 19, TypeScript, Vitest (+ jsdom), existing `getToolUpvoteCount` / `getCachedToolPage` / `getPubliclyVisibleToolWhere`.

**Brand facts (from `src/app/globals.css`):** monochrome. Light `--background #FAFAFA` / `--foreground #0A0A0A` / `--border #E5E5E5` / `--muted-foreground #71717A`. Dark `--background #0A0A0A` / `--card #111111` / `--foreground #FAFAFA` / `--muted-foreground #A1A1AA`. Fonts: heading Manrope, body Inter. **No orange/accent color anywhere.**

**Assets (source → repo destination):**
- `ShipBoost-Docs/shipboost-badge-svg/Light.svg` → `public/badge/featured-light.svg` (viewBox 282×93, ~3:1 pill, "FEATURED ON ShipBoost" + logo, dark-on-light)
- `ShipBoost-Docs/shipboost-badge-svg/Dark.svg` → `public/badge/featured-dark.svg` (white-on-black pill)
- `ShipBoost-Docs/logo/white-logo.png` → `public/logo/white-logo.png` (for OG on dark bg)
- `ShipBoost-Docs/logo/black-logo.png` → `public/logo/black-logo.png`

**Next.js 16 note:** before the OG/route tasks, read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md` and the route-handler reference. Confirm the `opengraph-image.tsx` exports (`alt`, `size`, `contentType`, default async fn) and that dynamic-segment `params` is a `Promise` (this codebase awaits it — see `src/app/tools/[slug]/page.tsx:32`).

**Out of scope (Plan B — Free-Launch Gating):** making the badge mandatory + upvote-3-on-current-board gate + premium friction removal + listing-link `rel` rendering + marketing copy rewrites.

---

## File Structure

- `public/badge/featured-light.svg`, `public/badge/featured-dark.svg` — static badge artwork (unchanged)
- `public/logo/white-logo.png`, `public/logo/black-logo.png` — logo for OG card
- `src/lib/distribution/count-chip-svg.ts` (+ `.test.ts`) — pure: `buildCountChipSvg({count, theme})`
- `src/lib/distribution/launch-kit.ts` (+ `.test.ts`) — pure: `buildBadgeEmbedSnippet(...)`, `buildLaunchKit(...)`
- `src/app/badge/count/[toolId]/route.ts` — dynamic count-chip SVG, cached
- `src/app/tools/[slug]/opengraph-image.tsx` — brand-matched OG card
- `src/app/tools/[slug]/page.tsx` — MODIFY: drop manual `openGraph.images`/`twitter.images`
- `src/components/founder/founder-launch-kit-card.tsx` (+ `.test.tsx`) — kit card w/ light/dark snippet toggle
- `src/app/dashboard/tools/[toolId]/page.tsx` — MODIFY: render the card

---

## Task 0: Import the brand assets

**Files:** create `public/badge/`, `public/logo/`

- [ ] **Step 1: Copy the source assets into the app's public dir**

```bash
mkdir -p public/badge public/logo
cp "/Users/tsth/Coding/shipboost/ShipBoost-Docs/shipboost-badge-svg/Light.svg" public/badge/featured-light.svg
cp "/Users/tsth/Coding/shipboost/ShipBoost-Docs/shipboost-badge-svg/Dark.svg" public/badge/featured-dark.svg
cp "/Users/tsth/Coding/shipboost/ShipBoost-Docs/logo/white-logo.png" public/logo/white-logo.png
cp "/Users/tsth/Coding/shipboost/ShipBoost-Docs/logo/black-logo.png" public/logo/black-logo.png
```

- [ ] **Step 2: Verify they serve**

Run: `npm run dev`, then `curl -I http://localhost:3000/badge/featured-dark.svg`
Expected: `200`, `Content-Type: image/svg+xml`. Visit `http://localhost:3000/badge/featured-light.svg` in a browser — your exact badge renders.

- [ ] **Step 3: Commit**

```bash
git add public/badge public/logo
git commit -m "chore(distribution): add ShipBoost badge + logo brand assets"
```

---

## Task 1: Count-chip SVG builder (pure)

**Files:**
- Create: `src/lib/distribution/count-chip-svg.ts`
- Test: `src/lib/distribution/count-chip-svg.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildCountChipSvg } from "./count-chip-svg";

describe("buildCountChipSvg", () => {
  it("renders the upvote count and the word upvotes", () => {
    const svg = buildCountChipSvg({ count: 42, theme: "dark" });
    expect(svg).toContain("<svg");
    expect(svg).toContain("42");
    expect(svg.toLowerCase()).toContain("upvotes");
    expect(svg.trim().endsWith("</svg>")).toBe(true);
  });

  it("uses dark-theme colors for theme=dark and light-theme colors for theme=light", () => {
    expect(buildCountChipSvg({ count: 1, theme: "dark" })).toContain("#111111");
    expect(buildCountChipSvg({ count: 1, theme: "light" })).toContain("#FFFFFF");
  });

  it("floors and clamps the count to a non-negative integer", () => {
    expect(buildCountChipSvg({ count: -5, theme: "dark" })).toContain(">0<");
    expect(buildCountChipSvg({ count: 7.9, theme: "dark" })).toContain(">7<");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/distribution/count-chip-svg.test.ts`
Expected: FAIL — `buildCountChipSvg` not defined.

- [ ] **Step 3: Write minimal implementation**

```ts
export type BadgeTheme = "light" | "dark";

export type CountChipInput = {
  count: number;
  theme: BadgeTheme;
};

const THEME = {
  light: { bg: "#FFFFFF", border: "#E5E5E5", fg: "#0A0A0A", muted: "#71717A" },
  dark: { bg: "#111111", border: "#27272A", fg: "#FAFAFA", muted: "#A1A1AA" },
} as const;

export function buildCountChipSvg({ count, theme }: CountChipInput): string {
  const c = THEME[theme];
  const safeCount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  const width = 92;
  const height = 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${safeCount} upvotes on ShipBoost">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="8" fill="${c.bg}" stroke="${c.border}"/>
  <g font-family="Manrope,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif" text-anchor="middle">
    <text x="${width / 2}" y="20" fill="${c.fg}" font-size="16" font-weight="700">▲ ${safeCount}</text>
    <text x="${width / 2}" y="32" fill="${c.muted}" font-size="9" font-weight="600" letter-spacing="0.5">upvotes</text>
  </g>
</svg>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/distribution/count-chip-svg.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/distribution/count-chip-svg.ts src/lib/distribution/count-chip-svg.test.ts
git commit -m "feat(distribution): add buildCountChipSvg (brand-themed live count chip)"
```

---

## Task 2: Launch-kit + embed-snippet builders (pure)

**Files:**
- Create: `src/lib/distribution/launch-kit.ts`
- Test: `src/lib/distribution/launch-kit.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildBadgeEmbedSnippet, buildLaunchKit } from "./launch-kit";

const base = { appUrl: "https://shipboost.com/", slug: "acme", toolId: "tool_123" };

describe("buildBadgeEmbedSnippet", () => {
  it("links to the listing, carries the verification marker, and pairs badge + count chip", () => {
    const snippet = buildBadgeEmbedSnippet({ ...base, theme: "dark" });
    expect(snippet).toContain('href="https://shipboost.com/tools/acme"');
    expect(snippet).toContain('data-shipboost-badge="free-launch"');
    expect(snippet).toContain('src="https://shipboost.com/badge/featured-dark.svg"');
    expect(snippet).toContain('src="https://shipboost.com/badge/count/tool_123?theme=dark"');
  });

  it("uses the light asset + light theme when theme=light", () => {
    const snippet = buildBadgeEmbedSnippet({ ...base, theme: "light" });
    expect(snippet).toContain("featured-light.svg");
    expect(snippet).toContain("?theme=light");
  });

  it("never double-slashes when appUrl has a trailing slash", () => {
    expect(buildBadgeEmbedSnippet({ ...base, theme: "dark" })).not.toContain("com//");
  });
});

describe("buildLaunchKit", () => {
  it("returns listing url, both badge themes, and share texts with name + url", () => {
    const kit = buildLaunchKit({ ...base, name: "Acme", tagline: "Ship faster" });
    expect(kit.listingUrl).toBe("https://shipboost.com/tools/acme");
    expect(kit.badgeSnippetDark).toContain("featured-dark.svg");
    expect(kit.badgeSnippetLight).toContain("featured-light.svg");
    expect(kit.shareTexts.twitter).toContain("Acme");
    expect(kit.shareTexts.twitter).toContain(kit.listingUrl);
    expect(kit.shareTexts.linkedin).toContain("Ship faster");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/distribution/launch-kit.test.ts`
Expected: FAIL — module/exports not defined.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { BadgeTheme } from "./count-chip-svg";

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
  badgeSnippetLight: string;
  badgeSnippetDark: string;
  shareTexts: { twitter: string; linkedin: string };
};

function normalizeBase(appUrl: string): string {
  return appUrl.replace(/\/+$/, "");
}

export function buildBadgeEmbedSnippet({
  appUrl,
  slug,
  toolId,
  theme,
}: EmbedSnippetInput): string {
  const base = normalizeBase(appUrl);
  return `<a href="${base}/tools/${slug}" data-shipboost-badge="free-launch" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;">
  <img src="${base}/badge/featured-${theme}.svg" alt="Featured on ShipBoost" height="40" />
  <img src="${base}/badge/count/${toolId}?theme=${theme}" alt="upvotes on ShipBoost" width="92" height="40" />
</a>`;
}

export function buildLaunchKit(input: LaunchKitInput): LaunchKit {
  const base = normalizeBase(input.appUrl);
  const listingUrl = `${base}/tools/${input.slug}`;
  const snippetArgs = { appUrl: input.appUrl, slug: input.slug, toolId: input.toolId };

  return {
    listingUrl,
    badgeSnippetLight: buildBadgeEmbedSnippet({ ...snippetArgs, theme: "light" }),
    badgeSnippetDark: buildBadgeEmbedSnippet({ ...snippetArgs, theme: "dark" }),
    shareTexts: {
      twitter: `🚀 ${input.name} is live on ShipBoost!\n\n${input.tagline}\n\nA quick upvote would mean a lot 🙏\n${listingUrl}`,
      linkedin: `Excited to share that ${input.name} is now live on ShipBoost.\n\n${input.tagline}\n\nIf it's useful to you, an upvote would help us climb this week's board: ${listingUrl}`,
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/distribution/launch-kit.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/distribution/launch-kit.ts src/lib/distribution/launch-kit.test.ts
git commit -m "feat(distribution): launch-kit + unified badge embed snippet (badge + count chip)"
```

---

## Task 3: Dynamic count-chip route

**Files:**
- Create: `src/app/badge/count/[toolId]/route.ts`

- [ ] **Step 1: Write the implementation**

```ts
import { prisma } from "@/server/db/client";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import { getToolUpvoteCount } from "@/server/services/upvote-service";
import { buildCountChipSvg, type BadgeTheme } from "@/lib/distribution/count-chip-svg";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { toolId } = await context.params;
  const themeParam = new URL(request.url).searchParams.get("theme");
  const theme: BadgeTheme = themeParam === "light" ? "light" : "dark";

  const tool = await prisma.tool.findFirst({
    where: { id: toolId, ...getPubliclyVisibleToolWhere() },
    select: { id: true },
  });

  if (!tool) {
    return new Response("Not found", { status: 404 });
  }

  const count = await getToolUpvoteCount(tool.id);
  const svg = buildCountChipSvg({ count, theme });

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, then with a real published tool id:
```bash
curl -i "http://localhost:3000/badge/count/<id>?theme=dark"
```
Expected: `200`, `Content-Type: image/svg+xml`, body contains the upvote number and "upvotes". `?theme=light` returns the light palette (`#FFFFFF`). Unknown id → `404`.

- [ ] **Step 3: Commit**

```bash
git add src/app/badge/count/[toolId]/route.ts
git commit -m "feat(distribution): serve live count-chip SVG at /badge/count/[toolId]"
```

---

## Task 4: Brand-matched dynamic OG card

**Files:**
- Create: `src/app/tools/[slug]/opengraph-image.tsx`
- Modify: `src/app/tools/[slug]/page.tsx`

Read first: the Next 16 `opengraph-image` doc (path above). The card uses the **dark brand theme** (`#0A0A0A` bg, `#FAFAFA` text, white logo) — the strongest look for social shares.

- [ ] **Step 1: Write the OG image module**

```tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { getCachedToolPage } from "@/server/cache/public-content";
import { getToolUpvoteCount } from "@/server/services/upvote-service";

export const alt = "Launching on ShipBoost";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgContext = {
  params: Promise<{ slug: string }>;
};

// White logo mark, inlined so ImageResponse needs no network fetch.
const logoDataUrl = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/logo/white-logo.png"),
).toString("base64")}`;

export default async function Image(context: OgContext) {
  const { slug } = await context.params;
  const toolPage = await getCachedToolPage(slug);
  const tool = toolPage?.tool;

  const name = tool?.name ?? "A new product";
  const tagline = tool?.tagline ?? "";
  const count = tool ? await getToolUpvoteCount(tool.id) : 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0A",
          color: "#FAFAFA",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoDataUrl} width={44} height={44} alt="" />
          <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.5px" }}>
            Launching on ShipBoost
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.04 }}>{name}</div>
          {tagline ? (
            <div style={{ fontSize: 34, color: "#A1A1AA", maxWidth: 1000 }}>{tagline}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: 30, fontWeight: 700 }}>
          <span>▲ {count}</span>
          <span style={{ color: "#A1A1AA", fontWeight: 600 }}>upvotes — vote now</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
```

> If `getCachedToolPage`'s returned object nests the tool under a different property, adjust `toolPage?.tool`. Required fields: `id`, `name`, `tagline`.
> Optional fidelity follow-up (not required for v1): load Manrope/Inter `.ttf` via `ImageResponse`'s `fonts` option to exactly match site typography; system `sans-serif` is the v1 default and renders fine.

- [ ] **Step 2: Remove the now-duplicated manual images in `page.tsx`**

In `src/app/tools/[slug]/page.tsx` `generateMetadata`, delete the `images:` entries under both `openGraph` and `twitter` (the `tool.logoMedia` lines around `:63`, `:76`, `:101`, `:114`). Leave titles/descriptions untouched — the convention now supplies the single share image.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, then `open http://localhost:3000/tools/<real-slug>/opengraph-image`
Expected: a 1200×630 PNG — black background, white ShipBoost logo, "Launching on ShipBoost", product name, tagline, and live `▲ count`. View page source: exactly one `og:image` pointing at the generated route.

- [ ] **Step 4: Run existing metadata tests**

Run: `npx vitest run src/server/seo/page-metadata.test.ts`
Expected: PASS (image removal doesn't affect title/description logic).

- [ ] **Step 5: Commit**

```bash
git add src/app/tools/[slug]/opengraph-image.tsx src/app/tools/[slug]/page.tsx
git commit -m "feat(distribution): brand-matched dynamic OG card with live vote count"
```

---

## Task 5: Founder launch-kit card component

**Files:**
- Create: `src/components/founder/founder-launch-kit-card.tsx`
- Test: `src/components/founder/founder-launch-kit-card.test.tsx`

- [ ] **Step 1: Write the failing component test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FounderLaunchKitCard } from "./founder-launch-kit-card";

describe("FounderLaunchKitCard", () => {
  it("renders the listing url, a dark-theme badge snippet by default, and share text", () => {
    render(
      <FounderLaunchKitCard
        listingUrl="https://shipboost.com/tools/acme"
        badgeSnippetLight={'<a data-theme="light"></a>'}
        badgeSnippetDark={'<a data-theme="dark"></a>'}
        twitterText="🚀 Acme is live"
        linkedinText="Excited about Acme"
      />,
    );

    expect(screen.getByText(/shipboost.com\/tools\/acme/)).toBeInTheDocument();
    expect(screen.getByText(/Acme is live/)).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /badge embed code/i }),
    ).toHaveValue('<a data-theme="dark"></a>');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/founder/founder-launch-kit-card.test.tsx`
Expected: FAIL — component not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/founder/founder-launch-kit-card.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/founder/founder-launch-kit-card.tsx src/components/founder/founder-launch-kit-card.test.tsx
git commit -m "feat(founder): launch-kit card with light/dark badge embed + share assets"
```

---

## Task 6: Mount the kit in the founder dashboard tool page

**Files:**
- Modify: `src/app/dashboard/tools/[toolId]/page.tsx`

Read first: open the file, find the in-scope tool record (fields `id`, `slug`, `name`, `tagline`) and where `FounderToolEditor` renders (~`:188`). Render the kit beneath it, only when the tool has a public `slug` (a draft has no live listing).

- [ ] **Step 1: Add imports**

```tsx
import { env } from "@/server/env";
import { buildLaunchKit } from "@/lib/distribution/launch-kit";
import { FounderLaunchKitCard } from "@/components/founder/founder-launch-kit-card";
```

- [ ] **Step 2: Render the card after `<FounderToolEditor ... />`**

```tsx
{tool.slug ? (
  (() => {
    const kit = buildLaunchKit({
      appUrl: env.NEXT_PUBLIC_APP_URL,
      slug: tool.slug,
      toolId: tool.id,
      name: tool.name,
      tagline: tool.tagline ?? "",
    });
    return (
      <div className="mt-8">
        <FounderLaunchKitCard
          listingUrl={kit.listingUrl}
          badgeSnippetLight={kit.badgeSnippetLight}
          badgeSnippetDark={kit.badgeSnippetDark}
          twitterText={kit.shareTexts.twitter}
          linkedinText={kit.shareTexts.linkedin}
        />
      </div>
    );
  })()
) : null}
```

> Replace `tool` with the actual in-scope variable holding the tool record (confirm on open; required fields `id`, `slug`, `name`, `tagline`).

- [ ] **Step 3: Verify build + lint**

Run: `npm run lint && npm run build`
Expected: no type/lint errors; build succeeds.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. As a founder with a published tool, open `/dashboard/tools/<toolId>`: the kit shows the listing URL, a Dark/Light toggle that swaps the embed code, a working "Copy embed code", and both share texts. Paste the embed into a scratch HTML file and confirm your badge + live count chip render side by side and the link points to the listing. For a draft (no slug), the card is hidden.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/tools/[toolId]/page.tsx
git commit -m "feat(founder): surface launch-day kit on the dashboard tool page"
```

---

## Self-Review

**Spec coverage:**
- ONE badge serving embed + verification (no separate mandatory badge) → Task 2 snippet carries `data-shipboost-badge="free-launch"`; uses the existing static artwork from Task 0. ✔
- Exact designed badge + exact logo → Task 0 copies the real `Light.svg`/`Dark.svg` and logos, served unchanged. ✔
- Live vote-count chip appended to the badge → Tasks 1, 3 (+ snippet pairs them in Task 2). ✔
- Light + dark, single design → `featured-{theme}.svg` + chip `?theme=`, toggled in Task 5. ✔
- Badge anchor → tool's ShipBoost listing page (locked) → Task 2 test asserts `/tools/<slug>`. ✔
- OG card matched to monochrome theme + logo → Task 4 (dark `#0A0A0A`/`#FAFAFA`, white logo, no orange). ✔
- Launch-day kit surfaced to founders → Tasks 5, 6. ✔
- Purely additive (no funnel/payment files) → confirmed. ✔

**Placeholder scan:** none — every code step is complete. The two "verify on open" notes are real API confirmations (Next 16 signatures; `getCachedToolPage` tool property; dashboard tool variable), not deferred work.

**Type consistency:** `BadgeTheme` defined in `count-chip-svg.ts`, imported by `launch-kit.ts`; `buildCountChipSvg({count,theme})`, `buildBadgeEmbedSnippet({appUrl,slug,toolId,theme})`, `buildLaunchKit` → `{listingUrl, badgeSnippetLight, badgeSnippetDark, shareTexts}`; `FounderLaunchKitCard` props match Task 6 call site. Consistent.

---

## Follow-up

**Plan B — Free-Launch Gating** (mandatory badge + upvote-3-on-current-board gate + frictionless premium + listing-link `rel` + copy rewrites) is a separate plan, written next, shipped behind its own review. Because this badge already carries `data-shipboost-badge="free-launch"`, Plan B's verification step reuses the exact asset built here.
