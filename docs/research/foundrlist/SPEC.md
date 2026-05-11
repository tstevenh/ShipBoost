# FoundrList Main Section — Extraction Spec

Source: https://www.foundrlist.com/ (logged-in home, week-X launch board)
Captured: 2026-05-11 via Chrome MCP, viewport 1483px wide.

## Page-level container (the 3-col chrome)

- Outer: `flex h-[100dvh] flex-col bg-background`
- Inner row: `mx-auto flex h-full w-full max-w-[1265px]`
  - **No gap between columns** — column edges are separated by 1px `border-l` / `border-r`.
- Total content width: **1265px**.

## Columns

| Column | Width | Class signature | Notes |
|---|---|---|---|
| Left rail | 275px | `hidden lg:flex w-[275px] shrink-0 flex-col overflow-y-auto` | Independently scrollable. No border. |
| Middle | flex-1 (≈640px @1265 container) | `flex-1 flex flex-col overflow-y-auto` | Independently scrollable feed. |
| Right rail | 350px | `hidden lg:flex w-[350px] shrink-0 flex-col overflow-hidden border-l border-r border-neutral-900/[0.08] dark:border-white/[0.10]` | Borders form the column dividers. |

Each column manages its own scroll. The page itself does not scroll — the row container is `h-[100dvh]` and overflow is delegated to the columns.

## Launch card (middle column row)

DOM root: `<article>` per launch, NOT a card with shadow — a flat row separated by 1px border-b.

```
<article class="relative px-3 sm:px-4 py-3 transition-all group min-w-0
                 border-b border-border hover:bg-muted/50 cursor-pointer">
  <a class="absolute inset-0 z-1" />                 {/* whole-row click overlay */}
  <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none" />  {/* decoration layer */}
  <div class="relative z-2 flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
    <RankMedal />                                    {/* 🥇🥈🥉 or "#4" */}
    <Avatar w=48 h=48 rounded-md />                  {/* app icon */}
    <div class="flex-1 min-w-0 flex flex-col justify-center gap-1 py-0.5">
      <h3 class="flex items-center gap-1.5 text-xs md:text-sm font-semibold leading-tight">
        <span class="truncate">App name</span>
      </h3>
      <p class="text-xs text-muted-foreground line-clamp-1">tagline</p>
      <div class="text-xs text-muted-foreground/70">Tag1, Tag2</div>
    </div>
    <VoteButton compact />                           {/* right-aligned, vertical stack: count over arrow */}
  </div>
</article>
```

Exact computed values:
- ARTICLE: `padding: 12px 16px`, `height: 89px`, `border-bottom: 1px solid var(--border)`, `transition: 0.15s cubic-bezier(.4,0,.2,1)`, `cursor: pointer`.
- Hover state: `background-color: hsl(var(--muted) / 0.5)`.
- Title H3: `font-size: 14px` (md:text-sm), `font-weight: 600`, `line-height: 1.25`.
- Avatar: 48px square, `border-radius: 6-8px`.
- Inner gap: 8px (sm) / 12px (md+) / 16px (between major segments).

## Right rail — sponsored placement card

Content seen:
- "SPONSORED" eyebrow (uppercase, tracking-wide, text-xs muted)
- "FOUNDRLIST" wordmark (large display)
- "Promote Your Product & Reach thousands of developers!"
- CTA button: "BOOK THIS SPOT FOR 30 DAYS"
- Beneath: a horizontal scrolling marquee of "ADVERTISE • SPONSORED • ADVERTISE • ..." chips

The right rail itself has border-l + border-r at color `rgba(0,0,0,0.08)` light / `rgba(255,255,255,0.10)` dark.

## Typography weights — the foundrlist pattern

- Titles: `font-semibold` (600) at `text-xs` / `text-sm`
- Body: `font-normal` at `text-xs`
- Labels / eyebrow: `text-xs uppercase tracking-wider text-muted-foreground`

> Brand override for this clone: keep foundrlist's spatial structure but use ShipBoost's font weights (`font-black` 900 for h-level titles to match the hero), and Manrope for headings / Inter for body. Color tokens unchanged — Monochrome v2.

## What changes vs. current ShipBoost layout

1. ShowcaseLayout: `1fr` middle column with gap-8 between → fixed 275 / 1fr / 350 with no gap and column-edge borders.
2. ShowcaseLayout outer max-width: `max-w-[1600px]` with `px-6` → `max-w-[1265px]` with column-managed padding.
3. Launchpad card: `rounded-xl border bg-card p-5 + hover:-translate-y-0.5 + shadow` → flat `border-b only + py-3 px-4 + hover:bg-muted/50`.
4. Launchpad section heading: `text-3xl font-black ...` heavy → eyebrow "WEEK X" + tighter h1 (kept brand weight but smaller leading).
5. Sidebar widgets: card chrome (rounded-2xl) → flat panels separated by border-b within the column.
