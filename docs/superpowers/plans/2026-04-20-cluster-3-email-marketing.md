# Cluster 3 Email Marketing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import and publish the cluster 3 to 5 anchor inventory, then ship the first Email Marketing buyer-intent page set on top of the existing `/best` and `/alternatives` architecture.

**Architecture:** Reuse the existing seeded-tool importer, best-page registry, and alternatives registry instead of adding any new content-management layer. The batch should run inventory first, then add the first Email Marketing `/best/*` and `/alternatives/*` pages, and finally tighten marketing-cluster internal linking using the category/tool patterns already established for support and CRM.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Node.js import script, Vitest, existing ShipBoost SEO/cache services

---

## Notes Before Execution

- This plan intentionally omits git commit steps because the user handles commits manually.
- Keep `convertkit` as the alternatives slug even though page copy can mention the current Kit branding.
- Do not build cluster 4 or 5 landing pages in this batch. Only import their tools.
- Use the existing importer at `scripts/import-seeded-tools.mjs`; do not fork a new import path unless a blocker appears.

## File Structure Map

### Existing files to modify

- Modify: `scripts/import-seeded-tools.mjs`
- Modify: `src/server/seo/best-pages.ts`
- Modify: `src/server/seo/best-pages.test.ts`
- Modify: `src/server/seo/registry.ts`
- Modify: `src/app/categories/[slug]/page.tsx`
- Modify: `src/components/ui/flickering-footer.tsx` only if Email Marketing links need surfacing after rollout

### Existing routes/components expected to pick up changes automatically

- Reuse: `src/app/best/[slug]/page.tsx`
- Reuse: `src/app/alternatives/[slug]/page.tsx`
- Reuse: `src/app/best/page.tsx`
- Reuse: `src/app/tools/[slug]/page.tsx`
- Reuse: `src/components/public/tool-page-content.tsx`
- Reuse: `src/server/services/seo-service.ts`
- Reuse: `src/server/cache/public-content.ts`

### Data source

- Import from: `/Users/tsth/Coding/shipboost/ShipBoost-Docs/SEO-Plan/cluster-3-5-anchor-tools-master.csv`

---

### Task 1: Import and Publish Cluster 3 to 5 Anchor Tools

**Files:**
- Modify if needed: `scripts/import-seeded-tools.mjs`
- Data source: `/Users/tsth/Coding/shipboost/ShipBoost-Docs/SEO-Plan/cluster-3-5-anchor-tools-master.csv`

- [ ] **Step 1: Verify the importer already supports the cluster CSV format**

Check that `scripts/import-seeded-tools.mjs` still supports:

- `category`
- `tag_1` through `tag_5`
- `pricing_model`
- favicon fallback when `logo_url` is missing

The expected existing code path is:

```js
const normalizedCategoriesValue =
  row.categories !== undefined
    ? row.categories
    : row.category !== undefined
      ? row.category
      : undefined;

const tagColumnValues = parseTagColumnValues(rawRow, headerMap);
```

If those paths still exist and the cluster 3 to 5 CSV matches them, do not modify the importer.

- [ ] **Step 2: Run the import for the cluster 3 to 5 CSV**

Run:

```bash
node scripts/import-seeded-tools.mjs /Users/tsth/Coding/shipboost/ShipBoost-Docs/SEO-Plan/cluster-3-5-anchor-tools-master.csv
```

Expected:

- rows are created or updated successfully
- tags from the CSV are created/associated
- missing logos are backfilled using `https://favicon.im/<hostname>` when needed

- [ ] **Step 3: Verify the expected Email Marketing anchors are now public**

Run:

```bash
node scripts/run-with-env.mjs node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); const now = new Date(); const publicWhere = { publicationStatus: 'PUBLISHED', moderationStatus: 'APPROVED', OR: [{ launches: { none: {} } }, { launches: { some: { OR: [{ status: { in: ['LIVE','ENDED'] } }, { status: 'APPROVED', launchDate: { lte: now } }] } } }] }; const expected = ['mailchimp','convertkit','activecampaign','mailerlite','brevo','klaviyo','beehiiv','campaign-monitor','constant-contact','getresponse']; (async () => { const tools = await prisma.tool.findMany({ where: { ...publicWhere, slug: { in: expected } }, select: { slug: true } }); console.log(JSON.stringify(tools.map((tool) => tool.slug).sort(), null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });"
```

