# Deferred Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the remaining inventory-backed deferred pages by adding two `/best/*` pages and two `/alternatives/*` pages on top of existing public marketing inventory.

**Architecture:** Reuse the existing best-page registry, best hub config, and alternatives registry rather than introducing any new content-management path. The batch should only add pages supported by current public inventory, preserve the existing tag-aware buyer-guide matching, and keep the broader `marketing` category coherent through tag-based narrowing.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Vitest, existing ShipBoost SEO/cache services

---

## Notes Before Execution

- This plan intentionally omits git commit steps because the user handles commits manually.
- Only build pages that are supported by current public inventory.
- Do not add `cognito-forms` or `hootsuite` alternatives in this batch.
- The supported pages are:
  - `/best/survey-tool`
  - `/best/social-media-scheduling-tools`
  - `/alternatives/buffer`
  - `/alternatives/later`

## File Structure Map

### Existing files to modify

- Modify: `src/server/seo/best-pages.ts`
- Modify: `src/server/seo/best-pages.test.ts`
- Modify: `src/server/seo/registry.ts`
- Modify only if needed: `src/app/best/page.tsx`
- Reuse without modification unless a blocker appears:
  - `src/app/categories/[slug]/page.tsx`
  - `src/app/tools/[slug]/page.tsx`
  - `src/app/dashboard/tools/[toolId]/preview/page.tsx`

### Existing routes/components expected to pick up changes automatically

- Reuse: `src/app/best/[slug]/page.tsx`
- Reuse: `src/app/alternatives/[slug]/page.tsx`
- Reuse: `src/app/best/page.tsx`
- Reuse: `src/server/services/seo-service.ts`
- Reuse: `src/server/cache/public-content.ts`

---

### Task 1: Verify Deferred-Page Public Inventory

**Files:**
- No code changes expected

- [ ] **Step 1: Verify survey-related public inventory**

Run:

```bash
node scripts/run-with-env.mjs node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); const expected = ["surveymonkey","typeform","jotform","fillout","formstack","tally"]; (async () => { const tools = await prisma.tool.findMany({ where: { slug: { in: expected }, publicationStatus: "PUBLISHED", moderationStatus: "APPROVED" }, select: { slug: true } }); const found = tools.map((tool) => tool.slug).sort(); const missing = expected.filter((slug) => !found.includes(slug)); console.log(JSON.stringify({ found, missing }, null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });'
```

Expected:

- all six slugs are found
- `missing` is an empty array

- [ ] **Step 2: Verify social scheduling public inventory**

Run:

```bash
node scripts/run-with-env.mjs node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); const expected = ["buffer","later","vista-social","sked-social","sociamonials"]; (async () => { const tools = await prisma.tool.findMany({ where: { slug: { in: expected }, publicationStatus: "PUBLISHED", moderationStatus: "APPROVED" }, select: { slug: true } }); const found = tools.map((tool) => tool.slug).sort(); const missing = expected.filter((slug) => !found.includes(slug)); console.log(JSON.stringify({ found, missing }, null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });'
```

Expected:

- all five slugs are found
- `missing` is an empty array

- [ ] **Step 3: Verify the core tags exist**

Run:

```bash
node scripts/run-with-env.mjs node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); const expected = ["survey-tool","feedback-collection","online-forms","social-scheduling","social-publishing","social-media"]; (async () => { const tags = await prisma.tag.findMany({ where: { slug: { in: expected } }, select: { slug: true } }); console.log(JSON.stringify(tags.map((tag) => tag.slug).sort(), null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });'
```

Expected:

- all six tag slugs are present

---

### Task 2: Add the Deferred Best Pages

**Files:**
- Modify: `src/server/seo/best-pages.ts`
- Modify: `src/server/seo/best-pages.test.ts`

- [ ] **Step 1: Add `/best/survey-tool`**

Append a new `bestPagesRegistry` entry using:

