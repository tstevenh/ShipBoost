# Cluster 4 Forms and Surveys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first Forms and Surveys buyer-intent slice by adding one canonical `/best/*` page and four `/alternatives/*` pages on top of the existing imported Cluster 4 inventory.

**Architecture:** Reuse the existing best-page registry, best hub config, and alternatives registry rather than introducing any new content-management path. The batch should only add Cluster 4 registry entries, preserve the existing tag-aware buyer-guide matching, and rely on the current `marketing` category and imported form-builder tags to keep the cluster coherent.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Vitest, existing ShipBoost SEO/cache services

---

## Notes Before Execution

- This plan intentionally omits git commit steps because the user handles commits manually.
- Do not add `/best/survey-tool` in this batch.
- Do not introduce any new categories. Cluster 4 stays under `marketing`.
- Reuse the already public anchors from the cluster 3 to 5 CSV import:
  - `typeform`
  - `jotform`
  - `surveymonkey`
  - `formstack`
  - `tally`
  - `fillout`
  - `paperform`

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

### Task 1: Verify Cluster 4 Public Inventory

**Files:**
- No code changes expected

- [ ] **Step 1: Verify the seven Cluster 4 anchors are public**

Run:

```bash
node scripts/run-with-env.mjs node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); const expected = ["typeform","jotform","surveymonkey","formstack","tally","fillout","paperform"]; (async () => { const tools = await prisma.tool.findMany({ where: { slug: { in: expected }, publicationStatus: "PUBLISHED", moderationStatus: "APPROVED" }, select: { slug: true } }); const found = tools.map((tool) => tool.slug).sort(); const missing = expected.filter((slug) => !found.includes(slug)); console.log(JSON.stringify({ found, missing }, null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });'
```

Expected:

```json
{
  "found": [
    "fillout",
    "formstack",
    "jotform",
    "paperform",
    "surveymonkey",
    "tally",
    "typeform"
  ],
  "missing": []
}
```

- [ ] **Step 2: Verify core Cluster 4 tags exist**

Run:

```bash
node scripts/run-with-env.mjs node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); const expected = ["form-builder","online-forms","survey-tool","no-code-forms","feedback-collection"]; (async () => { const tags = await prisma.tag.findMany({ where: { slug: { in: expected } }, select: { slug: true } }); console.log(JSON.stringify(tags.map((tag) => tag.slug).sort(), null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });'
```

Expected:

- the five tag slugs are present

---

### Task 2: Add the Cluster 4 Best Page

**Files:**
- Modify: `src/server/seo/best-pages.ts`
- Modify: `src/server/seo/best-pages.test.ts`

- [ ] **Step 1: Add a forms tool constant block in `best-pages.ts`**

Add a new constant block near the existing support, CRM, and Email Marketing tool maps.

```ts
const FORM_TOOLS = {
  typeform: "typeform",
  jotform: "jotform",
  surveymonkey: "surveymonkey",
  formstack: "formstack",
  tally: "tally",
  fillout: "fillout",
  paperform: "paperform",
} as const;
```

- [ ] **Step 2: Add `/best/online-form-builder` to `bestPagesRegistry`**

Append a new `bestPagesRegistry` entry using the existing page shape and the agreed ranking order.

Required ranked order:

1. `typeform`
2. `jotform`
3. `fillout`
4. `tally`
5. `paperform`
6. `surveymonkey`
7. `formstack`

Required supporting tags:

```ts
["form-builder", "online-forms", "survey-tool"]
```

Required primary category:

```ts
"marketing"
```

The entry should include:

- keyword: `best online form builder`
- title/meta title/meta description
- intro
- who-it-is-for copy
- evaluation criteria
- comparison table
- ranked tools
- FAQ
- internal links to `/categories/marketing`, `/alternatives/typeform`, and `/tags/form-builder`

- [ ] **Step 3: Add a Cluster 4 hub section to `bestHubSections`**

Add a new section:

```ts
{
  slug: "forms-surveys",
  title: "Forms and Surveys",
  intro:
    "These pages help buyers compare online form builders and survey tools by real job-to-be-done fit, from conversational forms to workflow-heavy business form systems.",
  pageSlugs: ["online-form-builder"],
  supportingLinks: [
    {
      href: "/categories/marketing",
      label: "Browse marketing tools",
      description: "Explore the broader marketing category on ShipBoost.",
    },
    {
      href: "/alternatives",
      label: "Compare form alternatives",
      description: "See comparison pages for major form and survey products.",
    },
  ],
}
```

- [ ] **Step 4: Update the best-pages tests**

Add tests that confirm:

- `bestPagesRegistry["online-form-builder"]` exists
- `bestHubSections` includes the `forms-surveys` section
- the existing tag-aware guide matcher works for form tags and does not match unrelated marketing tags

Suggested test case:

```ts
const formGuides = getBestGuideEntriesForTool({
  primaryCategorySlug: "marketing",
  toolTagSlugs: ["form-builder", "online-forms"],
});

expect(formGuides.map((page) => page.slug)).toContain("online-form-builder");
```

---

### Task 3: Add the Cluster 4 Alternatives Pages

**Files:**
- Modify: `src/server/seo/registry.ts`

- [ ] **Step 1: Add `/alternatives/typeform`**

Add a new alternatives registry entry using:

