# Meta Title + Description Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve public-page metadata so titles and descriptions match page intent, increase SERP clarity, and keep canonicals/OG/Twitter metadata consistent across the site.

**Architecture:** Add one shared public metadata helper under `src/server/seo` for canonical, Open Graph, and Twitter defaults, then patch each public route family with route-specific title and description copy. Keep schema builders unchanged except where dynamic metadata formulas need better fallback copy.

**Tech Stack:** Next.js App Router, TypeScript, React, existing `src/server/seo` utilities

---

## File Structure

### Create
- `src/server/seo/page-metadata.ts`
  - shared metadata builder for canonical, Open Graph, and Twitter metadata

### Modify
- `src/app/page.tsx`
  - add homepage-specific metadata
- `src/app/submit/page.tsx`
  - add submission-page metadata
- `src/app/launches/[board]/page.tsx`
  - add dynamic board metadata
- `src/app/categories/page.tsx`
  - upgrade category index metadata
- `src/app/tags/page.tsx`
  - upgrade tag index metadata
- `src/app/alternatives/page.tsx`
  - upgrade alternatives index metadata
- `src/app/pricing/page.tsx`
  - upgrade pricing metadata
- `src/app/how-it-works/page.tsx`
  - upgrade guide metadata
- `src/app/launch-guide/page.tsx`
  - upgrade guide metadata
- `src/app/faqs/page.tsx`
  - upgrade FAQ metadata
- `src/app/about/page.tsx`
  - upgrade about metadata
- `src/app/contact/page.tsx`
  - upgrade contact metadata
- `src/app/affiliate/page.tsx`
  - upgrade affiliate metadata
- `src/app/privacy/page.tsx`
  - upgrade privacy metadata
- `src/app/terms/page.tsx`
  - upgrade terms metadata
- `src/app/tools/[slug]/page.tsx`
  - improve tool title/description formulas, avoiding review language
- `src/app/categories/[slug]/page.tsx`
  - improve category detail fallback title/description
- `src/app/alternatives/[slug]/page.tsx`
  - standardize metadata construction via shared helper while preserving registry copy
- `src/app/best/tag/[slug]/page.tsx`
  - standardize metadata construction via shared helper
- `src/server/services/seo-service.ts`
  - improve best-tag fallback title/description formulas

---

## Route-by-Route Patch Targets

### Core discovery pages
- [ ] `/`
  - Title: `ShipBoost | Weekly SaaS Launches and Discovery`
  - Description: `Discover weekly SaaS launches, curated tools, and founder-friendly distribution paths on ShipBoost.`
- [ ] `/submit`
  - Title: `Submit Your SaaS Product | ShipBoost`
  - Description: `Submit your SaaS product to ShipBoost and choose a Free Launch or Premium Launch path.`
- [ ] `/launches/weekly`
  - Title: `Weekly SaaS Launches | ShipBoost`
  - Description: `Browse this week's SaaS launches on ShipBoost. Discover new products, compare listings, and track the active weekly board.`
- [ ] `/launches/monthly`
  - Title: `Monthly SaaS Launches | ShipBoost`
  - Description: `Explore this month's SaaS launches on ShipBoost and discover products gaining traction across the monthly board.`
- [ ] `/launches/yearly`
  - Title: `Yearly SaaS Launches | ShipBoost`
  - Description: `Browse the top SaaS launches of the year on ShipBoost and discover products with lasting momentum.`

### Index hubs
- [ ] `/categories`
  - Title: `Browse SaaS Tools by Category | ShipBoost`
  - Description: `Browse SaaS tools by category on ShipBoost, from marketing and analytics to support, sales, and development.`
- [ ] `/tags`
  - Title: `Browse SaaS Tools by Tag | ShipBoost`
  - Description: `Explore SaaS tools by feature, use case, and founder-focused tags on ShipBoost.`
- [ ] `/alternatives`
  - Title: `Best SaaS Alternatives and Comparisons | ShipBoost`
  - Description: `Compare popular SaaS products and discover curated alternatives for tools used by bootstrapped founders.`

### Conversion + informational pages
- [ ] `/pricing`
  - Title: `ShipBoost Pricing | Free and Premium Launches`
  - Description: `Compare ShipBoost pricing for Free Launch, Premium Launch, and done-for-you directory submission support.`
- [ ] `/how-it-works`
  - Title: `How ShipBoost Works for SaaS Founders`
  - Description: `Learn how ShipBoost works, from submissions and weekly launch cohorts to Premium Launch rules, ranking, and listing visibility.`
- [ ] `/launch-guide`
  - Title: `SaaS Launch Guide for Bootstrapped Founders | ShipBoost`
  - Description: `A practical SaaS launch guide for founders: what to prepare, what to avoid, and how to turn launch day into long-term momentum.`
