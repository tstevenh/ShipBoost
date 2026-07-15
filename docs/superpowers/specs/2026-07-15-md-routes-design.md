# Design: Per-page `.md` routes

**Date:** 2026-07-15  
**Status:** Approved  

## Background

ScrollLaunch shipped a feature where appending `.md` to any page URL returns a clean markdown version of that page — structured for AI search, LLM agents, citations, and developer workflows. ShipBoost already has `llms.txt` and `llms-full.txt` for AI discoverability at the site level; this feature adds per-page machine-readable content.

ShipBoost already uses the directory-with-extension pattern for `llms.txt` (`src/app/llms.txt/route.ts`). The same pattern gives us `.md` routes without middleware or new infrastructure.

## Scope

Four page types get `.md` routes:

| URL pattern | Data source |
|---|---|
| `/tools/[slug].md` | `getCachedToolPage` |
| `/best/[slug].md` | `getCachedBestSeoPage` |
| `/alternatives/[slug].md` | `getCachedAlternativesPage` |
| `/blog/[slug].md` | `getCachedPublishedBlogArticle` |

## New Files

```
src/server/seo/page-markdown.ts              ← four builder functions + shared helpers
src/server/seo/page-markdown.test.ts         ← unit tests for each builder
src/app/tools/[slug].md/route.ts
src/app/best/[slug].md/route.ts
src/app/alternatives/[slug].md/route.ts
src/app/blog/[slug].md/route.ts
```

## Modified Files

Small UI addition (markdown link) in each of:

```
src/components/public/tool-page-content.tsx
src/components/blog/blog-article-page.tsx
src/app/best/[slug]/page.tsx
src/app/alternatives/[slug]/page.tsx
```

## `src/server/seo/page-markdown.ts`

Exports four named functions. No external deps — pure string building.

### `buildToolMarkdown(tool, appUrl)`

Input: the `tool` object from `getCachedToolPage` (kind `"public"`) plus `appUrl`.

Output:
```
# {name}

> {tagline}

**Website:** {websiteUrl}
**Pricing:** {pricingModel}
**Categories:** {category names, comma-separated}
**Tags:** {tag names, comma-separated}
**Upvotes:** {upvoteCount}

## Description

{richDescription — stored as Markdown, used verbatim}

## Launch History

- {launchType} — {launchDate formatted as "D MMM YYYY"}
...

## Links

- ShipBoost listing: {appUrl}/tools/{slug}
- Markdown: {appUrl}/tools/{slug}.md
{if alternatives page exists:}
- Alternatives: {appUrl}/alternatives/{slug}
```

`richDescription` is stored as Markdown and rendered verbatim — no conversion needed.

Prelaunch tools return `null` from this function (route handler serves 404).

### `buildBestMarkdown(page, appUrl)`

Input: return value of `getCachedBestSeoPage` (fields: `entry`, `tools`).

`entry` contains: `title`, `metaDescription`, `intro` (optional), `rankedTools` (ordered list with `toolSlug`).

Output:
```
# {entry.title}

{entry.metaDescription}

{entry.intro if present}

## Ranked Tools

1. **{tool.name}** — {tool.tagline} — {appUrl}/tools/{slug}
2. ...

---

Source: {appUrl}/best/{slug}
Markdown: {appUrl}/best/{slug}.md
```

Tools are listed in registry rank order (same as the HTML page).

### `buildAlternativesMarkdown(page, appUrl)`

Input: return value of `getCachedAlternativesPage` (fields: `entry`, `anchorTool`, `tools`).

`entry` contains: `title`, `metaDescription`, `anchorToolSlug`, `toolSlugs`.

Output:
```
# {entry.title}

{entry.metaDescription}

## {anchorTool.name}

{anchorTool.tagline}
Website: {anchorTool.websiteUrl}
ShipBoost: {appUrl}/tools/{anchorTool.slug}

## Alternatives

- **{tool.name}** — {tool.tagline} — {appUrl}/tools/{tool.slug}
...

---

Source: {appUrl}/alternatives/{slug}
Markdown: {appUrl}/alternatives/{slug}.md
```