Expected output should include at least:

```json
[
  "activecampaign",
  "beehiiv",
  "brevo",
  "campaign-monitor",
  "constant-contact",
  "convertkit",
  "getresponse",
  "klaviyo",
  "mailchimp",
  "mailerlite"
]
```

- [ ] **Step 4: Verify Email Marketing tags exist after import**

Run:

```bash
node scripts/run-with-env.mjs node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); const expected = ['email-marketing','newsletter','email-automation','email-campaigns','creator-email','ecommerce-email','marketing-automation']; (async () => { const tags = await prisma.tag.findMany({ where: { slug: { in: expected } }, select: { slug: true } }); console.log(JSON.stringify(tags.map((tag) => tag.slug).sort(), null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });"
```

Expected:

- the expected tag slugs are present

---

### Task 2: Add the First Email Marketing Best Pages

**Files:**
- Modify: `src/server/seo/best-pages.ts`
- Modify: `src/server/seo/best-pages.test.ts`

- [ ] **Step 1: Add Email Marketing tool constants in `best-pages.ts`**

Define a new constant block near the existing support and CRM tool maps.

```ts
const EMAIL_TOOLS = {
  mailchimp: "mailchimp",
  convertkit: "convertkit",
  activecampaign: "activecampaign",
  mailerlite: "mailerlite",
  brevo: "brevo",
  klaviyo: "klaviyo",
  beehiiv: "beehiiv",
  campaignMonitor: "campaign-monitor",
  constantContact: "constant-contact",
  getresponse: "getresponse",
} as const;
```

- [ ] **Step 2: Add `/best/email-marketing-for-small-business`**

Append a new `bestPagesRegistry` entry using the existing support/CRM content shape.