```ts
{
  slug: "typeform",
  anchorToolSlug: "typeform",
  title: "Best Typeform Alternatives",
  intro: "Compare the best Typeform alternatives for teams evaluating online form builders with different tradeoffs in form design, workflow depth, and business fit.",
  metaTitle: "Best Typeform Alternatives for Online Forms | ShipBoost",
  metaDescription: "Compare Typeform alternatives like Jotform, Fillout, Tally, and Paperform for buyers evaluating modern online form builders.",
  toolSlugs: ["jotform", "fillout", "tally", "paperform", "surveymonkey", "formstack"],
}
```

- [ ] **Step 2: Add `/alternatives/jotform`**

Add:

```ts
{
  slug: "jotform",
  anchorToolSlug: "jotform",
  title: "Best Jotform Alternatives",
  intro: "Compare the best Jotform alternatives for teams evaluating general-purpose online forms, workflow-driven forms, and modern no-code form builders.",
  metaTitle: "Best Jotform Alternatives for Online Forms | ShipBoost",
  metaDescription: "Compare Jotform alternatives like Typeform, Fillout, Tally, and Formstack for teams evaluating online form builders with different workflow and UX tradeoffs.",
  toolSlugs: ["typeform", "fillout", "tally", "paperform", "formstack", "surveymonkey"],
}
```

- [ ] **Step 3: Add `/alternatives/surveymonkey`**

Add:

```ts
{
  slug: "surveymonkey",
  anchorToolSlug: "surveymonkey",
  title: "Best SurveyMonkey Alternatives",
  intro: "Compare the best SurveyMonkey alternatives for teams evaluating survey software, customer feedback tools, and broader online form builders.",
  metaTitle: "Best SurveyMonkey Alternatives for Surveys and Feedback | ShipBoost",
  metaDescription: "Compare SurveyMonkey alternatives like Typeform, Jotform, Formstack, and Fillout for teams evaluating surveys, forms, and research workflows.",
  toolSlugs: ["typeform", "jotform", "formstack", "fillout", "tally", "paperform"],
}
```

- [ ] **Step 4: Add `/alternatives/formstack`**

Add:

```ts
{
  slug: "formstack",
  anchorToolSlug: "formstack",
  title: "Best Formstack Alternatives",
  intro: "Compare the best Formstack alternatives for teams that want online forms, approvals, and workflow-heavy form systems with different usability and flexibility tradeoffs.",
  metaTitle: "Best Formstack Alternatives for Workflow Forms | ShipBoost",
  metaDescription: "Compare Formstack alternatives like Jotform, Typeform, Fillout, and Paperform for teams evaluating workflow-oriented online forms and business form systems.",
  toolSlugs: ["jotform", "typeform", "fillout", "paperform", "surveymonkey", "tally"],
}
```

---

### Task 4: Verify Hub Copy and Internal Linking Behavior

**Files:**
- Modify only if needed: `src/app/best/page.tsx`
- Reuse: `src/app/categories/[slug]/page.tsx`
- Reuse: `src/app/tools/[slug]/page.tsx`
- Reuse: `src/app/dashboard/tools/[toolId]/preview/page.tsx`

- [ ] **Step 1: Check whether `/best` copy already accommodates the new cluster**

Review `src/app/best/page.tsx`.

If the current copy still only names support, CRM, and Email Marketing, update it so the top-level hub language comfortably covers Forms and Surveys too.

The target copy direction is:

```ts
"Browse grouped buying guides built for specific comparison jobs, not just broad directories. These pages are where ShipBoost narrows categories like support, CRM, email marketing, and forms into real software decisions."
```

If the file already reads this broadly enough, do not edit it.

- [ ] **Step 2: Verify marketing category pages pick up the new best page automatically**

Review `src/app/categories/[slug]/page.tsx`.

Expected behavior:

- `bestPageLinks` filters by `primaryCategorySlug === category.slug`
- `/categories/marketing` should therefore automatically surface `/best/online-form-builder`

If that logic is still intact, do not modify the file.

- [ ] **Step 3: Verify tool pages still use tag-aware best-guide matching**

Review:

- `src/app/tools/[slug]/page.tsx`
- `src/app/dashboard/tools/[toolId]/preview/page.tsx`

Expected behavior:

- best-guide links come from `getBestGuideEntriesForTool`
- forms tools with `form-builder` or `online-forms` tags can surface `/best/online-form-builder`
- unrelated marketing tools with only email or social tags should not surface it

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

- `/best/online-form-builder`
- `/alternatives/typeform`
- `/alternatives/jotform`
- `/alternatives/surveymonkey`
- `/alternatives/formstack`

- [ ] **Step 4: Recheck Cluster 4 tool dependencies for the best page**

Run:

```bash
node scripts/run-with-env.mjs node -e 'const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); const expected = ["typeform","jotform","surveymonkey","formstack","tally","fillout","paperform"]; (async () => { const tools = await prisma.tool.findMany({ where: { slug: { in: expected }, publicationStatus: "PUBLISHED", moderationStatus: "APPROVED" }, select: { slug: true } }); const found = tools.map((tool) => tool.slug).sort(); const missing = expected.filter((slug) => !found.includes(slug)); console.log(JSON.stringify({ found, missing }, null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });'
```

Expected:

- `missing` is an empty array