- `primaryCategorySlug: "marketing"`
- `supportingTagSlugs: ["survey-tool", "feedback-collection", "online-forms"]`

Required ranked tool set:

1. `surveymonkey`
2. `typeform`
3. `jotform`
4. `fillout`
5. `formstack`
6. `tally`

The page should present survey intent, not generic form-builder intent. It should still include broader form tools when they are credible survey-capable alternatives.

Required internal links:

- `/categories/marketing`
- `/tags/survey-tool`
- `/best/online-form-builder`

- [ ] **Step 2: Add `/best/social-media-scheduling-tools`**

Append a second `bestPagesRegistry` entry using:

- `primaryCategorySlug: "marketing"`
- `supportingTagSlugs: ["social-scheduling", "social-publishing", "social-media"]`

Required ranked tool set:

1. `buffer`
2. `later`
3. `vista-social`
4. `sked-social`
5. `sociamonials`

This page should stay tightly focused on social scheduling and publishing, not social inbox, chat, or messaging tools.

Required internal links:

- `/categories/marketing`
- `/alternatives/buffer`
- `/tags/social-scheduling`

- [ ] **Step 3: Add hub sections for the new best pages**

Extend `bestHubSections` with:

```ts
{
  slug: "surveys",
  title: "Surveys",
  intro:
    "These pages help buyers compare survey-focused tools and broader form platforms when the main job is collecting feedback, research responses, and structured customer input.",
  pageSlugs: ["survey-tool"],
  supportingLinks: [
    {
      href: "/categories/marketing",
      label: "Browse marketing tools",
      description: "Explore the broader marketing category on ShipBoost.",
    },
    {
      href: "/best/online-form-builder",
      label: "Compare form builders",
      description: "See the broader form-builder guide for adjacent workflows.",
    },
  ],
}
```

and:

```ts
{
  slug: "social-scheduling",
  title: "Social Scheduling",
  intro:
    "These pages help buyers compare social media scheduling tools by publishing fit, workflow quality, and the tradeoffs between simple planners and broader scheduling platforms.",
  pageSlugs: ["social-media-scheduling-tools"],
  supportingLinks: [
    {
      href: "/categories/marketing",
      label: "Browse marketing tools",
      description: "Explore the broader marketing category on ShipBoost.",
    },
    {
      href: "/alternatives",
      label: "Compare social alternatives",
      description: "See comparison pages for social scheduling products.",
    },
  ],
}
```

- [ ] **Step 4: Update the best-pages tests**

Add tests that confirm:

- `bestPagesRegistry["survey-tool"]` exists
- `bestPagesRegistry["social-media-scheduling-tools"]` exists
- the two new hub sections exist
- tag-aware guide matching continues to work for:
  - survey tags
  - social scheduling tags
  - unrelated marketing tags should not match those pages

Suggested test coverage:

```ts
const surveyGuides = getBestGuideEntriesForTool({
  primaryCategorySlug: "marketing",
  toolTagSlugs: ["survey-tool"],
});
expect(surveyGuides.map((page) => page.slug)).toContain("survey-tool");

const socialGuides = getBestGuideEntriesForTool({
  primaryCategorySlug: "marketing",
  toolTagSlugs: ["social-scheduling"],
});
expect(socialGuides.map((page) => page.slug)).toContain(
  "social-media-scheduling-tools",
);
```

---

### Task 3: Add the Deferred Alternatives Pages

**Files:**
- Modify: `src/server/seo/registry.ts`

- [ ] **Step 1: Add `/alternatives/buffer`**

Add:

```ts
{
  slug: "buffer",
  anchorToolSlug: "buffer",
  title: "Best Buffer Alternatives",
  intro: "Compare the best Buffer alternatives for teams evaluating social media scheduling and publishing tools with different tradeoffs in workflow, content planning, and channel management.",
  metaTitle: "Best Buffer Alternatives for Social Scheduling | ShipBoost",
  metaDescription: "Compare Buffer alternatives like Later, Vista Social, Sked Social, and Sociamonials for buyers evaluating social media scheduling tools.",
  toolSlugs: ["later", "vista-social", "sked-social", "sociamonials"],
}
```