```ts
"email-marketing-for-small-business": {
  slug: "email-marketing-for-small-business",
  targetKeyword: "best email marketing for small business",
  title: "Best Email Marketing for Small Business",
  metaTitle: "Best Email Marketing for Small Business | ShipBoost",
  metaDescription:
    "Compare the best email marketing tools for small businesses, with clear verdicts, practical tradeoffs, and buyer-focused recommendations across leading email platforms.",
  intro:
    "The best email marketing tool for a small business depends on whether you value simplicity, automation, ecommerce fit, or creator-style audience growth. The right choice is the one that helps you send consistently without adding unnecessary complexity.",
  whoItsFor:
    "This page is for small business owners, marketers, and founders choosing an email platform for campaigns, automations, newsletters, and audience growth.",
  howWeEvaluated: [
    "Ease of use for lean teams",
    "Email campaign and newsletter workflow quality",
    "Automation depth and segmentation",
    "Pricing fit for small businesses",
    "Overall buyer fit for small-business marketing needs",
  ],
  comparisonTable: [
    {
      label: "Best for",
      valuesByToolSlug: {
        [EMAIL_TOOLS.mailchimp]: "Broad SMB email marketing",
        [EMAIL_TOOLS.mailerlite]: "Simple and affordable campaigns",
        [EMAIL_TOOLS.brevo]: "Multichannel communication",
        [EMAIL_TOOLS.convertkit]: "Creator-led email growth",
      },
    },
  ],
  rankedTools: [
    {
      toolSlug: EMAIL_TOOLS.mailchimp,
      rank: 1,
      verdict: "Mailchimp remains the default benchmark for many small businesses because it balances broad functionality, brand familiarity, and practical campaign management.",
      bestFor: "Small businesses that want a familiar all-round email platform with strong baseline capabilities.",
      notIdealFor: "Buyers that want deeper automation specialization or a more creator-focused workflow.",
      criteriaHighlights: ["Brand familiarity", "SMB fit", "Broad feature set"],
    },
    {
      toolSlug: EMAIL_TOOLS.mailerlite,
      rank: 2,
      verdict: "MailerLite is one of the strongest picks for small businesses that want a lighter, more affordable email tool without losing core automation and landing-page support.",
      bestFor: "Small teams that want practical email marketing with lower cost and less complexity.",
      notIdealFor: "Buyers that need the broadest ecosystem or advanced ecommerce depth.",
      criteriaHighlights: ["Simplicity", "Affordability", "Practicality"],
    },
    {
      toolSlug: EMAIL_TOOLS.brevo,
      rank: 3,
      verdict: "Brevo makes sense for businesses that want email plus broader communication options like SMS and transactional messaging in one stack.",
      bestFor: "Small businesses that want multichannel communication alongside email marketing.",
      notIdealFor: "Buyers who only want a pure email-first platform with simpler scope.",
      criteriaHighlights: ["Multichannel", "Automation", "Broader communications"],
    },
    {
      toolSlug: EMAIL_TOOLS.convertkit,
      rank: 4,
      verdict: "ConvertKit, now Kit, is strongest when the business thinks in audiences, newsletters, and creator-style email growth rather than traditional SMB campaigns alone.",
      bestFor: "Audience-first businesses, creators, and newsletter-led small brands.",
      notIdealFor: "Small businesses that want broader SMB marketing defaults over creator workflows.",
      criteriaHighlights: ["Creator fit", "Newsletter workflows", "Audience growth"],
    },
    {
      toolSlug: EMAIL_TOOLS.activecampaign,
      rank: 5,
      verdict: "ActiveCampaign is a better fit when small businesses want stronger automation and lifecycle marketing rather than the simplest sending workflow.",
      bestFor: "Small businesses that care about automation depth and customer journeys.",
      notIdealFor: "Teams that want the lightest setup and simplest day-to-day execution.",
      criteriaHighlights: ["Automation", "Segmentation", "Lifecycle marketing"],
    },
    {
      toolSlug: EMAIL_TOOLS.klaviyo,
      rank: 6,
      verdict: "Klaviyo is especially compelling for ecommerce brands, but it is more specialized than some general SMB email tools.",
      bestFor: "Ecommerce businesses that want stronger retention marketing and customer-data-driven campaigns.",
      notIdealFor: "Non-ecommerce businesses that do not need commerce-native depth.",
      criteriaHighlights: ["Ecommerce fit", "Segmentation", "Retention marketing"],
    },
    {
      toolSlug: EMAIL_TOOLS.beehiiv,
      rank: 7,
      verdict: "Beehiiv is compelling when newsletter growth and publication-style email is the central job, not general-purpose SMB email marketing.",
      bestFor: "Newsletter-first businesses and creators growing a media-style email audience.",
      notIdealFor: "Traditional small businesses that want a broader business email platform.",
      criteriaHighlights: ["Newsletter growth", "Creator fit", "Audience-first"],
    },
    {
      toolSlug: EMAIL_TOOLS.getresponse,
      rank: 8,
      verdict: "GetResponse stays relevant for buyers who want a broader marketing stack that still centers email campaigns and automation.",
      bestFor: "Small businesses that want a broader campaign platform beyond basic newsletters.",
      notIdealFor: "Buyers that want the cleanest modern UX or a narrower focused tool.",
      criteriaHighlights: ["Breadth", "Campaigns", "Automation"],
    },
  ],
  faq: [
    {
      question: "What is the best email marketing tool for a small business?",
      answer: "For many small businesses, Mailchimp, MailerLite, and Brevo are strong starting points because they balance usability, pricing, and practical campaign tools.",
    },
    {
      question: "Should a small business pick a simple email tool or an automation-heavy platform?",
      answer: "Choose the lightest tool that still supports your real sending and follow-up workflow. Too little automation creates manual work, but too much complexity can slow adoption for a small team.",
    },
  ],
  internalLinks: [
    {
      href: "/categories/marketing",
      label: "Browse marketing tools",
      description: "Explore the broader marketing category on ShipBoost.",
    },
    {
      href: "/alternatives/mailchimp",
      label: "Compare Mailchimp alternatives",
      description: "See which tools buyers compare most often with Mailchimp.",
    },
    {
      href: "/tags/email-marketing",
      label: "More email marketing tools",
      description: "Browse tools grouped by Email Marketing intent.",
    },
  ],
  primaryCategorySlug: "marketing",
  supportingTagSlugs: ["email-marketing", "newsletter", "email-automation"],
},
```

- [ ] **Step 3: Add `/best/email-marketing-platform-for-small-business`**

Add a second best-page entry with a slightly broader “platform” framing while still using the same public inventory.

Use a ranked set built primarily from:

```ts
[
  EMAIL_TOOLS.mailchimp,
  EMAIL_TOOLS.activecampaign,
  EMAIL_TOOLS.brevo,
  EMAIL_TOOLS.klaviyo,
  EMAIL_TOOLS.mailerlite,
  EMAIL_TOOLS.convertkit,
  EMAIL_TOOLS.getresponse,
  EMAIL_TOOLS.campaignMonitor,
]
```