### `buildBlogMarkdown(article, appUrl)`

Input: return value of `getCachedPublishedBlogArticle`.

Fields used: `title`, `excerpt`, `markdownContent`, `author.name`, `primaryCategory.name`, `publishedAt`, `slug`.

`markdownContent` is stored as Markdown — used verbatim.

Output:
```
# {title}

By {author.name} · {publishedAt formatted "D MMM YYYY"} · {primaryCategory.name}

> {excerpt}

---

{markdownContent}

---

Source: {appUrl}/blog/{slug}
Markdown: {appUrl}/blog/{slug}.md
```

## Route Handlers (all four follow the same pattern)

```typescript
// src/app/tools/[slug].md/route.ts
import { getCachedToolPage, getCachedToolStaticParams } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { buildToolMarkdown } from "@/server/seo/page-markdown";
import { notFound } from "next/navigation";

export const revalidate = 3600;

type RouteContext = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getCachedToolStaticParams();
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const toolPage = await getCachedToolPage(slug);

  if (!toolPage || toolPage.kind !== "public") {
    return notFound();
  }

  const markdown = buildToolMarkdown(toolPage.tool, getEnv().NEXT_PUBLIC_APP_URL);

  return new Response(markdown, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
```

The other three route handlers follow the identical pattern, substituting the appropriate cached getter, static params function, and markdown builder. `revalidate` matches the corresponding page's revalidation period.

## UI Surface

A small, developer-facing markdown link added to each page. Not a primary CTA — secondary metadata, styled as a muted pill/chip.

**Placement and markup (same pattern for all four page types):**

```tsx
<a
  href={`/tools/${slug}.md`}
  target="_blank"
  rel="noopener noreferrer"
  className="..."   // muted text, monospace or small, opens new tab
>
  .md
</a>
```

- **Tool page**: placed in the metadata row (near website / pricing)
- **Blog page**: placed in the byline row (near author / date)
- **Best page**: placed near the page title/subtitle
- **Alternatives page**: placed near the page title/subtitle

The link opens in a new tab (`target="_blank"`). The text is `.md` or `Markdown ↗` — short, developer-recognizable.

## Caching

All route handlers use the same `getCachedXxx` functions as their corresponding `page.tsx`. These are already ISR-cached; the `.md` handler is a second consumer of the same cache — no additional DB load. `revalidate = 3600` matches the page.

## Static Generation

Each handler exports `generateStaticParams` using the same function as the corresponding page:

| Handler | `generateStaticParams` source |
|---|---|
| tools | `getCachedToolStaticParams` |
| best | `getBestSeoStaticParams` |
| alternatives | `getAlternativesStaticParams` |
| blog | `getCachedBlogArticleStaticParams` |

This ensures all `.md` URLs are pre-built at deploy time.

## Tests

`src/server/seo/page-markdown.test.ts` — unit tests for each builder:

- `buildToolMarkdown`: verifies name, tagline, richDescription, categories, tags, pricing, launch history, and links appear in output; verifies correct `appUrl` prefixing.
- `buildBestMarkdown`: verifies title, ranked tool list order, source link.
- `buildAlternativesMarkdown`: verifies anchor tool section, alternatives list, source link.
- `buildBlogMarkdown`: verifies title, byline fields, excerpt, markdownContent verbatim, source link.

Each test uses minimal fixture data (plain objects matching the type shape) — no DB, no mocks beyond the data.

## Out of Scope

- Middleware — not needed
- Changes to `robots.txt` or sitemap — `.md` URLs are for developers/agents
- Other page types (categories, tags, launches) — can be added later with the same pattern
- `robots.txt` disallow — these routes should be crawlable
