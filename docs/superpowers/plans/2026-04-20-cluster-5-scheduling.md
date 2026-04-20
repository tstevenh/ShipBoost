# Cluster 5 Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first scheduling buyer-intent slice by adding two canonical `/best/*` pages and two `/alternatives/*` pages on top of the existing imported scheduling inventory.

**Architecture:** Reuse the existing best-page registry, best hub config, and alternatives registry rather than introducing any new content-management path. The batch should only add scheduling registry entries, preserve the existing tag-aware buyer-guide matching, and rely on the current `sales` category and imported scheduling tags to keep the cluster coherent.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Vitest, existing ShipBoost SEO/cache services

---

## Notes Before Execution

- This plan intentionally omits git commit steps because the user handles commits manually.
- Do not add any social scheduling pages in this batch.
- Do not introduce any new categories. Cluster 5 first slice stays under `sales`.
- Reuse the already public scheduling anchors:
  - `calendly`
  - `acuity-scheduling`
  - `tidycal`
  - `savvycal`
  - `cal-com`

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

### Task 1: Verify Scheduling Public Inventory

**Files:**
- No code changes expected

- [ ] **Step 1: Verify the five scheduling anchors are public**

Run:

```bash
node scripts/run-with-env.mjs node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); const expected = ["calendly","acuity-scheduling","tidycal","savvycal","cal-com"]; (async () => { const tools = await prisma.tool.findMany({ where: { slug: { in: expected }, publicationStatus: "PUBLISHED", moderationStatus: "APPROVED" }, select: { slug: true } }); const found = tools.map((tool) => tool.slug).sort(); const missing = expected.filter((slug) => !found.includes(slug)); console.log(JSON.stringify({ found, missing }, null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });'
```

Expected:

```json
{
  "found": [
    "acuity-scheduling",
    "cal-com",
    "calendly",
    "savvycal",
    "tidycal"
  ],
  "missing": []
}
```

- [ ] **Step 2: Verify core scheduling tags exist**

Run:

```bash
node scripts/run-with-env.mjs node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); const expected = ["scheduling","appointment-booking","meeting-scheduling","calendar-tools","booking-software"]; (async () => { const tags = await prisma.tag.findMany({ where: { slug: { in: expected } }, select: { slug: true } }); console.log(JSON.stringify(tags.map((tag) => tag.slug).sort(), null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });'
```

Expected:

- the five tag slugs are present

---

### Task 2: Add the Scheduling Best Pages

**Files:**
- Modify: `src/server/seo/best-pages.ts`
- Modify: `src/server/seo/best-pages.test.ts`

- [ ] **Step 1: Add a scheduling tool constant block in `best-pages.ts`**

Add a new constant block near the existing support, CRM, Email Marketing, and Forms tool maps.

```ts
const SCHEDULING_TOOLS = {
  calendly: "calendly",
  acuity: "acuity-scheduling",
  tidycal: "tidycal",
  savvycal: "savvycal",
  calCom: "cal-com",
} as const;
```

- [ ] **Step 2: Add `/best/scheduling-app-for-small-business`**

Append a new `bestPagesRegistry` entry using the existing page shape.

Required ranked order:

1. `calendly`
2. `savvycal`
3. `tidycal`
4. `acuity-scheduling`
5. `cal-com`

Required supporting tags:

```ts
["scheduling", "appointment-booking", "meeting-scheduling"]
```

Required primary category:

```ts
"sales"
```

The entry should emphasize:

- simplicity
- booking flow quality
- fast adoption for small businesses

The entry should include:

- keyword: `best scheduling app for small business`
- title/meta title/meta description
- intro
- who-it-is-for copy
- evaluation criteria
- comparison table
- ranked tools
- FAQ
- internal links to `/categories/sales`, `/alternatives/calendly`, and `/tags/scheduling`

- [ ] **Step 3: Add `/best/scheduling-software-for-small-business`**

Append a second `bestPagesRegistry` entry using the same ranked tools but a slightly broader platform angle.

The entry should emphasize:

- workflow flexibility
- integrations
- longer-term operational fit

Required supporting tags:

```ts
["scheduling", "calendar-tools", "booking-software"]
```

Required primary category:

```ts
"sales"
```

The entry should include:

- keyword: `best scheduling software for small business`
- title/meta title/meta description
- intro
- who-it-is-for copy
- evaluation criteria
- comparison table
- ranked tools
- FAQ
- internal links to `/categories/sales`, `/alternatives/acuity-scheduling`, and `/tags/scheduling`

- [ ] **Step 4: Add a Scheduling hub section to `bestHubSections`**

Add:

```ts
{
  slug: "scheduling",
  title: "Scheduling",
  intro:
    "These pages help small-business buyers compare scheduling tools by booking flow quality, day-to-day usability, and the tradeoffs between simple scheduling apps and broader scheduling software.",
  pageSlugs: [
    "scheduling-app-for-small-business",
    "scheduling-software-for-small-business",
  ],
  supportingLinks: [
    {
      href: "/categories/sales",
      label: "Browse sales tools",
      description: "Explore the broader sales category on ShipBoost.",
    },
    {
      href: "/alternatives",
      label: "Compare scheduling alternatives",
      description: "See comparison pages for major scheduling products.",
    },
  ],
}
```