The content should emphasize platform tradeoffs, automation breadth, and business fit rather than only simplicity.

- [ ] **Step 4: Add the Email Marketing cluster to the `/best` hub**

Update `bestHubSections` in `src/server/seo/best-pages.ts` with a new section.

```ts
{
  slug: "email-marketing",
  title: "Email Marketing",
  intro:
    "These pages help small businesses, founders, and operators compare email marketing software by practical buyer jobs like campaigns, automation, newsletters, and audience growth.",
  pageSlugs: [
    "email-marketing-for-small-business",
    "email-marketing-platform-for-small-business",
  ],
  supportingLinks: [
    {
      href: "/categories/marketing",
      label: "Browse marketing tools",
      description: "Explore the broader marketing category on ShipBoost.",
    },
    {
      href: "/alternatives",
      label: "Compare email alternatives",
      description: "See comparison pages for the major email platforms.",
    },
  ],
},
```

- [ ] **Step 5: Extend the best-pages test file for the Email Marketing pages**

Update `src/server/seo/best-pages.test.ts`.

```ts
it("defines the first Email Marketing cluster pages", () => {
  expect(bestPagesRegistry["email-marketing-for-small-business"]).toBeDefined();
  expect(
    bestPagesRegistry["email-marketing-platform-for-small-business"],
  ).toBeDefined();
});
```

- [ ] **Step 6: Run the best-pages test file**

Run:

```bash
npm test -- src/server/seo/best-pages.test.ts
```

Expected:

- PASS

---

### Task 3: Add the First Email Marketing Alternatives Pages

**Files:**
- Modify: `src/server/seo/registry.ts`

- [ ] **Step 1: Add `/alternatives/mailchimp`**

Append a new `mailchimp` entry to `alternativesSeoRegistry`.

```ts
mailchimp: {
  slug: "mailchimp",
  anchorToolSlug: "mailchimp",
  title: "Best Mailchimp Alternatives",
  intro: "Compare the best Mailchimp alternatives for small businesses, creators, and growing teams evaluating email marketing tools with different tradeoffs in automation, pricing, and audience workflows.",
  metaTitle: "Best Mailchimp Alternatives for Email Marketing | ShipBoost",
  metaDescription: "Compare Mailchimp alternatives like ConvertKit, ActiveCampaign, MailerLite, and Brevo for teams evaluating better fit across email marketing, automation, and pricing.",
  toolSlugs: ["convertkit", "activecampaign", "mailerlite", "brevo", "klaviyo", "beehiiv", "getresponse"],
},
```

- [ ] **Step 2: Add `/alternatives/convertkit`**

Use the ConvertKit slug, but mention Kit naturally in the content.

```ts
convertkit: {
  slug: "convertkit",
  anchorToolSlug: "convertkit",
  title: "Best ConvertKit Alternatives",
  intro: "Compare the best ConvertKit alternatives for creators, newsletter businesses, and audience-first teams evaluating email tools with different strengths in automation, publishing, and business fit.",
  metaTitle: "Best ConvertKit Alternatives for Creator Email | ShipBoost",
  metaDescription: "Compare ConvertKit alternatives like Mailchimp, Beehiiv, MailerLite, and ActiveCampaign for teams evaluating creator-first email marketing tools.",
  toolSlugs: ["mailchimp", "beehiiv", "mailerlite", "activecampaign", "brevo", "klaviyo", "getresponse"],
},
```

- [ ] **Step 3: Add `/alternatives/activecampaign`**

```ts
activecampaign: {
  slug: "activecampaign",
  anchorToolSlug: "activecampaign",
  title: "Best ActiveCampaign Alternatives",
  intro: "Compare the best ActiveCampaign alternatives for teams that want different tradeoffs in automation depth, email simplicity, ecommerce fit, and small-business usability.",
  metaTitle: "Best ActiveCampaign Alternatives for Email Automation | ShipBoost",
  metaDescription: "Compare ActiveCampaign alternatives like Mailchimp, Brevo, Klaviyo, and ConvertKit for teams evaluating email automation and lifecycle marketing platforms.",
  toolSlugs: ["mailchimp", "brevo", "klaviyo", "convertkit", "mailerlite", "getresponse", "campaign-monitor"],
},
```

- [ ] **Step 4: Verify all three alternatives pages resolve against public inventory**

