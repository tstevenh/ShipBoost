# Schema Markup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a centralized JSON-LD schema system for all current public ShipBoost routes, plus explicit noindex metadata for auth and private pages.

**Architecture:** Build pure schema builders and ShipBoost-specific page helpers under `src/server/seo`, then render JSON-LD from route files through a tiny presentational component. Keep indexed public pages semantically marked up by page intent, and keep auth/private routes out of the index with explicit robots metadata.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library

---

## File Structure

### New files
- `src/components/seo/json-ld.tsx`
  - renders one or many JSON-LD blocks
- `src/server/seo/schema-types.ts`
  - local JSON-LD types and route-facing schema input types
- `src/server/seo/site-schema.ts`
  - canonical ShipBoost org/site constants
- `src/server/seo/schema-builders.ts`
  - pure schema factory functions
- `src/server/seo/page-schema.ts`
  - route-level composition helpers
- `src/server/seo/schema-builders.test.ts`
  - unit tests for builders
- `src/server/seo/page-schema.test.ts`
  - unit tests for page helpers

### Modified files
- `src/app/page.tsx`
- `src/app/launches/[board]/page.tsx`
- `src/app/categories/page.tsx`
- `src/app/categories/[slug]/page.tsx`
- `src/app/tags/page.tsx`
- `src/app/best/tag/[slug]/page.tsx`
- `src/app/alternatives/page.tsx`
- `src/app/alternatives/[slug]/page.tsx`
- `src/app/tools/[slug]/page.tsx`
- `src/app/pricing/page.tsx`
- `src/app/how-it-works/page.tsx`
- `src/app/launch-guide/page.tsx`
- `src/app/faqs/page.tsx`
- `src/app/about/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/affiliate/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/sign-in/page.tsx`
- `src/app/sign-up/page.tsx`
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/verify-email/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/tools/[toolId]/page.tsx`
- `src/app/admin/page.tsx`

---

### Task 1: Build the shared schema foundation

**Files:**
- Create: `src/server/seo/schema-types.ts`
- Create: `src/server/seo/site-schema.ts`
- Create: `src/server/seo/schema-builders.ts`
- Create: `src/server/seo/schema-builders.test.ts`
- Create: `src/components/seo/json-ld.tsx`

- [ ] **Step 1: Write failing builder tests**

Create `src/server/seo/schema-builders.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbList,
  buildCollectionPage,
  buildItemList,
  buildOrganization,
  buildSoftwareApplication,
  buildWebSite,
} from "@/server/seo/schema-builders";

describe("schema-builders", () => {
  it("builds an organization from the shared site constants", () => {
    const schema = buildOrganization();

    expect(schema["@type"]).toBe("Organization");
    expect(schema.name).toBe("ShipBoost");
    expect(schema.url).toBe("https://shipboost.io");
  });

  it("builds a website with the home url", () => {
    const schema = buildWebSite();

    expect(schema["@type"]).toBe("WebSite");
    expect(schema.url).toBe("https://shipboost.io");
  });

  it("builds ordered list items", () => {
    const schema = buildItemList([
      { name: "Tool One", url: "https://shipboost.io/tools/tool-one" },
      { name: "Tool Two", url: "https://shipboost.io/tools/tool-two" },
    ]);

    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].position).toBe(2);
  });

  it("builds a collection page with a linked item list", () => {
    const list = buildItemList([
      { name: "AI", url: "https://shipboost.io/best/tag/ai" },
    ]);
    const schema = buildCollectionPage({
      name: "Browse Tags",
      description: "Explore tags",
      url: "https://shipboost.io/tags",
      mainEntity: list,
    });

    expect(schema["@type"]).toBe("CollectionPage");
    expect(schema.mainEntity).toBe(list);
  });

  it("builds breadcrumbs in order", () => {
    const schema = buildBreadcrumbList([
      { name: "Home", url: "https://shipboost.io/" },
      { name: "Categories", url: "https://shipboost.io/categories" },
      { name: "AI", url: "https://shipboost.io/categories/ai" },
    ]);

    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[2].name).toBe("AI");
  });

  it("omits price and review fields for software apps when absent", () => {
    const schema = buildSoftwareApplication({
      name: "ShipFast",
      description: "Launch apps faster",
      url: "https://shipboost.io/tools/shipfast",
      image: "https://shipboost.io/logo.png",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
    });

    expect(schema["@type"]).toBe("SoftwareApplication");
    expect("aggregateRating" in schema).toBe(false);
    expect("review" in schema).toBe(false);
    expect("offers" in schema).toBe(false);
  });
});
```

- [ ] **Step 2: Run the new tests to confirm failure**

Run: `npm test -- src/server/seo/schema-builders.test.ts`
Expected: FAIL with module not found errors for `@/server/seo/schema-builders`

- [ ] **Step 3: Add the shared schema types and site constants**

Create `src/server/seo/schema-types.ts`:

```ts
export type JsonLd =
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

