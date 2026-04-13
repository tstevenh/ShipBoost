# Pricing And Resource CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update launch-plan terminology, add a top-level founder CTA to the startup directories resource, and add a highlighted `shipboost.io` listing.

**Architecture:** Keep the changes local to the existing pricing page, founder submission UI, resource page, resource table component, and static resource dataset. Add a small optional `recommended` field to the directories data model so the UI can highlight ShipBoost without hard-coding domain-specific rendering logic.

**Tech Stack:** Next.js App Router, React, TypeScript, Testing Library, Vitest

---

### Task 1: Refresh launch copy

**Files:**
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/components/founder/submit-product-form.tsx`

- [ ] **Step 1: Update pricing page copy**

Replace the stale points:

```ts
"Requires backlink verification"
```

with:

```ts
"Requires badge verification"
```

and replace:

```ts
"No backlink required"
```

with:

```ts
"No badge required"
```

- [ ] **Step 2: Update founder submission plan copy**

Replace the stale strings:

```ts
["Weekly launchpad placement", "Public listing forever", "Founder verified badge", "Requires backlink"]
```

with:

```ts
["Weekly launchpad placement", "Public listing forever", "Founder verified badge", "Requires badge verification"]
```

Also replace:

```ts
"skip the backlink requirement."
["Choose your launch week", "Premium placement", "No backlink required", "Priority ordering over free launches", "Founding offer pricing"]
```

with:

```ts
"skip badge verification."
["Choose your launch week", "Premium placement", "No badge required", "Priority ordering over free launches", "Founding offer pricing"]
```

### Task 2: Add resource CTA and recommended entry support

**Files:**
- Modify: `src/app/resources/startup-directories/page.tsx`
- Modify: `src/components/resources/startup-directories-resource.tsx`
- Modify: `src/content/resources/startup-directories.ts`

- [ ] **Step 1: Extend the dataset**

Update the type:

```ts
recommended?: boolean;
```

and add a new entry:

```ts
{
  id: "shipboost-000",
  name: "ShipBoost",
  url: "https://shipboost.io",
  domain: "shipboost.io",
  dr: 0,
  recommended: true,
  searchText: "shipboost shipboost.io https://shipboost.io",
}
```

- [ ] **Step 2: Add the page-level CTA**

Insert a founder CTA block below the page intro and above the resource content with:

```tsx
<h2>Submit your product to ShipBoost</h2>
```

primary action to `/submit`, and short supporting text that mentions free and premium launch paths.

- [ ] **Step 3: Highlight recommended rows**

Update the table sorting to keep recommended entries ahead when sort values tie, and render a subtle badge:

```tsx
<span>Recommended</span>
```

next to the item name with a tinted row background for recommended items.

### Task 3: Update tests and verify

**Files:**
- Modify: `src/components/resources/startup-directories-resource.test.tsx`

- [ ] **Step 1: Add recommended-row assertions**

Extend the test fixture with one recommended entry and assert the recommended badge renders.

- [ ] **Step 2: Run focused tests**

Run:

```bash
npm run test -- src/components/resources/startup-directories-resource.test.tsx
```

Expected: PASS

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS
