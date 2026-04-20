# Buyer-Intent SEO Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add canonical `/best/[slug]` buyer-intent pages, migrate taxonomy pages from `/best/tag/[slug]` to `/tags/[slug]`, and ship the first support/help-desk SEO cluster on top of a reusable hardcoded content system.

**Architecture:** Build a shared best-page template backed by a hardcoded registry and server-side content loaders, mirroring the existing alternatives architecture instead of introducing admin management. Migrate tag pages to `/tags/[slug]` with redirects and internal-link cleanup, then layer in support-cluster best pages plus sitemap, cache, and schema updates so the new route model is coherent.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Next metadata/sitemap APIs, existing ShipBoost SEO/cache services

---

## Notes Before Execution

- This plan intentionally omits git commit steps because the user asked to handle commits manually after review.
- Follow the existing public-page patterns in `src/app/*`, `src/server/cache/public-content.ts`, and `src/server/services/seo-service.ts`.
- Keep the first rollout focused on the support/help-desk cluster. Do not add CRM content in the same implementation batch unless all support pages are complete and reviewed.

## File Structure Map

### New files

- Create: `src/app/best/[slug]/page.tsx`
- Create: `src/app/tags/[slug]/page.tsx`
- Create: `src/server/seo/best-pages.ts`
- Create: `src/server/seo/best-pages.test.ts`

### Existing files to modify

- Modify: `next.config.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/tags/page.tsx`
- Modify: `src/app/categories/[slug]/page.tsx`
- Modify: `src/app/alternatives/[slug]/page.tsx`
- Modify: `src/app/tools/[slug]/page.tsx`
- Modify: `src/app/dashboard/tools/[toolId]/preview/page.tsx`
- Modify: `src/components/ToolCard.tsx`
- Modify: `src/components/public/public-tool-card.tsx`
- Modify: `src/components/public/public-directory-tool-card.tsx`
- Modify: `src/components/public/tool-page-content.tsx`
- Modify: `src/components/ui/flickering-footer.tsx`
- Modify: `src/server/cache/public-content.ts`
- Modify: `src/server/seo/registry.ts`
- Modify: `src/server/seo/types.ts`
- Modify: `src/server/seo/page-schema.ts`
- Modify: `src/server/seo/schema-builders.test.ts`
- Modify: `src/server/services/seo-service.ts`
- Modify: `src/server/services/seo-service.test.ts`

### Existing files that may be removed or replaced after migration

- Replace responsibility of: `src/app/best/tag/[slug]/page.tsx`

Recommended handling:

- keep the file temporarily while the redirect and new route land
- once `/tags/[slug]` is fully wired and tested, either delete `src/app/best/tag/[slug]/page.tsx` or replace it with a defensive `notFound()` page if the redirect alone is sufficient

---

### Task 1: Define the New SEO Content Types and Registries

**Files:**
- Create: `src/server/seo/best-pages.ts`
- Modify: `src/server/seo/types.ts`
- Modify: `src/server/seo/registry.ts`
- Test: `src/server/seo/best-pages.test.ts`

- [ ] **Step 1: Add the best-page content types**

Update `src/server/seo/types.ts` to define the structured content model used by `/best/[slug]`.

```ts
export type BestPageComparisonRow = {
  label: string;
  valuesByToolSlug: Record<string, string>;
};

export type BestPageRankedTool = {
  toolSlug: string;
  rank: number;
  verdict: string;
  bestFor: string;
  notIdealFor: string;
  criteriaHighlights?: string[];
};

export type BestPageInternalLink = {
  href: string;
  label: string;
  description: string;
};

export type BestPageEntry = {
  slug: string;
  targetKeyword: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  whoItsFor: string;
  howWeEvaluated: string[];
  comparisonTable: BestPageComparisonRow[];
  rankedTools: BestPageRankedTool[];
  faq: SeoFaqItem[];
  internalLinks: BestPageInternalLink[];
  primaryCategorySlug: string;
  supportingTagSlugs: string[];
  customSections?: {
    heading: string;
    body: string;
  }[];
};
```