- [ ] **Step 2: Add `/alternatives/later`**

Add:

```ts
{
  slug: "later",
  anchorToolSlug: "later",
  title: "Best Later Alternatives",
  intro: "Compare the best Later alternatives for teams evaluating social media scheduling and publishing tools with different tradeoffs in planning workflows, visual scheduling, and operational fit.",
  metaTitle: "Best Later Alternatives for Social Scheduling | ShipBoost",
  metaDescription: "Compare Later alternatives like Buffer, Vista Social, Sked Social, and Sociamonials for buyers evaluating social scheduling software.",
  toolSlugs: ["buffer", "vista-social", "sked-social", "sociamonials"],
}
```

---

### Task 4: Verify Hub Copy and Internal Linking Behavior

**Files:**
- Modify only if needed: `src/app/best/page.tsx`
- Reuse: `src/app/categories/[slug]/page.tsx`
- Reuse: `src/app/tools/[slug]/page.tsx`
- Reuse: `src/app/dashboard/tools/[toolId]/preview/page.tsx`

- [ ] **Step 1: Check whether `/best` copy already accommodates the deferred pages**

Review `src/app/best/page.tsx`.

If the current copy is still missing survey or social scheduling language and now reads too narrowly, broaden it. If it already reads broadly enough, do not edit it.

- [ ] **Step 2: Verify `/categories/marketing` will surface the new best pages automatically**

Review `src/app/categories/[slug]/page.tsx`.

Expected behavior:

- `bestPageLinks` filters by `primaryCategorySlug === category.slug`
- `/categories/marketing` should therefore automatically surface:
  - `/best/survey-tool`
  - `/best/social-media-scheduling-tools`

If that logic is still intact, do not modify the file.

- [ ] **Step 3: Verify tool pages still use tag-aware best-guide matching**

Review:

- `src/app/tools/[slug]/page.tsx`
- `src/app/dashboard/tools/[toolId]/preview/page.tsx`

Expected behavior:

- survey tools with `survey-tool` or related tags can surface `/best/survey-tool`
- social scheduling tools with `social-scheduling` or `social-publishing` tags can surface `/best/social-media-scheduling-tools`
- unrelated marketing tools should not surface the wrong deferred pages

If the tag-aware matcher is still used, do not modify these files.

---

### Task 5: Final Verification

**Files:**
- No additional code changes expected

- [ ] **Step 1: Run the best-pages test file**

Run:

```bash
npm test -- src/server/seo/best-pages.test.ts
```

Expected:

- all tests pass

- [ ] **Step 2: Run TypeScript verification**

Run:

```bash
npx tsc --noEmit
```

Expected:

- exit code 0

- [ ] **Step 3: Run a production build**

Run:

```bash
npm run build
```

Expected route output should include:

- `/best/survey-tool`
- `/best/social-media-scheduling-tools`
- `/alternatives/buffer`
- `/alternatives/later`

- [ ] **Step 4: Recheck the deferred-page tool dependencies**

Run:

```bash
node scripts/run-with-env.mjs node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); const expected = ["surveymonkey","typeform","jotform","fillout","formstack","tally","buffer","later","vista-social","sked-social","sociamonials"]; (async () => { const tools = await prisma.tool.findMany({ where: { slug: { in: expected }, publicationStatus: "PUBLISHED", moderationStatus: "APPROVED" }, select: { slug: true } }); const found = tools.map((tool) => tool.slug).sort(); const missing = expected.filter((slug) => !found.includes(slug)); console.log(JSON.stringify({ found, missing }, null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });'
```

Expected:

- `missing` is an empty array