- [ ] **Step 5: Update the best-pages tests**

Add tests that confirm:

- both scheduling best pages exist
- `bestHubSections` includes the `scheduling` section
- the existing tag-aware guide matcher works for scheduling tags and does not match CRM-only tags

Suggested test case:

```ts
const schedulingGuides = getBestGuideEntriesForTool({
  primaryCategorySlug: "sales",
  toolTagSlugs: ["scheduling", "meeting-scheduling"],
});

expect(schedulingGuides.map((page) => page.slug)).toContain(
  "scheduling-app-for-small-business",
);
```

---

### Task 3: Add the Scheduling Alternatives Pages

**Files:**
- Modify: `src/server/seo/registry.ts`

- [ ] **Step 1: Add `/alternatives/calendly`**

Add:

```ts
{
  slug: "calendly",
  anchorToolSlug: "calendly",
  title: "Best Calendly Alternatives",
  intro: "Compare the best Calendly alternatives for small businesses evaluating scheduling apps with different tradeoffs in booking flow, pricing, and scheduling flexibility.",
  metaTitle: "Best Calendly Alternatives for Scheduling | ShipBoost",
  metaDescription: "Compare Calendly alternatives like SavvyCal, TidyCal, Acuity Scheduling, and Cal.com for buyers evaluating scheduling software for small business.",
  toolSlugs: ["savvycal", "tidycal", "acuity-scheduling", "cal-com"],
}
```

- [ ] **Step 2: Add `/alternatives/acuity-scheduling`**

Add:

```ts
{
  slug: "acuity-scheduling",
  anchorToolSlug: "acuity-scheduling",
  title: "Best Acuity Scheduling Alternatives",
  intro: "Compare the best Acuity Scheduling alternatives for businesses evaluating appointment booking and scheduling tools with different tradeoffs in simplicity, flexibility, and booking flow quality.",
  metaTitle: "Best Acuity Scheduling Alternatives for Appointment Booking | ShipBoost",
  metaDescription: "Compare Acuity Scheduling alternatives like Calendly, SavvyCal, TidyCal, and Cal.com for teams evaluating small-business scheduling software.",
  toolSlugs: ["calendly", "savvycal", "tidycal", "cal-com"],
}
```

---

### Task 4: Verify Hub Copy and Internal Linking Behavior

**Files:**
- Modify only if needed: `src/app/best/page.tsx`
- Reuse: `src/app/categories/[slug]/page.tsx`
- Reuse: `src/app/tools/[slug]/page.tsx`
- Reuse: `src/app/dashboard/tools/[toolId]/preview/page.tsx`

- [ ] **Step 1: Check whether `/best` copy already accommodates scheduling**

Review `src/app/best/page.tsx`.

If the top-level copy still only mentions support, CRM, email marketing, and forms, broaden it so the page comfortably covers scheduling too.

Target copy direction:

```ts
"Browse grouped buying guides built for specific comparison jobs, not just broad directories. These pages are where ShipBoost narrows categories like support, CRM, email marketing, forms, and scheduling into real software decisions."
```

If the current copy already reads broadly enough, do not edit it.

- [ ] **Step 2: Verify `/categories/sales` will pick up the new scheduling pages automatically**

Review `src/app/categories/[slug]/page.tsx`.

Expected behavior:

- `bestPageLinks` filters by `primaryCategorySlug === category.slug`
- `/categories/sales` should therefore automatically surface the two new scheduling best pages alongside the CRM pages

If that logic is still intact, do not modify the file.

- [ ] **Step 3: Verify tool pages still use tag-aware best-guide matching**

Review:

- `src/app/tools/[slug]/page.tsx`
- `src/app/dashboard/tools/[toolId]/preview/page.tsx`

Expected behavior:

- best-guide links still come from `getBestGuideEntriesForTool`
- scheduling tools with scheduling tags can surface scheduling pages
- CRM tools without scheduling tags should not surface them

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

- `/best/scheduling-app-for-small-business`
- `/best/scheduling-software-for-small-business`
- `/alternatives/calendly`
- `/alternatives/acuity-scheduling`

- [ ] **Step 4: Recheck scheduling tool dependencies**

Run:

```bash
node scripts/run-with-env.mjs node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); const expected = ["calendly","acuity-scheduling","tidycal","savvycal","cal-com"]; (async () => { const tools = await prisma.tool.findMany({ where: { slug: { in: expected }, publicationStatus: "PUBLISHED", moderationStatus: "APPROVED" }, select: { slug: true } }); const found = tools.map((tool) => tool.slug).sort(); const missing = expected.filter((slug) => !found.includes(slug)); console.log(JSON.stringify({ found, missing }, null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });'
```

Expected:

- `missing` is an empty array