- [ ] **Step 2: Create the hardcoded support-cluster best-page registry**

Create `src/server/seo/best-pages.ts` with the initial support/help-desk content entries.

```ts
import type { BestPageEntry } from "@/server/seo/types";

export const bestPagesRegistry: Record<string, BestPageEntry> = {
  "help-desk-software": {
    slug: "help-desk-software",
    targetKeyword: "best help desk software",
    title: "Best Help Desk Software",
    metaTitle: "Best Help Desk Software for Growing Teams | ShipBoost",
    metaDescription:
      "Compare the best help desk software for startups and growing support teams, with clear verdicts, use-case fit, and buyer-focused recommendations.",
    intro:
      "The best help desk software depends on how much structure, automation, and multichannel support your team needs. This page focuses on tools that are credible for real support operations, not just lightweight chat widgets.",
    whoItsFor:
      "This page is for founders, operators, and support leads choosing a system to manage tickets, conversations, and support workflows as volume grows.",
    howWeEvaluated: [
      "Ease of use for lean teams",
      "Ticketing and workflow depth",
      "Knowledge base and self-serve support",
      "Automation, routing, and multichannel coverage",
      "Overall fit for startup and small-business support teams",
    ],
    comparisonTable: [],
    rankedTools: [],
    faq: [],
    internalLinks: [],
    primaryCategorySlug: "support",
    supportingTagSlugs: ["help-desk", "customer-support", "ticketing"],
  },
};
```

- [ ] **Step 3: Reserve registry ownership boundaries**

Leave `src/server/seo/registry.ts` focused on:

- `alternativesSeoRegistry`
- `bestTagSeoRegistry`

Do not mix `/best/[slug]` content into the existing alternatives/tag registry file. Keep best-page content isolated in `src/server/seo/best-pages.ts`.

```ts
// Keep this file alternatives/tag-specific.
export const alternativesSeoRegistry = { ... };
export const bestTagSeoRegistry = { ... };
```

- [ ] **Step 4: Write the registry shape test**

Create `src/server/seo/best-pages.test.ts`.

```ts
import { describe, expect, it } from "vitest";
import { bestPagesRegistry } from "@/server/seo/best-pages";

describe("best-pages registry", () => {
  it("defines the first support cluster pages", () => {
    expect(bestPagesRegistry["help-desk-software"]).toBeDefined();
    expect(bestPagesRegistry["customer-support-software"]).toBeDefined();
    expect(bestPagesRegistry["customer-support-software-for-small-business"]).toBeDefined();
  });

  it("stores ranked tools in explicit order", () => {
    const page = bestPagesRegistry["help-desk-software"];

    expect(page.rankedTools.length).toBeGreaterThanOrEqual(6);
    expect(page.rankedTools[0]?.rank).toBe(1);
  });
});
```

- [ ] **Step 5: Run the new registry test**

Run:

```bash
npm test -- src/server/seo/best-pages.test.ts
```

Expected:

- FAIL initially if the support pages are incomplete
- PASS once the registry contains the required entries and minimum depth

---

### Task 2: Extend Server SEO Services and Cache Loaders for `/best/[slug]`

**Files:**
- Modify: `src/server/services/seo-service.ts`
- Modify: `src/server/services/seo-service.test.ts`
- Modify: `src/server/cache/public-content.ts`
- Create or expand: `src/server/seo/best-pages.ts`

- [ ] **Step 1: Add a best-page loader to `seo-service.ts`**

Implement a new service that resolves a best-page entry plus its ranked tools.