Run:

```bash
node scripts/run-with-env.mjs node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); const now = new Date(); const publicWhere = { publicationStatus: 'PUBLISHED', moderationStatus: 'APPROVED', OR: [{ launches: { none: {} } }, { launches: { some: { OR: [{ status: { in: ['LIVE','ENDED'] } }, { status: 'APPROVED', launchDate: { lte: now } }] } } }] }; const checks = { mailchimp: ['convertkit','activecampaign','mailerlite','brevo','klaviyo','beehiiv','getresponse'], convertkit: ['mailchimp','beehiiv','mailerlite','activecampaign','brevo','klaviyo','getresponse'], activecampaign: ['mailchimp','brevo','klaviyo','convertkit','mailerlite','getresponse','campaign-monitor'] }; (async () => { const tools = await prisma.tool.findMany({ where: publicWhere, select: { slug: true } }); const publicSlugs = new Set(tools.map((tool) => tool.slug)); const result = Object.fromEntries(Object.entries(checks).map(([slug, toolSlugs]) => [slug, toolSlugs.filter((toolSlug) => !publicSlugs.has(toolSlug))])); console.log(JSON.stringify(result, null, 2)); await prisma.$disconnect(); })().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });"
```

Expected:

```json
{
  "mailchimp": [],
  "convertkit": [],
  "activecampaign": []
}
```

---

### Task 4: Tighten Marketing-Cluster Internal Linking

**Files:**
- Modify: `src/app/categories/[slug]/page.tsx`

- [ ] **Step 1: Keep the existing category-based best-page linking logic**

`src/app/categories/[slug]/page.tsx` already derives `bestPageLinks` by `primaryCategorySlug`, so the new Email Marketing pages should appear automatically once their `primaryCategorySlug` is `marketing`.

The current logic should remain:

```ts
const bestPageLinks = Object.values(bestPagesRegistry)
  .filter((entry) => entry.primaryCategorySlug === category.slug)
  .slice(0, 3)
  .map((entry) => ({
    href: `/best/${entry.slug}`,
    label: entry.title,
    description: entry.metaDescription,
  }));
```

No structural rewrite is needed unless verification shows the new email pages do not surface on `/categories/marketing`.

- [ ] **Step 2: Verify the marketing category now picks up the new buyer-guide links**

Run a production build and confirm the marketing page renders with the new buyer-guide entries by checking the generated app routes and then spot-checking the route locally if needed.

Run:

```bash
npm run build
```

Expected:

- PASS
- `/best/email-marketing-for-small-business`
- `/best/email-marketing-platform-for-small-business`
- `/alternatives/mailchimp`
- `/alternatives/convertkit`
- `/alternatives/activecampaign`

If a local spot check is needed, run:

```bash
curl -sS http://localhost:3000/categories/marketing
```

Expected:

- the rendered HTML should include links for the new Email Marketing buyer guides after the dev server is running

---

### Task 5: Final Verification of the Cluster 3 Slice

**Files:**
- Verify all touched files

- [ ] **Step 1: Run the focused test file**

Run:

```bash
npm test -- src/server/seo/best-pages.test.ts
```

Expected:

- PASS

- [ ] **Step 2: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected:

- PASS

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected:

- PASS
- route output includes:
  - `○ /best`
  - `● /best/[slug]` with the new Email Marketing slugs
  - `● /alternatives/[slug]` with the new Email Marketing alternatives

- [ ] **Step 4: Verify the final Cluster 3 routes exist in the route output**

The build output should include these routes:

```text
/best/email-marketing-for-small-business
/best/email-marketing-platform-for-small-business
/alternatives/mailchimp
/alternatives/convertkit
/alternatives/activecampaign
```

---

## Self-Review

### Spec coverage

- import and publish all cluster 3 to 5 anchors: Task 1
- standardize email tags: Task 1
- build two Email Marketing best pages: Task 2
- build three Email Marketing alternatives pages: Task 3
- keep marketing as the broad category hub: Task 4
- ensure metadata/schema/canonical coverage through existing systems: Tasks 2, 3, and 5

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain
- Every task includes exact files and concrete code or commands

### Type consistency

- `EMAIL_TOOLS` constants are used consistently across new best pages
- alternatives slugs match their registry keys
- `convertkit` is kept as the URL slug throughout

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-cluster-3-email-marketing.md`.

Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

