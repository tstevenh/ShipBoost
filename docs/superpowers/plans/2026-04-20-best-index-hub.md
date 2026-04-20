# Best Index Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a grouped `/best` hub page for buyer-intent SEO pages and tighten the strongest internal links into the existing support and CRM buying-guide clusters.

**Architecture:** Extend the existing hardcoded best-page registry with an explicit hub configuration, then render a dedicated `/best` route using the same metadata, schema, and showcase patterns already used by `/categories`, `/tags`, and `/alternatives`. Keep category-page linking as-is where it already works, but make the hub index discoverable in sitemap/footer and expose buyer-guide links more clearly on tool pages.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Next metadata/sitemap APIs, existing ShipBoost SEO helpers, Vitest

---

## Notes Before Execution

- This plan intentionally omits git commit steps because the user handles commits manually.
- Reuse the existing `bestPagesRegistry` instead of inventing a new CMS or DB-backed layer.
- Do not change the existing `/best/[slug]` content architecture in this batch.
- The category pages already compute and render `bestPageLinks`, so the plan should preserve that behavior rather than replacing it.

## File Structure Map

### New files

- Create: `src/app/best/page.tsx`

### Existing files to modify

- Modify: `src/server/seo/best-pages.ts`
- Modify: `src/server/seo/best-pages.test.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/server/cache/public-content.ts`
- Modify: `src/components/ui/flickering-footer.tsx`
- Modify: `src/app/tools/[slug]/page.tsx`
- Modify: `src/components/public/tool-page-content.tsx`

### Existing files to reuse without changing structure

- Reuse: `src/server/seo/page-metadata.ts`
- Reuse: `src/server/seo/page-schema.ts`
- Reuse: `src/components/public/showcase-layout.tsx`
- Reuse: `src/components/seo/json-ld.tsx`
- Reuse: `src/components/seo/internal-link-section.tsx`

---

### Task 1: Add a Best-Hub Registry Alongside the Existing Best Pages

**Files:**
- Modify: `src/server/seo/best-pages.ts`
- Modify: `src/server/seo/best-pages.test.ts`

- [ ] **Step 1: Define the hub-section types in `best-pages.ts`**

Add explicit hub-section types near the top of `src/server/seo/best-pages.ts` so the `/best` index is driven by config rather than inferred from page copy.

```ts
export type BestHubSupportingLink = {
  href: string;
  label: string;
  description: string;
};

export type BestHubSection = {
  slug: string;
  title: string;
  intro: string;
  pageSlugs: string[];
  supportingLinks: BestHubSupportingLink[];
};
```

- [ ] **Step 2: Export a grouped hub config for Support and CRM**

In the same file, add a `bestHubSections` export below `bestPagesRegistry`.

```ts
export const bestHubSections: BestHubSection[] = [
  {
    slug: "support",
    title: "Support",
    intro:
      "These pages help founders compare help desk, customer support, and service-platform options with clearer buying intent than a broad category directory.",
    pageSlugs: [
      "help-desk-software",
      "customer-support-software",
      "customer-support-software-for-small-business",
    ],
    supportingLinks: [
      {
        href: "/categories/support",
        label: "Browse support tools",
        description: "Explore the wider support category on ShipBoost.",
      },
      {
        href: "/alternatives",
        label: "Compare support alternatives",
        description: "See comparison pages for major support platforms.",
      },
    ],
  },
  {
    slug: "crm",
    title: "CRM",
    intro:
      "These pages narrow CRM decisions by buyer job, from general CRM evaluation to startup-fit and small-business operational needs.",
    pageSlugs: [
      "crm-software",
      "crm-for-startups",
      "crm-software-for-small-business",
    ],
    supportingLinks: [
      {
        href: "/categories/sales",
        label: "Browse sales tools",
        description: "Explore the broader sales and CRM category on ShipBoost.",
      },
      {
        href: "/alternatives",
        label: "Compare CRM alternatives",
        description: "See comparison pages for major CRM products.",
      },
    ],
  },
];
```