```ts
import { bestPagesRegistry } from "@/server/seo/best-pages";
import type { BestPageEntry } from "@/server/seo/types";

export async function getBestSeoPage(slug: string) {
  const entry: BestPageEntry | undefined = bestPagesRegistry[slug];

  if (!entry) {
    return null;
  }

  const rankedSlugs = entry.rankedTools.map((item) => item.toolSlug);
  const tools = await getPublishedToolsBySlugs(rankedSlugs);

  if (tools.length !== rankedSlugs.length) {
    return null;
  }

  const toolsBySlug = new Map(tools.map((tool) => [tool.slug, tool]));

  return {
    entry,
    tools: rankedSlugs.map((slug) => toolsBySlug.get(slug)!),
  };
}

export function hasBestSeoPage(slug: string) {
  return Boolean(bestPagesRegistry[slug]);
}
```

- [ ] **Step 2: Add tests for the new best-page service**

Extend `src/server/services/seo-service.test.ts`.

```ts
import { getBestSeoPage, hasBestSeoPage } from "@/server/services/seo-service";

it("returns null when a best page is missing from the registry", async () => {
  await expect(getBestSeoPage("missing-page")).resolves.toBeNull();
});

it("resolves a best page with ranked tools in registry order", async () => {
  vi.mocked(prisma.tool.findMany).mockResolvedValueOnce([
    { id: "tool_1", slug: "zendesk", name: "Zendesk", tagline: "..." },
    { id: "tool_2", slug: "freshdesk", name: "Freshdesk", tagline: "..." },
  ] as never);

  const page = await getBestSeoPage("help-desk-software");

  expect(page?.tools.map((tool) => tool.slug)).toEqual(["zendesk", "freshdesk"]);
  expect(page?.entry.title).toBe("Best Help Desk Software");
});

it("exposes a registry helper for best pages", () => {
  expect(hasBestSeoPage("help-desk-software")).toBe(true);
});
```

- [ ] **Step 3: Add cache and static params support in `public-content.ts`**

Add:

- `PUBLIC_BEST_PAGE_REVALIDATE`
- `PUBLIC_CACHE_TAGS.bestPages`
- `getCachedBestSeoPage(slug)`
- `getBestSeoStaticParams()`

```ts
export const PUBLIC_BEST_PAGE_REVALIDATE = 1800;

export const PUBLIC_CACHE_TAGS = {
  ...,
  bestPages: "public:best-pages",
};

export const getCachedBestSeoPage = cache(async (slug: string) =>
  unstable_cache(
    () => getBestSeoPage(slug),
    ["public-best-page", "v1", slug],
    {
      revalidate: PUBLIC_BEST_PAGE_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.bestPages, `public:best-page:${slug}`],
    },
  )(),
);

export function getBestSeoStaticParams() {
  return Object.keys(bestPagesRegistry)
    .sort((left, right) => left.localeCompare(right))
    .map((slug) => ({ slug }));
}
```

- [ ] **Step 4: Wire revalidation coverage**

Update `revalidateAllPublicContent()` so it invalidates the new `/best/*` route type and the new `/tags/*` route path.

```ts
revalidateTag(PUBLIC_CACHE_TAGS.bestPages, "max");
revalidatePath("/best/[slug]", "page");
revalidatePath("/tags/[slug]", "page");
```

- [ ] **Step 5: Run the SEO service tests**

Run:

```bash
npm test -- src/server/services/seo-service.test.ts
```

Expected:

- PASS with both alternatives, tag-page, and best-page coverage intact

---

### Task 3: Add the New `/tags/[slug]` Route and Redirect the Old Tag Route