- [ ] `/faqs`
  - Title: `ShipBoost Founder FAQs | Launch Questions Answered`
  - Description: `Get answers to common ShipBoost questions about submissions, launch weeks, Free vs Premium Launch, payments, and ranking.`

### Trust + legal pages
- [ ] `/about`
  - Title: `About ShipBoost`
  - Description: `Learn what ShipBoost is, who it serves, and why it is built around trust, weekly launches, and real distribution for SaaS founders.`
- [ ] `/contact`
  - Title: `Contact ShipBoost`
  - Description: `Contact ShipBoost for founder support, listing questions, partnerships, or launch help at support@shipboost.io.`
- [ ] `/affiliate`
  - Title: `Affiliate Disclosure | ShipBoost`
  - Description: `Read how ShipBoost handles affiliate relationships, partner links, and related disclosures.`
- [ ] `/privacy`
  - Title: `Privacy Policy | ShipBoost`
  - Description: `Read the ShipBoost privacy policy and how we handle account, submission, and platform data.`
- [ ] `/terms`
  - Title: `Terms of Service | ShipBoost`
  - Description: `Read the ShipBoost terms covering platform use, submissions, listings, and founder responsibilities.`

### Dynamic detail pages
- [ ] `/tools/[slug]`
  - Default title formula: `${tool.name} Pricing, Features & Alternatives | ShipBoost`
  - Short fallback: `${tool.name} Features & Pricing | ShipBoost`
  - Description formula: `${tool.name}: ${tagline}. Explore pricing, features, screenshots, and similar tools on ShipBoost.`
  - Constraint: never use `review`, `reviews`, `rating`, or `ratings`
- [ ] `/categories/[slug]`
  - Default title formula: `Best ${category.name} Tools for SaaS Founders | ShipBoost`
  - Description formula: `Discover the best ${category.name.toLowerCase()} tools on ShipBoost. Compare curated products, featured listings, and founder-friendly options.`
- [ ] `/best/tag/[slug]`
  - Default title formula: `Best ${tagName} SaaS Tools | ShipBoost`
  - Fallback description formula: `Browse the best ${tagName.toLowerCase()} tools on ShipBoost. Compare curated products, discover alternatives, and find founder-friendly picks.`
- [ ] `/alternatives/[slug]`
  - Preserve strong registry copy
  - Standardize canonical, OG, and Twitter construction through shared helper

---

## Implementation Tasks

### Task 1: Add shared metadata helper

**Files:**
- Create: `src/server/seo/page-metadata.ts`

- [ ] Add a helper that accepts `title`, `description`, `pathname`, and optional `openGraphType` / `twitterCard`
- [ ] Return `Metadata` with:
  - `title`
  - `description`
  - `alternates.canonical`
  - `openGraph.title`
  - `openGraph.description`
  - `openGraph.url`
  - `openGraph.siteName`
  - `openGraph.type`
  - `twitter.card`
  - `twitter.title`
  - `twitter.description`

### Task 2: Patch static and index routes

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/submit/page.tsx`
- Modify: `src/app/categories/page.tsx`
- Modify: `src/app/tags/page.tsx`
- Modify: `src/app/alternatives/page.tsx`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/how-it-works/page.tsx`
- Modify: `src/app/launch-guide/page.tsx`
- Modify: `src/app/faqs/page.tsx`
- Modify: `src/app/about/page.tsx`
- Modify: `src/app/contact/page.tsx`
- Modify: `src/app/affiliate/page.tsx`
- Modify: `src/app/privacy/page.tsx`
- Modify: `src/app/terms/page.tsx`

- [ ] Replace ad hoc `metadata` objects with helper-driven metadata where appropriate
- [ ] Add metadata to pages that currently rely only on layout defaults
- [ ] Keep schema JSON-LD wiring unchanged

### Task 3: Patch dynamic route metadata

**Files:**
- Modify: `src/app/launches/[board]/page.tsx`
- Modify: `src/app/tools/[slug]/page.tsx`
- Modify: `src/app/categories/[slug]/page.tsx`
- Modify: `src/app/best/tag/[slug]/page.tsx`
- Modify: `src/app/alternatives/[slug]/page.tsx`
- Modify: `src/server/services/seo-service.ts`

- [ ] Add `generateMetadata()` to launch-board pages
- [ ] Update tool-page fallback formulas to use pricing/features/alternatives language
- [ ] Update category-page fallback formulas to use best-tools language
- [ ] Update best-tag fallback formulas in `seo-service.ts`
- [ ] Use the shared metadata helper in dynamic pages that already have canonical data

### Task 4: Verify

**Files:**
- No new files

- [ ] Run `npm run lint`
- [ ] Run `npx tsc --noEmit`
- [ ] Spot-check representative route files for final metadata text consistency