- [ ] **Step 3: Add a tiny resolver for page entries used by the hub**

Still in `src/server/seo/best-pages.ts`, add a helper that maps page slugs to entries and filters missing values defensively.

```ts
export function getBestHubPageEntries(pageSlugs: string[]) {
  return pageSlugs
    .map((slug) => bestPagesRegistry[slug])
    .filter(
      (entry): entry is BestPageEntry =>
        Boolean(entry),
    );
}
```

- [ ] **Step 4: Extend the registry test to cover the hub config**

Update `src/server/seo/best-pages.test.ts` with one more test for section coverage.

```ts
import { bestHubSections, bestPagesRegistry } from "@/server/seo/best-pages";

it("maps every hub section slug to real best pages", () => {
  for (const section of bestHubSections) {
    expect(section.pageSlugs.length).toBeGreaterThan(0);

    for (const slug of section.pageSlugs) {
      expect(bestPagesRegistry[slug]).toBeDefined();
    }
  }
});
```

- [ ] **Step 5: Run the best-pages test file**

Run:

```bash
npm test -- src/server/seo/best-pages.test.ts
```

Expected:

- PASS with the existing best-page coverage plus the new hub-section test

---

### Task 2: Build the `/best` Grouped Hub Page

**Files:**
- Create: `src/app/best/page.tsx`
- Modify: `src/server/seo/best-pages.ts`

- [ ] **Step 1: Create the `/best` route using the existing index-page pattern**

Create `src/app/best/page.tsx` and mirror the structure already used by `/categories`, `/tags`, and `/alternatives`.

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home as HomeIcon } from "lucide-react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { Footer } from "@/components/ui/footer";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildCollectionListingSchema } from "@/server/seo/page-schema";
import {
  bestHubSections,
  getBestHubPageEntries,
} from "@/server/seo/best-pages";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Best SaaS Software Buying Guides | ShipBoost",
  description:
    "Browse grouped buying guides for help desk, customer support, CRM, and other high-intent SaaS software comparisons on ShipBoost.",
  url: "/best",
});
```

- [ ] **Step 2: Build collection schema from all hub-linked pages**

Inside the page component, flatten all linked buyer-intent pages and feed them into `buildCollectionListingSchema`.

```tsx
const env = getEnv();
const hubEntries = bestHubSections.flatMap((section) =>
  getBestHubPageEntries(section.pageSlugs),
);