**Files:**
- Create: `src/app/tags/[slug]/page.tsx`
- Modify: `next.config.ts`
- Modify: `src/app/tags/page.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `src/server/cache/public-content.ts`
- Modify: `src/server/seo/schema-builders.test.ts`

- [ ] **Step 1: Create the new tag detail route**

Create `src/app/tags/[slug]/page.tsx` by porting the existing page behavior from `src/app/best/tag/[slug]/page.tsx` and swapping all canonical/link paths to `/tags/${slug}`.

```ts
export async function generateStaticParams() {
  return getCachedBestTagStaticParams();
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getCachedBestTagPage(slug);

  if (!page) {
    return { title: "Page not found | ShipBoost" };
  }

  return buildPublicPageMetadata({
    title: page.entry.metaTitle,
    description: page.entry.metaDescription,
    url: `${getEnv().NEXT_PUBLIC_APP_URL}/tags/${slug}`,
  });
}
```

- [ ] **Step 2: Redirect the old route in `next.config.ts`**

Add a redirect rule.

```ts
const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/best/tag/:slug",
        destination: "/tags/:slug",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [ ... ],
  },
};
```

- [ ] **Step 3: Update the tag index page**

Modify `src/app/tags/page.tsx` so schema URLs and hrefs point to `/tags/${tag.slug}`.

```ts
items: tags.map((tag) => ({
  name: tag.name,
  url: `${env.NEXT_PUBLIC_APP_URL}/tags/${tag.slug}`,
}))

href={`/tags/${tag.slug}`}
```

- [ ] **Step 4: Update sitemap output for tags**

Modify `src/app/sitemap.ts` to emit `/tags/${slug}` instead of `/best/tag/${slug}`.

```ts
const bestTagRoutes: MetadataRoute.Sitemap = bestTagParams.map(({ slug }) => ({
  url: toAbsoluteUrl(`/tags/${slug}`, appUrl),
  lastModified: now,
  changeFrequency: "weekly",
  priority: 0.7,
}));
```

- [ ] **Step 5: Update schema tests for the tag route change**

Modify `src/server/seo/schema-builders.test.ts`.

```ts
const list = buildItemList([
  { name: "AI", url: "https://shipboost.io/tags/ai" },
]);
```

- [ ] **Step 6: Run focused tests for redirect-adjacent SEO artifacts**

Run:

```bash
npm test -- src/server/seo/schema-builders.test.ts src/server/seo/page-metadata.test.ts
```

Expected:

- PASS

---

### Task 4: Build the Canonical `/best/[slug]` Page Renderer

**Files:**
- Create: `src/app/best/[slug]/page.tsx`
- Modify: `src/server/seo/page-schema.ts`
- Modify: `src/server/seo/best-pages.ts`
- Modify: `src/server/cache/public-content.ts`

- [ ] **Step 1: Add a schema helper for best pages**

Extend `src/server/seo/page-schema.ts` with a helper that combines breadcrumbs, item list, and FAQ when present.

```ts
export function buildBestPageSchema(input: {
  title: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
  items: { name: string; url: string }[];
  faq?: { question: string; answer: string }[];
}) {
  const schemas = buildCollectionWithBreadcrumbSchema({
    name: input.title,
    description: input.description,
    url: input.url,
    breadcrumbs: input.breadcrumbs,
    items: input.items,
  });

  if (!input.faq?.length) {
    return schemas;
  }

  return [
    ...schemas,
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: input.title,
      description: input.description,
      url: input.url,
      mainEntity: input.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];
}
```

- [ ] **Step 2: Create the best-page route**

Create `src/app/best/[slug]/page.tsx`.

```ts
export function generateStaticParams() {
  return getBestSeoStaticParams();
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getCachedBestSeoPage(slug);

  if (!page) {
    return { title: "Page not found | ShipBoost" };
  }

  return buildPublicPageMetadata({
    title: page.entry.metaTitle,
    description: page.entry.metaDescription,
    url: `${getEnv().NEXT_PUBLIC_APP_URL}/best/${slug}`,
  });
}
```

- [ ] **Step 3: Render the page sections in the shared template**

Render these sections in order:

- breadcrumb
- title + intro
- “who this is for”
- “how we evaluated”
- comparison table
- ranked tool sections
- FAQ
- internal link section

Use the existing public card and link patterns where possible.

```tsx
<section>
  <h2>How we evaluated these tools</h2>
  <ul>
    {page.entry.howWeEvaluated.map((criterion) => (
      <li key={criterion}>{criterion}</li>
    ))}
  </ul>
</section>

