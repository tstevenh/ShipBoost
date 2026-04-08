# SEO Registry Guide

This app does not manage SEO landing pages from the admin dashboard.

SEO pages are code-managed through:
- [src/server/seo/registry.ts](/Users/tsth/Coding/shipboost/my-app/src/server/seo/registry.ts)
- [src/server/seo/types.ts](/Users/tsth/Coding/shipboost/my-app/src/server/seo/types.ts)

That means a page only becomes live when you add a valid registry entry in code.

## Supported page types

### Alternatives pages
Route:
- `/alternatives/[tool-slug]`

Backed by:
- `alternativesSeoRegistry`

Use this when you want a manual editorial page like:
- `/alternatives/notion`
- `/alternatives/ahrefs`

### Best-by-tag pages
Route:
- `/best/tag/[tag-slug]`

Backed by:
- automatic DB lookup by tag slug
- optional copy overrides from `bestTagSeoRegistry`

Use this when you want a tag landing page like:
- `/best/tag/ai`
- `/best/tag/seo`

## Where to edit

Edit:
- [src/server/seo/registry.ts](/Users/tsth/Coding/shipboost/my-app/src/server/seo/registry.ts)

Types live in:
- [src/server/seo/types.ts](/Users/tsth/Coding/shipboost/my-app/src/server/seo/types.ts)

## Entry shapes

### Alternatives entry

```ts
type AlternativesSeoEntry = {
  slug: string;
  anchorToolSlug: string;
  title: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  toolSlugs: string[];
  faq?: { question: string; answer: string }[];
};
```

### Best-by-tag override entry

```ts
type BestTagSeoEntry = {
  slug: string;
  title?: string;
  intro?: string;
  metaTitle?: string;
  metaDescription?: string;
  faq?: { question: string; answer: string }[];
};
```

## Copy-paste examples

### Example: add an alternatives page

In [src/server/seo/registry.ts](/Users/tsth/Coding/shipboost/my-app/src/server/seo/registry.ts):

```ts
import type {
  AlternativesSeoEntry,
  BestTagSeoEntry,
} from "@/server/seo/types";

export const alternativesSeoRegistry: Record<string, AlternativesSeoEntry> = {
  notion: {
    slug: "notion",
    anchorToolSlug: "notion",
    title: "Best alternatives to Notion for SaaS founders",
    intro:
      "If Notion is close but not the right fit, these are the strongest manual alternatives currently published on Shipboost.",
    metaTitle: "Best alternatives to Notion for SaaS founders | Shipboost",
    metaDescription:
      "Manual editorial alternatives to Notion for bootstrapped SaaS founders.",
    toolSlugs: ["craft", "obsidian", "slite"],
    faq: [
      {
        question: "Why is this page manual instead of auto-generated?",
        answer:
          "Alternatives pages are curated in code so weak or irrelevant matches do not get published automatically.",
      },
    ],
  },
};

export const bestTagSeoRegistry: Record<string, BestTagSeoEntry> = {};
```

This creates:
- `/alternatives/notion`

### Example: add a best-by-tag override

In [src/server/seo/registry.ts](/Users/tsth/Coding/shipboost/my-app/src/server/seo/registry.ts):

```ts
import type {
  AlternativesSeoEntry,
  BestTagSeoEntry,
} from "@/server/seo/types";

export const alternativesSeoRegistry: Record<string, AlternativesSeoEntry> = {};

export const bestTagSeoRegistry: Record<string, BestTagSeoEntry> = {
  ai: {
    slug: "ai",
    title: "Best AI tools for bootstrapped SaaS founders",
    intro:
      "These are manual editorial picks from published Shipboost listings for founders who want useful AI leverage without bloated software stacks.",
    metaTitle: "Best AI tools for bootstrapped SaaS founders | Shipboost",
    metaDescription:
      "Curated AI tools chosen manually from published Shipboost listings.",
    faq: [
      {
        question: "How are these tools selected?",
        answer:
          "Best-by-tag pages automatically pull published tools with the matching tag, while copy can still be overridden in code.",
      },
    ],
  },
};
```

This creates:
- `/best/tag/ai`

## Rules for a page to render

The page will render only if:
- the tag exists in the database
- the tag is active
- at least one tool with that tag is `PUBLISHED`
- at least one tool with that tag is `APPROVED`

For alternatives pages, one more rule applies:
- the `anchorToolSlug` must also resolve to a published, approved tool

If those conditions are not met, the route returns `404`.

For best-tag pages, a registry entry is optional. If no override exists, the page still renders with generated title, intro, and metadata.

## Common mistakes

### 1. Using a slug that does not exist in the database
If `toolSlugs` contains a slug that is not in the DB, that tool is skipped.

If all configured tools are skipped, the page returns `404`.

### 2. Using unpublished tools
Only published and approved tools are allowed onto SEO pages.

### 3. Mixing display copy with DB truth
Do not hardcode tool names in the page component.

Only put:
- editorial page copy
- metadata
- ordered tool slugs

The actual tool card data comes from Prisma.

### 4. Expecting inactive or empty tags to render
`/best/tag/[tag-slug]` only renders when the tag exists, is active, and has at least one published + approved tool.

## Recommended workflow

1. Confirm the tool or tag slugs already exist in the database.
2. Add the new entry to [src/server/seo/registry.ts](/Users/tsth/Coding/shipboost/my-app/src/server/seo/registry.ts).
3. Run:

```bash
npx tsc --noEmit
npm run lint
```

4. Open the route locally:
- `/alternatives/[tool-slug]`
- `/best/tag/[tag-slug]`

5. Confirm the page renders instead of returning `404`.

For best-tag pages, step 2 is optional unless you want custom copy.

## Current implementation notes

- Alternatives pages are fully manual only.
- Best-by-tag pages auto-load tools from DB tag membership.
- Best-by-tag registry entries are optional copy overrides.
- Category pages stay canonical at `/categories/[slug]`.
- The tool page only shows a "Compare alternatives" link when an alternatives registry entry exists.
- Category pages link active top tags to `/best/tag/[tag-slug]`.

## Related files

- [src/server/seo/registry.ts](/Users/tsth/Coding/shipboost/my-app/src/server/seo/registry.ts)
- [src/server/seo/types.ts](/Users/tsth/Coding/shipboost/my-app/src/server/seo/types.ts)
- [src/server/services/seo-service.ts](/Users/tsth/Coding/shipboost/my-app/src/server/services/seo-service.ts)
- [src/app/alternatives/[slug]/page.tsx](/Users/tsth/Coding/shipboost/my-app/src/app/alternatives/[slug]/page.tsx)
- [src/app/best/tag/[slug]/page.tsx](/Users/tsth/Coding/shipboost/my-app/src/app/best/tag/[slug]/page.tsx)