const schema = buildCollectionListingSchema({
  name: "Best SaaS Software Buying Guides",
  description:
    "Grouped buying guides for support and CRM software comparisons on ShipBoost.",
  url: `${env.NEXT_PUBLIC_APP_URL}/best`,
  items: hubEntries.map((entry) => ({
    name: entry.title,
    url: `${env.NEXT_PUBLIC_APP_URL}/best/${entry.slug}`,
  })),
});
```

- [ ] **Step 3: Render a hero plus grouped cluster sections**

Render one card per cluster, with the cluster intro, page links, and supporting links underneath.

```tsx
export default function BestIndexPage() {
  const env = getEnv();
  const hubEntries = bestHubSections.flatMap((section) =>
    getBestHubPageEntries(section.pageSlugs),
  );
  const schema = buildCollectionListingSchema({
    name: "Best SaaS Software Buying Guides",
    description:
      "Grouped buying guides for support and CRM software comparisons on ShipBoost.",
    url: `${env.NEXT_PUBLIC_APP_URL}/best`,
    items: hubEntries.map((entry) => ({
      name: entry.title,
      url: `${env.NEXT_PUBLIC_APP_URL}/best/${entry.slug}`,
    })),
  });

  return (
    <main className="flex-1">
      <JsonLdScript data={schema} />
      <ShowcaseLayout>
        <div className="pb-10">
          <nav className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground/60">
            <Link href="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
              <HomeIcon size={12} /> Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-foreground">Best</span>
          </nav>
        </div>

        <section className="space-y-10">
          <div className="max-w-4xl">
            <h1 className="mb-6 text-5xl font-black tracking-tight text-foreground">
              Best SaaS Software Buying Guides
            </h1>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
              Browse grouped buying guides built for specific comparison jobs, not just broad directories. These pages are where ShipBoost narrows categories into real software decisions.
            </p>
          </div>

          <div className="grid gap-6">
            {bestHubSections.map((section) => {
              const pages = getBestHubPageEntries(section.pageSlugs);

              return (
                <section
                  key={section.slug}
                  className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
                >
                  <div className="max-w-3xl">
                    <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground">
                      Cluster
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                      {section.title}
                    </h2>
                    <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
                      {section.intro}
                    </p>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {pages.map((page) => (
                      <Link
                        key={page.slug}
                        href={`/best/${page.slug}`}
                        className="group rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5"
                      >
                        <h3 className="text-lg font-black text-foreground transition-colors group-hover:text-primary">
                          {page.title}
                        </h3>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                          {page.metaDescription}
                        </p>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {section.supportingLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition-colors hover:border-foreground/20 hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}
```

- [ ] **Step 4: Run a production build to verify `/best` is emitted**

Run:

```bash
npm run build
```

Expected:

- PASS
- the route list includes `● /best`

---

### Task 3: Make `/best` Discoverable in Sitemap and Revalidation

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/server/cache/public-content.ts`

- [ ] **Step 1: Add `/best` to the sitemap static routes**

Update `src/app/sitemap.ts` and insert the `/best` route alongside `/categories`, `/tags`, and `/alternatives`.

```ts
{
  url: toAbsoluteUrl("/best", appUrl),
  lastModified: now,
  changeFrequency: "weekly",
  priority: 0.9,
},
```

- [ ] **Step 2: Revalidate the `/best` hub when public content changes**

Update `revalidateAllPublicContent()` in `src/server/cache/public-content.ts` to include the new hub path.

```ts
revalidatePath("/best");
revalidatePath("/best/[slug]", "page");
```

- [ ] **Step 3: Run build again to verify sitemap and route generation**

Run:

```bash
npm run build
```

Expected:

- PASS
- `/best` is still present in the generated routes
- no type or metadata errors from sitemap generation

---

### Task 4: Make the Best Hub Reachable from the Footer

**Files:**
- Modify: `src/components/ui/flickering-footer.tsx`

- [ ] **Step 1: Add a `/best` index link to the Best Pages footer column**

Update the `Best Pages` footer links so the grouped hub is reachable from every page.

```ts
{
  title: "Best Pages",
  links: [
    { id: 13, title: "Browse all buying guides", url: "/best" },
    { id: 14, title: "Best Help Desk Software", url: "/best/help-desk-software" },
    { id: 15, title: "Best Customer Support Software", url: "/best/customer-support-software" },
    { id: 16, title: "Best Support Software for SMB", url: "/best/customer-support-software-for-small-business" },
    { id: 17, title: "Best CRM Software", url: "/best/crm-software" },
    { id: 18, title: "Best CRM for Startups", url: "/best/crm-for-startups" },
    { id: 19, title: "Best CRM for SMB", url: "/best/crm-software-for-small-business" },
  ],
},
```

- [ ] **Step 2: Keep link IDs unique after insertion**

If the inserted `/best` link shifts the current numeric IDs, renumber the following `Tags` and `Company` items to keep the array stable and unique.

```ts
{ id: 20, title: "AI-Powered", url: "/tags/ai" }
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected:

- PASS

---

### Task 5: Separate Buyer Guides from Generic Explore Links on Tool Pages

**Files:**
- Modify: `src/app/tools/[slug]/page.tsx`
- Modify: `src/components/public/tool-page-content.tsx`

- [ ] **Step 1: Split buyer-guide links from generic listing links in the route**

In `src/app/tools/[slug]/page.tsx`, stop merging best-page links into `relatedListingLinks`. Keep them in a dedicated array.

```ts
const bestGuideLinks = primaryCategory
  ? Object.values(bestPagesRegistry)
      .filter((entry) => entry.primaryCategorySlug === primaryCategory.slug)
      .slice(0, 3)
      .map((entry) => ({
        href: `/best/${entry.slug}`,
        label: entry.title,
        description: entry.metaDescription,
      }))
  : [];

const relatedListingLinks = [
  ...(primaryCategory
    ? [
        {
          href: `/categories/${primaryCategory.slug}`,
          label: `Browse ${primaryCategory.name} tools`,
          description: `Explore more tools in ${primaryCategory.name} on ShipBoost.`,
        },
      ]
    : []),
  ...tool.toolTags.slice(0, 3).map((item) => ({
    href: `/tags/${item.tag.slug}`,
    label: `More ${item.tag.name} tools`,
    description: `See other products tagged ${item.tag.name}.`,
  })),
  ...(hasAlternativesSeoPage(tool.slug)
    ? [
        {
          href: `/alternatives/${tool.slug}`,
          label: `Compare ${tool.name} alternatives`,
          description: `Evaluate other tools that solve a similar problem.`,
        },
      ]
    : []),
];
```

- [ ] **Step 2: Pass the dedicated buyer-guide links into `ToolPageContent`**

Update the JSX call site in `src/app/tools/[slug]/page.tsx`.

```tsx
return (
  <ToolPageContent
    tool={tool}
    relatedTools={relatedTools}
    relatedListingLinks={relatedListingLinks}
    bestGuideLinks={bestGuideLinks}
    canonicalUrl={canonical}
  />
);
```

- [ ] **Step 3: Extend the `ToolPageContent` props and render a separate Buyer Guides section**

Update `src/components/public/tool-page-content.tsx` to accept a `bestGuideLinks` prop and render a dedicated `InternalLinkSection`.

```tsx
export function ToolPageContent({
  tool,
  relatedTools,
  relatedListingLinks,
  bestGuideLinks,
  canonicalUrl,
  isPreview = false,
}: {
  tool: ToolPageData;
  relatedTools: RelatedTool[];
  relatedListingLinks: {
    href: string;
    label: string;
    description: string;
  }[];
  bestGuideLinks: {
    href: string;
    label: string;
    description: string;
  }[];
  canonicalUrl: string;
  isPreview?: boolean;
}) {
  const buyerGuidesSection =
    bestGuideLinks.length > 0 ? (
      <InternalLinkSection
        eyebrow="Buyer Guides"
        title={`Where ${tool.name} fits in current buying guides`}
        description="These pages narrow the broader category down into specific comparison jobs and help you evaluate buyer fit more directly."
        links={bestGuideLinks}
      />
    ) : null;
```

- [ ] **Step 4: Render the buyer-guides section above the generic explore links**

Still in `ToolPageContent`, place the new section before the existing `morePathsSection`.

```tsx
<ToolRelatedProducts relatedTools={relatedTools} />

{buyerGuidesSection}

<div className="lg:hidden">{morePathsSection}</div>
```

For the desktop column, mirror the same order:

```tsx
{buyerGuidesSection}
<div className="hidden lg:block">{morePathsSection}</div>
```

- [ ] **Step 5: Run typecheck and build**

Run:

```bash
npx tsc --noEmit
npm run build
```

Expected:

- PASS
- tool pages compile with the new prop shape
- the build still emits `/best` and all `/best/[slug]` pages

---

## Self-Review

### Spec coverage

- `/best` grouped hub page: covered by Task 2
- explicit hub config: covered by Task 1
- metadata/schema for `/best`: covered by Task 2
- sitemap and indexability: covered by Task 3
- footer discoverability: covered by Task 4
- stronger buyer-guide internal linking on tool pages: covered by Task 5
- category support/CRM linking: already present in `src/app/categories/[slug]/page.tsx`, so no replacement task is necessary in this batch

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain
- Every task includes exact files and concrete code or commands

### Type consistency

- Hub config and resolver live in `src/server/seo/best-pages.ts`
- `/best` page imports `bestHubSections` and `getBestHubPageEntries`
- tool pages use `bestGuideLinks` consistently from route to component

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-best-index-hub.md`.

Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