<section>
  <h2>Top picks</h2>
  {page.entry.rankedTools.map((item) => {
    const tool = toolsBySlug.get(item.toolSlug)!;
    return (
      <article key={tool.id}>
        <h3>#{item.rank} {tool.name}</h3>
        <p>{item.verdict}</p>
        <p><strong>Best for:</strong> {item.bestFor}</p>
        <p><strong>Not ideal for:</strong> {item.notIdealFor}</p>
      </article>
    );
  })}
</section>
```

- [ ] **Step 4: Fill in the support-cluster content deeply enough to launch**

Complete `src/server/seo/best-pages.ts` with:

- 3 support pages
- 6 to 8 ranked tools minimum per page
- real comparison rows
- FAQ items
- real internal links

Use the seeded support tools already present in `ShipBoost-Docs/SEO-Plan/seo-anchor-tools-master.csv` as the initial ranking pool:

- Zendesk
- Freshdesk
- Help Scout
- Intercom
- Gorgias
- Crisp
- Front
- Zoho Desk
- LiveAgent

- [ ] **Step 5: Run a focused build check for the new route**

Run:

```bash
npx tsc --noEmit
```

Expected:

- PASS

---

### Task 5: Migrate Internal Links From `/best/tag/*` to `/tags/*`

**Files:**
- Modify: `src/app/categories/[slug]/page.tsx`
- Modify: `src/app/alternatives/[slug]/page.tsx`
- Modify: `src/app/tools/[slug]/page.tsx`
- Modify: `src/app/dashboard/tools/[toolId]/preview/page.tsx`
- Modify: `src/components/ToolCard.tsx`
- Modify: `src/components/public/public-tool-card.tsx`
- Modify: `src/components/public/public-directory-tool-card.tsx`
- Modify: `src/components/public/tool-page-content.tsx`
- Modify: `src/components/ui/flickering-footer.tsx`

- [ ] **Step 1: Replace all tag hrefs in public surfaces**

Update all links from:

```tsx
href={`/best/tag/${tag.slug}`}
```

to:

```tsx
href={`/tags/${tag.slug}`}
```

Affected files include:

- `src/app/categories/[slug]/page.tsx`
- `src/app/alternatives/[slug]/page.tsx`
- `src/app/tools/[slug]/page.tsx`
- `src/components/ToolCard.tsx`
- `src/components/public/public-tool-card.tsx`
- `src/components/public/public-directory-tool-card.tsx`
- `src/components/public/tool-page-content.tsx`

- [ ] **Step 2: Update preview/admin link parity**

Update preview surfaces so admin previews reflect production URLs.

```tsx
href={`/tags/${item.tag.slug}`}
```

Files:

- `src/app/dashboard/tools/[toolId]/preview/page.tsx`

- [ ] **Step 3: Update footer shortcuts**

Modify `src/components/ui/flickering-footer.tsx`.

```ts
{ id: 13, title: "AI-Powered", url: "/tags/ai" },
{ id: 14, title: "Open Source", url: "/tags/open-source" },
```

- [ ] **Step 4: Run a link-surface grep to confirm cleanup**

Run:

```bash
rg -n '/best/tag/' src
```

Expected:

- only transitional references that are intentionally kept
- ideally no production href/canonical/schema references remain

---

### Task 6: Expose `/best/*` Pages in Cluster Navigation and Sitemap

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/categories/[slug]/page.tsx`
- Modify: `src/app/tools/[slug]/page.tsx`
- Modify: `src/server/seo/best-pages.ts`

- [ ] **Step 1: Add `/best/*` routes to the sitemap**

Modify `src/app/sitemap.ts` to include best-page routes.

```ts
import { getBestSeoStaticParams } from "@/server/cache/public-content";

const [categoryParams, bestTagParams, bestPageParams, toolParams] = await Promise.all([
  getCachedCategoryStaticParams(),
  getCachedBestTagStaticParams(),
  getBestSeoStaticParams(),
  getCachedToolStaticParams(),
]);

const bestPageRoutes: MetadataRoute.Sitemap = bestPageParams.map(({ slug }) => ({
  url: toAbsoluteUrl(`/best/${slug}`, appUrl),
  lastModified: now,
  changeFrequency: "weekly",
  priority: 0.9,
}));
```

- [ ] **Step 2: Link category pages to the new canonical best pages**

Update `src/app/categories/[slug]/page.tsx` to include best-page links for matching clusters instead of only generic resource links.

```ts
const clusterLinks = category.slug === "support"
  ? [
      {
        href: "/best/help-desk-software",
        label: "Best help desk software",
        description: "See our buyer-intent ranking for support teams choosing a help desk.",
      },
      {
        href: "/best/customer-support-software",
        label: "Best customer support software",
        description: "Compare stronger support tools for growing teams.",
      },
    ]
  : [];
```

- [ ] **Step 3: Link tool pages to nearby best pages**

Extend `relatedListingLinks` in `src/app/tools/[slug]/page.tsx` using a best-page helper or hardcoded mapping keyed by category/tag overlap.

```ts
...(tool.toolCategories.some((item) => item.category.slug === "support")
  ? [
      {
        href: "/best/help-desk-software",
        label: "Best help desk software",
        description: "See how this tool compares against other leading support platforms.",
      },
    ]
  : []),
```

- [ ] **Step 4: Keep best-page internal links authored in the registry**

Populate each support page in `src/server/seo/best-pages.ts` with internal links like:

```ts
internalLinks: [
  {
    href: "/categories/support",
    label: "Browse support tools",
    description: "Explore the broader support category on ShipBoost.",
  },
  {
    href: "/alternatives/zendesk",
    label: "Compare Zendesk alternatives",
    description: "See which tools compete most directly with Zendesk.",
  },
  {
    href: "/tags/help-desk",
    label: "More help desk tools",
    description: "Browse support products grouped by help-desk intent.",
  },
],
```

- [ ] **Step 5: Run a sitemap-focused verification**

Run:

```bash
npm test -- src/server/seo/page-metadata.test.ts src/server/seo/schema-builders.test.ts
```

Then run:

```bash
npx tsc --noEmit
```

Expected:

- PASS

---

### Task 7: Final Verification Pass

**Files:**
- Verify all files changed above

- [ ] **Step 1: Verify there are no old canonical tag URLs left**

Run:

```bash
rg -n '/best/tag/' src
```

Expected:

- no canonical, sitemap, schema, or public href references remain

- [ ] **Step 2: Verify all focused tests**

Run:

```bash
npm test -- src/server/seo/best-pages.test.ts src/server/services/seo-service.test.ts src/server/seo/schema-builders.test.ts src/server/seo/page-metadata.test.ts
```

Expected:

- PASS

- [ ] **Step 3: Verify typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected:

- PASS

- [ ] **Step 4: Verify route inventory**

Run:

```bash
find src/app -maxdepth 3 -type f | sort | rg '/best/|/tags/'
```

Expected:

- includes `src/app/best/[slug]/page.tsx`
- includes `src/app/tags/[slug]/page.tsx`
- keeps `src/app/tags/page.tsx`

---

## Self-Review

### Spec coverage

Covered:

- canonical `/best/[slug]` page type
- `/tags/[slug]` migration
- hardcoded content system for v1
- editorial plus structured page composition
- internal-linking expectations
- first support/help-desk rollout
- sitemap and cache updates

Deferred by design:

- admin management for `/best/*`
- CRM rollout content beyond support-cluster follow-up

### Placeholder scan

Checked for unresolved placeholder markers and vague implementation language.

No placeholders intentionally left.

### Type consistency

The plan consistently uses:

- `BestPageEntry`
- `BestPageRankedTool`
- `getBestSeoPage`
- `getCachedBestSeoPage`
- `getBestSeoStaticParams`

Do not rename these during implementation unless every task is updated accordingly.