export type BreadcrumbInput = {
  name: string;
  url: string;
};

export type ListItemInput = {
  name: string;
  url: string;
};

export type SoftwareApplicationInput = {
  name: string;
  description: string;
  url: string;
  image?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: Record<string, unknown>;
};
```

Create `src/server/seo/site-schema.ts`:

```ts
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shipboost.io";

export const shipBoostSiteSchema = {
  name: "ShipBoost",
  url: appUrl.replace(/\/$/, ""),
  logoUrl: `${appUrl.replace(/\/$/, "")}/logos/logo-black.png`,
  supportEmail: "support@shipboost.io",
} as const;
```

- [ ] **Step 4: Add the pure builders and JSON-LD renderer**

Create `src/server/seo/schema-builders.ts`:

```ts
import {
  type BreadcrumbInput,
  type ListItemInput,
  type SoftwareApplicationInput,
} from "@/server/seo/schema-types";
import { shipBoostSiteSchema } from "@/server/seo/site-schema";

export function buildOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shipBoostSiteSchema.name,
    url: shipBoostSiteSchema.url,
    logo: shipBoostSiteSchema.logoUrl,
    email: shipBoostSiteSchema.supportEmail,
  };
}

export function buildWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shipBoostSiteSchema.name,
    url: shipBoostSiteSchema.url,
  };
}

export function buildItemList(items: ListItemInput[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function buildBreadcrumbList(items: BreadcrumbInput[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildCollectionPage(input: {
  name: string;
  description: string;
  url: string;
  mainEntity: Record<string, unknown>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: input.url,
    mainEntity: input.mainEntity,
  };
}

export function buildSoftwareApplication(input: SoftwareApplicationInput) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    applicationCategory: input.applicationCategory,
    operatingSystem: input.operatingSystem ?? "Web",
    ...(input.offers ? { offers: input.offers } : {}),
  };
}
```

Create `src/components/seo/json-ld.tsx`:

```tsx
import type { JsonLd } from "@/server/seo/schema-types";

function normalizeJsonLd(input: JsonLd) {
  return Array.isArray(input) ? input : [input];
}

export function JsonLdScript({ data }: { data: JsonLd }) {
  return (
    <>
      {normalizeJsonLd(data).map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  );
}
```

- [ ] **Step 5: Run the builder tests and verify they pass**

Run: `npm test -- src/server/seo/schema-builders.test.ts`
Expected: PASS with all tests green

- [ ] **Step 6: Commit**

```bash
git add src/server/seo/schema-types.ts src/server/seo/site-schema.ts src/server/seo/schema-builders.ts src/server/seo/schema-builders.test.ts src/components/seo/json-ld.tsx
git commit -m "feat: add shared schema builders"
```

---

### Task 2: Add page-schema helpers and wire the homepage plus tool page

**Files:**
- Create: `src/server/seo/page-schema.ts`
- Create: `src/server/seo/page-schema.test.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/tools/[slug]/page.tsx`

- [ ] **Step 1: Write failing helper tests for the homepage and tool routes**

Create `src/server/seo/page-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  buildHomePageSchema,
  buildToolPageSchema,
} from "@/server/seo/page-schema";

describe("page-schema", () => {
  it("returns organization, website, collection page, and item list for the homepage", () => {
    const schemas = buildHomePageSchema({
      title: "ShipBoost",
      description: "Launch smarter",
      url: "https://shipboost.io",
      items: [
        { name: "Tool One", url: "https://shipboost.io/tools/tool-one" },
      ],
    });

    expect(schemas).toHaveLength(4);
    expect(schemas.map((item) => item["@type"])).toEqual([
      "Organization",
      "WebSite",
      "ItemList",
      "CollectionPage",
    ]);
  });

  it("returns software application plus breadcrumb for tool pages", () => {
    const schemas = buildToolPageSchema({
      name: "ShipFast",
      description: "Launch apps faster",
      url: "https://shipboost.io/tools/shipfast",
      image: "https://shipboost.io/logo.png",
      categoryName: "Developer Tools",
    });

    expect(schemas.map((item) => item["@type"])).toEqual([
      "BreadcrumbList",
      "SoftwareApplication",
    ]);
  });
});
```

- [ ] **Step 2: Run the helper tests to confirm failure**

Run: `npm test -- src/server/seo/page-schema.test.ts`
Expected: FAIL with module not found for `@/server/seo/page-schema`

- [ ] **Step 3: Add page composition helpers**

Create `src/server/seo/page-schema.ts`:

```ts
import {
  buildBreadcrumbList,
  buildCollectionPage,
  buildItemList,
  buildOrganization,
  buildSoftwareApplication,
  buildWebSite,
} from "@/server/seo/schema-builders";

export function buildHomePageSchema(input: {
  title: string;
  description: string;
  url: string;
  items: { name: string; url: string }[];
}) {
  const list = buildItemList(input.items);

  return [
    buildOrganization(),
    buildWebSite(),
    list,
    buildCollectionPage({
      name: input.title,
      description: input.description,
      url: input.url,
      mainEntity: list,
    }),
  ];
}

export function buildToolPageSchema(input: {
  name: string;
  description: string;
  url: string;
  image?: string;
  categoryName?: string | null;
}) {
  return [
    buildBreadcrumbList([
      { name: "Home", url: "https://shipboost.io" },
      { name: input.name, url: input.url },
    ]),
    buildSoftwareApplication({
      name: input.name,
      description: input.description,
      url: input.url,
      image: input.image,
      applicationCategory: input.categoryName ?? "BusinessApplication",
      operatingSystem: "Web",
    }),
  ];
}
```

- [ ] **Step 4: Render homepage and tool-page schema**

Modify `src/app/page.tsx`:

```tsx
import { JsonLdScript } from "@/components/seo/json-ld";
import { buildHomePageSchema } from "@/server/seo/page-schema";

// inside the page component, after data load
const homeSchema = buildHomePageSchema({
  title: "ShipBoost | Launch smarter. Get distributed.",
  description:
    "ShipBoost helps bootstrapped SaaS founders earn trust, visibility, and momentum through curated distribution.",
  url: env.NEXT_PUBLIC_APP_URL,
  items: launches.map((launch) => ({
    name: launch.tool.name,
    url: `${env.NEXT_PUBLIC_APP_URL}/tools/${launch.tool.slug}`,
  })),
});

return (
  <main className="flex-1">
    <JsonLdScript data={homeSchema} />
    {/* existing content */}
  </main>
);
```

Modify `src/app/tools/[slug]/page.tsx`:

```tsx
import { JsonLdScript } from "@/components/seo/json-ld";
import { buildToolPageSchema } from "@/server/seo/page-schema";

// after tool load
const toolSchema = buildToolPageSchema({
  name: tool.name,
  description: buildToolDescription(tool),
  url: canonical,
  image: tool.logoMedia?.url,
  categoryName: primaryCategory?.name ?? null,
});

return (
  <ViewerVoteStateProvider toolIds={[tool.id]}>
    <main className="flex-1 bg-background pt-28">
      <JsonLdScript data={toolSchema} />
      {/* existing content */}
    </main>
  </ViewerVoteStateProvider>
);
```

- [ ] **Step 5: Run tests for builders and page helpers**

Run: `npm test -- src/server/seo/schema-builders.test.ts src/server/seo/page-schema.test.ts`
Expected: PASS with both files green

- [ ] **Step 6: Commit**

```bash
git add src/server/seo/page-schema.ts src/server/seo/page-schema.test.ts src/app/page.tsx src/app/tools/[slug]/page.tsx
git commit -m "feat: add homepage and tool page schema"
```

---

### Task 3: Add collection-page schema to browse surfaces

**Files:**
- Modify: `src/server/seo/page-schema.ts`
- Modify: `src/server/seo/page-schema.test.ts`
- Modify: `src/app/launches/[board]/page.tsx`
- Modify: `src/app/categories/page.tsx`
- Modify: `src/app/categories/[slug]/page.tsx`
- Modify: `src/app/tags/page.tsx`
- Modify: `src/app/best/tag/[slug]/page.tsx`
- Modify: `src/app/alternatives/page.tsx`
- Modify: `src/app/alternatives/[slug]/page.tsx`

- [ ] **Step 1: Extend helper tests for collection pages**

Update `src/server/seo/page-schema.test.ts`:

```ts
import {
  buildCollectionListingSchema,
  buildCollectionWithBreadcrumbSchema,
} from "@/server/seo/page-schema";

it("returns item list plus collection page for index pages", () => {
  const schemas = buildCollectionListingSchema({
    name: "Browse Categories",
    description: "Explore categories",
    url: "https://shipboost.io/categories",
    items: [{ name: "AI", url: "https://shipboost.io/categories/ai" }],
  });

  expect(schemas.map((item) => item["@type"])).toEqual([
    "ItemList",
    "CollectionPage",
  ]);
});

it("returns breadcrumb, item list, and collection page for detail browse pages", () => {
  const schemas = buildCollectionWithBreadcrumbSchema({
    name: "AI Tools",
    description: "Browse AI tools",
    url: "https://shipboost.io/categories/ai",
    breadcrumbs: [
      { name: "Home", url: "https://shipboost.io" },
      { name: "Categories", url: "https://shipboost.io/categories" },
      { name: "AI", url: "https://shipboost.io/categories/ai" },
    ],
    items: [{ name: "Tool One", url: "https://shipboost.io/tools/tool-one" }],
  });

  expect(schemas.map((item) => item["@type"])).toEqual([
    "BreadcrumbList",
    "ItemList",
    "CollectionPage",
  ]);
});
```

- [ ] **Step 2: Run the helper tests to confirm failure**

Run: `npm test -- src/server/seo/page-schema.test.ts`
Expected: FAIL because the new exports do not exist yet

- [ ] **Step 3: Add collection helper functions**

Update `src/server/seo/page-schema.ts`:

```ts
export function buildCollectionListingSchema(input: {
  name: string;
  description: string;
  url: string;
  items: { name: string; url: string }[];
}) {
  const list = buildItemList(input.items);

  return [
    list,
    buildCollectionPage({
      name: input.name,
      description: input.description,
      url: input.url,
      mainEntity: list,
    }),
  ];
}

export function buildCollectionWithBreadcrumbSchema(input: {
  name: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
  items: { name: string; url: string }[];
}) {
  const list = buildItemList(input.items);

  return [
    buildBreadcrumbList(input.breadcrumbs),
    list,
    buildCollectionPage({
      name: input.name,
      description: input.description,
      url: input.url,
      mainEntity: list,
    }),
  ];
}
```

- [ ] **Step 4: Wire schema into browse pages**

Apply the same pattern to each route:

```tsx
import { JsonLdScript } from "@/components/seo/json-ld";
import {
  buildCollectionListingSchema,
  buildCollectionWithBreadcrumbSchema,
} from "@/server/seo/page-schema";
```

For `src/app/categories/page.tsx`:

```tsx
const schema = buildCollectionListingSchema({
  name: "Browse Categories",
  description: "Explore curated SaaS categories for bootstrapped founders.",
  url: `${getEnv().NEXT_PUBLIC_APP_URL}/categories`,
  items: categories.map((category) => ({
    name: category.name,
    url: `${getEnv().NEXT_PUBLIC_APP_URL}/categories/${category.slug}`,
  })),
});
```

For `src/app/categories/[slug]/page.tsx`:

```tsx
const schema = buildCollectionWithBreadcrumbSchema({
  name: `${category.name} Tools`,
  description,
  url: canonical,
  breadcrumbs: [
    { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
    { name: "Categories", url: `${env.NEXT_PUBLIC_APP_URL}/categories` },
    { name: category.name, url: canonical },
  ],
  items: category.toolCategories.map((item) => ({
    name: item.tool.name,
    url: `${env.NEXT_PUBLIC_APP_URL}/tools/${item.tool.slug}`,
  })),
});
```

Use the same helper pattern for:
- `src/app/tags/page.tsx`
- `src/app/alternatives/page.tsx`
- `src/app/alternatives/[slug]/page.tsx`
- `src/app/best/tag/[slug]/page.tsx`

For `src/app/launches/[board]/page.tsx`, use `buildCollectionListingSchema` with launch tool entries and skip breadcrumb schema in this first pass.

- [ ] **Step 5: Run helper tests and one representative app test command**

Run: `npm test -- src/server/seo/page-schema.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/server/seo/page-schema.ts src/server/seo/page-schema.test.ts src/app/launches/[board]/page.tsx src/app/categories/page.tsx src/app/categories/[slug]/page.tsx src/app/tags/page.tsx src/app/best/tag/[slug]/page.tsx src/app/alternatives/page.tsx src/app/alternatives/[slug]/page.tsx
git commit -m "feat: add collection page schema to browse routes"
```

---

### Task 4: Add pricing, editorial, FAQ, and trust page schema

**Files:**
- Modify: `src/server/seo/page-schema.ts`
- Modify: `src/server/seo/page-schema.test.ts`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/how-it-works/page.tsx`
- Modify: `src/app/launch-guide/page.tsx`
- Modify: `src/app/faqs/page.tsx`
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/contact/page.tsx`
- Modify: `src/app/affiliate/page.tsx`
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/terms/page.tsx`

- [ ] **Step 1: Add failing tests for the remaining page families**

Update `src/server/seo/page-schema.test.ts`:

```ts
import {
  buildArticlePageSchema,
  buildContactPageSchema,
  buildFaqPageSchema,
  buildPricingPageSchema,
  buildSimpleWebPageSchema,
} from "@/server/seo/page-schema";

it("builds article schema for evergreen content", () => {
  const schemas = buildArticlePageSchema({
    title: "How ShipBoost Works",
    description: "Weekly launches explained",
    url: "https://shipboost.io/how-it-works",
  });

  expect(schemas.map((item) => item["@type"])).toEqual([
    "BreadcrumbList",
    "Article",
  ]);
});

it("builds faq page schema", () => {
  const schemas = buildFaqPageSchema({
    title: "Founder FAQs",
    description: "Answers",
    url: "https://shipboost.io/faqs",
    questions: [
      { question: "Who should submit?", answer: "Bootstrapped SaaS founders." },
    ],
  });

  expect(schemas[1]["@type"]).toBe("FAQPage");
});

it("builds contact page schema with organization context", () => {
  const schemas = buildContactPageSchema({
    title: "Contact ShipBoost",
    description: "Support",
    url: "https://shipboost.io/contact",
  });

  expect(schemas.map((item) => item["@type"])).toContain("ContactPage");
});

it("builds service schema for pricing", () => {
  const schemas = buildPricingPageSchema({
    title: "Pricing",
    description: "Launch pricing",
    url: "https://shipboost.io/pricing",
  });

  expect(schemas[0]["@type"]).toBe("Service");
});

it("builds thin webpage schema for legal pages", () => {
  const schema = buildSimpleWebPageSchema({
    type: "WebPage",
    title: "Terms",
    description: "Platform terms",
    url: "https://shipboost.io/terms",
  });

  expect(schema["@type"]).toBe("WebPage");
});
```

- [ ] **Step 2: Run the tests to confirm failure**

Run: `npm test -- src/server/seo/page-schema.test.ts`
Expected: FAIL because the new helper functions are missing

- [ ] **Step 3: Add the new page helpers**

Update `src/server/seo/page-schema.ts`:

```ts
export function buildArticlePageSchema(input: {
  title: string;
  description: string;
  url: string;
}) {
  return [
    buildBreadcrumbList([
      { name: "Home", url: "https://shipboost.io" },
      { name: input.title, url: input.url },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: input.title,
      description: input.description,
      url: input.url,
    },
  ];
}

export function buildFaqPageSchema(input: {
  title: string;
  description: string;
  url: string;
  questions: { question: string; answer: string }[];
}) {
  return [
    buildBreadcrumbList([
      { name: "Home", url: "https://shipboost.io" },
      { name: input.title, url: input.url },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: input.title,
      description: input.description,
      url: input.url,
      mainEntity: input.questions.map((item) => ({
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

export function buildPricingPageSchema(input: {
  title: string;
  description: string;
  url: string;
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: input.title,
      description: input.description,
      url: input.url,
      provider: buildOrganization(),
    },
  ];
}

export function buildContactPageSchema(input: {
  title: string;
  description: string;
  url: string;
}) {
  return [
    buildOrganization(),
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: input.title,
      description: input.description,
      url: input.url,
    },
  ];
}

export function buildSimpleWebPageSchema(input: {
  type?: "WebPage" | "AboutPage";
  title: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.type ?? "WebPage",
    name: input.title,
    description: input.description,
    url: input.url,
  };
}
```

- [ ] **Step 4: Render the schema into the remaining public pages**

Apply the helper pattern:

```tsx
import { JsonLdScript } from "@/components/seo/json-ld";
import {
  buildArticlePageSchema,
  buildContactPageSchema,
  buildFaqPageSchema,
  buildPricingPageSchema,
  buildSimpleWebPageSchema,
} from "@/server/seo/page-schema";
```

Use:
- `buildPricingPageSchema` in `src/app/pricing/page.tsx`
- `buildArticlePageSchema` in `src/app/how-it-works/page.tsx` and `src/app/launch-guide/page.tsx`
- `buildFaqPageSchema` in `src/app/faqs/page.tsx`
- `buildSimpleWebPageSchema({ type: "AboutPage", ... })` in `src/app/about/page.tsx`
- `buildContactPageSchema` in `src/app/contact/page.tsx`
- `buildSimpleWebPageSchema({ type: "WebPage", ... })` in `src/app/affiliate/page.tsx`, `src/app/privacy/page.tsx`, and `src/app/terms/page.tsx`

For the FAQ page, flatten the grouped questions before passing them into the helper:

```ts
const questions = groups.flatMap((group) =>
  group.items.map((item) => ({
    question: item.question,
    answer: item.answer,
  })),
);
```

- [ ] **Step 5: Run the page-helper tests**

Run: `npm test -- src/server/seo/page-schema.test.ts`
Expected: PASS with the new helper cases green

- [ ] **Step 6: Commit**

```bash
git add src/server/seo/page-schema.ts src/server/seo/page-schema.test.ts src/app/pricing/page.tsx src/app/how-it-works/page.tsx src/app/launch-guide/page.tsx src/app/faqs/page.tsx src/app/about/page.tsx src/app/contact/page.tsx src/app/affiliate/page.tsx src/app/privacy/page.tsx src/app/terms/page.tsx
git commit -m "feat: add schema to content and trust pages"
```

---

### Task 5: Add explicit robots metadata to auth and private pages, then verify end to end

**Files:**
- Modify: `src/app/sign-in/page.tsx`
- Modify: `src/app/sign-up/page.tsx`
- Modify: `src/app/forgot-password/page.tsx`
- Modify: `src/app/reset-password/page.tsx`
- Modify: `src/app/verify-email/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/tools/[toolId]/page.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add explicit metadata exports to auth pages**

Update each auth page with:

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};
```

Apply to:
- `src/app/sign-in/page.tsx`
- `src/app/sign-up/page.tsx`
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/verify-email/page.tsx`

- [ ] **Step 2: Add explicit metadata exports to private pages**

Update the dashboard and admin pages with:

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

Apply to:
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/tools/[toolId]/page.tsx`
- `src/app/admin/page.tsx`

- [ ] **Step 3: Run the unit tests**

Run: `npm test -- src/server/seo/schema-builders.test.ts src/server/seo/page-schema.test.ts`
Expected: PASS

- [ ] **Step 4: Run typecheck and lint**

Run: `npx tsc --noEmit`
Expected: PASS

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Manually inspect representative pages**

Run:

```bash
npm run dev
```

Then verify in the browser or page source for:
- `/`
- `/tools/shipfast`
- `/categories/seo`
- `/best/tag/ai`
- `/alternatives/shipfast`
- `/faqs`
- `/pricing`

Expected:
- each indexed route includes one or more `<script type="application/ld+json">` tags
- auth/private routes show no schema emphasis and remain noindexed in metadata

- [ ] **Step 6: Validate external tooling output**

Run representative URLs through:
- Rich Results Test
- Schema Markup Validator

Expected:
- no syntax errors
- homepage, tool page, and FAQ page parse successfully
- no fake price/review warnings caused by invented fields

- [ ] **Step 7: Commit**

```bash
git add src/app/sign-in/page.tsx src/app/sign-up/page.tsx src/app/forgot-password/page.tsx src/app/reset-password/page.tsx src/app/verify-email/page.tsx src/app/dashboard/page.tsx src/app/dashboard/tools/[toolId]/page.tsx src/app/admin/page.tsx
git commit -m "seo: add robots controls for auth and private pages"
```

---

## Self-Review

### Spec coverage
- Centralized builders are covered in Task 1.
- Route-facing schema helpers are covered in Tasks 2 through 4.
- Browse, tool, pricing, editorial, trust, and legal pages are all covered in Tasks 2 through 4.
- Noindex handling for auth/private routes is covered in Task 5.
- Validation and manual inspection are covered in Task 5.

### Placeholder scan
- No unresolved placeholders or deferred implementation markers remain in the plan.
- Each task contains concrete files, commands, and code blocks.

### Type consistency
- Shared builder names stay consistent across tests and implementation:
  - `buildOrganization`
  - `buildWebSite`
  - `buildItemList`
  - `buildBreadcrumbList`
  - `buildCollectionPage`
  - `buildSoftwareApplication`
  - `buildHomePageSchema`
  - `buildToolPageSchema`
  - `buildCollectionListingSchema`
  - `buildCollectionWithBreadcrumbSchema`
  - `buildArticlePageSchema`
  - `buildFaqPageSchema`
  - `buildPricingPageSchema`
  - `buildContactPageSchema`
  - `buildSimpleWebPageSchema`
