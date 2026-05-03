# Launch Backlink Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ShipBoost's public tool-page backlink behavior match the launch offer: free launches are nofollow by default, verified free-launch badges unlock a followed backlink, and Premium Launch links are followed by default.

**Architecture:** Add one shared link-policy helper that derives the external website link `rel` value from public `Tool` fields. Update the public tool page to render the founder website URL directly, because the current internal redirect URL is not a clean backlink. Keep click analytics through the existing browser outbound tracker and tool-specific browser event metadata.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, Vitest.

---

## Current State

- Public tool-page `Visit website` currently links to `/api/outbound/tool/:toolId?...`, then redirects to the founder website.
- That redirect path is fine for click tracking, but weak for a backlink promise because the rendered anchor does not point directly at the founder domain.
- `Tool` already has the fields needed for automatic policy:
  - `badgeVerification`
  - `currentLaunchType`
  - `isFeatured`
- `verifyFreeLaunchBadge()` already updates both `Submission.badgeVerification` and `Tool.badgeVerification` to `VERIFIED` when the badge check succeeds.
- Premium submissions already set `Tool.isFeatured` and/or `Tool.currentLaunchType` in the launch flow, so the backend can derive Premium Launch followed links automatically.

## File Map

- Modify: `src/lib/outbound-link.ts`
  - Add backlink policy types and `resolveToolWebsiteRel()`.
- Modify: `src/lib/outbound-link.test.ts`
  - Add unit tests for free, badge-verified free, premium, and listing-only behavior.
- Modify: `src/server/db/public-selects.ts`
  - Include `badgeVerification`, `currentLaunchType`, and `isFeatured` in public tool detail/card/launch selects where public UI may render official website links.
- Modify: `src/components/public/tool-page-content.tsx`
  - Use direct `tool.websiteUrl` for the canonical tool-page `Visit website` link.
  - Apply `resolveToolWebsiteRel(tool)`.
  - Add data attributes for browser-side outbound tracking.
- Modify: `src/app/pricing/page.tsx`
  - Update Free Launch and Premium Launch offer copy.
- Modify: `src/components/founder/submit-product-form.tsx`
  - Update scheduling modal and badge modal copy.
- Modify: `src/server/services/submission-draft-service.ts`
  - Update badge verification success message.
- Modify: `src/app/faqs/page.tsx`, `src/app/how-it-works/page.tsx`, `src/app/launch-guide/page.tsx`
  - Replace old priority-review/faster-approval positioning with dofollow-link positioning.

---

### Task 1: Add Backlink Policy Helper

**Files:**
- Modify: `src/lib/outbound-link.ts`
- Test: `src/lib/outbound-link.test.ts`

- [ ] **Step 1: Add failing tests**

Add these cases to `src/lib/outbound-link.test.ts`:

```ts
import {
  buildOutboundLinkClickedProperties,
  isTrackableOutboundHttpUrl,
  resolveToolWebsiteRel,
} from "@/lib/outbound-link";

describe("resolveToolWebsiteRel", () => {
  it("nofollow links for unverified free launches", () => {
    expect(
      resolveToolWebsiteRel({
        badgeVerification: "PENDING",
        currentLaunchType: "FREE",
        isFeatured: false,
      }),
    ).toBe("nofollow noopener");
  });

  it("follows links for badge-verified free launches", () => {
    expect(
      resolveToolWebsiteRel({
        badgeVerification: "VERIFIED",
        currentLaunchType: "FREE",
        isFeatured: false,
      }),
    ).toBe("noopener");
  });

  it("follows links for premium launches by default", () => {
    expect(
      resolveToolWebsiteRel({
        badgeVerification: "NOT_REQUIRED",
        currentLaunchType: "FEATURED",
        isFeatured: true,
      }),
    ).toBe("noopener");
  });

  it("nofollow links for listing-only tools", () => {
    expect(
      resolveToolWebsiteRel({
        badgeVerification: "NOT_REQUIRED",
        currentLaunchType: null,
        isFeatured: false,
      }),
    ).toBe("nofollow noopener");
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
npm test -- src/lib/outbound-link.test.ts
```

Expected: fails because `resolveToolWebsiteRel` does not exist.

- [ ] **Step 3: Implement the helper**

Add this to `src/lib/outbound-link.ts`:

```ts
export type ToolWebsiteRelPolicyInput = {
  badgeVerification?: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED" | null;
  currentLaunchType?: "FREE" | "FEATURED" | "RELAUNCH" | null;
  isFeatured?: boolean | null;
};

export function resolveToolWebsiteRel(input: ToolWebsiteRelPolicyInput) {
  if (input.isFeatured || input.currentLaunchType === "FEATURED") {
  return "noopener";
  }

  if (input.badgeVerification === "VERIFIED") {
    return "noopener";
  }

  return "nofollow noopener";
}
```

- [ ] **Step 4: Run the focused test and verify pass**

Run:

```bash
npm test -- src/lib/outbound-link.test.ts
```

Expected: all tests in `outbound-link.test.ts` pass.

---

### Task 2: Expose Policy Fields to Public Tool Rendering

**Files:**
- Modify: `src/server/db/public-selects.ts`

- [ ] **Step 1: Add public select fields**

Update `publicToolCardSelect`, `publicToolDetailSelect`, and `publicLaunchToolSelect` to include:

```ts
badgeVerification: true,
currentLaunchType: true,
isFeatured: true,
```

For `publicToolDetailSelect`, place the fields next to `websiteUrl`:

```ts
websiteUrl: true,
badgeVerification: true,
currentLaunchType: true,
isFeatured: true,
metaTitle: true,
```

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
npx tsc --noEmit
```

Expected: either pass, or show the next places where public tool TypeScript types need the new fields.

---

### Task 3: Render the Official Tool-Page Backlink Directly

**Files:**
- Modify: `src/components/public/tool-page-content.tsx`

- [ ] **Step 1: Import the policy helper**

Change imports:

```ts
import { resolveToolWebsiteRel } from "@/lib/outbound-link";
```

Remove the `buildTrackedToolOutboundUrl` import if it is no longer used by this file.

- [ ] **Step 2: Extend `ToolPageData`**

Add these fields to `ToolPageData`:

```ts
badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
currentLaunchType: "FREE" | "FEATURED" | "RELAUNCH" | null;
isFeatured: boolean;
```

- [ ] **Step 3: Replace redirect href with direct external href**

Replace:

```ts
const websiteHref = isPreview
  ? tool.websiteUrl
  : buildTrackedToolOutboundUrl(tool.id, "website", "tool_page");
```

with:

```ts
const websiteHref = tool.websiteUrl;
const websiteRel = isPreview ? "noreferrer" : resolveToolWebsiteRel(tool);
```

- [ ] **Step 4: Apply rel and browser tracking metadata to the anchor**

Update the `Visit website` anchor:

```tsx
<a
  href={websiteHref}
  target="_blank"
  rel={websiteRel}
  data-shipboost-outbound-source="tool_page"
  data-shipboost-outbound-context="tool_page"
  data-shipboost-outbound-text={tool.name}
  className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-6 py-4 text-sm font-black text-foreground shadow-sm transition-all hover:bg-muted active:scale-95"
>
```

Note: followed links use `rel="noopener"` and no `nofollow`. Do not render `rel="dofollow"` because `dofollow` is not a meaningful HTML link relation.

- [ ] **Step 5: Run TypeScript check**

Run:

```bash
npx tsc --noEmit
```

Expected: pass.

---

### Task 4: Update Pricing and Submission Flow Copy

**Files:**
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/components/founder/submit-product-form.tsx`
- Modify: `src/server/services/submission-draft-service.ts`

- [ ] **Step 1: Update pricing page copy**

In `src/app/pricing/page.tsx`, update Free Launch description:

```ts
description:
  "Best for founders who want a founder-ready public listing and weekly launch visibility. Free launches use a nofollow website link by default; verified ShipBoost badges unlock a dofollow backlink.",
```

Update Free Launch points:

```ts
points: [
  "Weekly launchpad placement",
  "Public listing on ShipBoost",
  "Nofollow website link by default",
  "Verified badge unlocks a dofollow backlink",
],
```

Update Premium Launch description:

```ts
description:
  "Reserve your launch week, get stronger baseline placement, receive a ShipBoost editorial launch spotlight, and get a dofollow backlink by default.",
```

Update Premium Launch points:

```ts
points: [
  "Reserve a specific launch week",
  "Dofollow backlink included by default",
  "No badge step required",
  "Get stronger baseline board placement",
  "Includes one editorial launch spotlight during launch period",
],
```

- [ ] **Step 2: Update schedule modal copy**

In `src/components/founder/submit-product-form.tsx`, update the free launch description:

```tsx
Get the next free launch slot. Free launches include a nofollow website link by default.
```

In the Premium Launch feature list, add:

```ts
"Dofollow backlink included by default",
```

- [ ] **Step 3: Update badge modal copy**

In `src/components/founder/submit-product-form.tsx`, replace:

```tsx
Optional badge verification
Be approved faster with badge verification
Your free launch is scheduled. Add a small ShipBoost badge to
your homepage or footer if you want priority review within
24-48 hours.
```

with:

```tsx
Badge backlink verification
Unlock your dofollow backlink
Your free launch is scheduled with a nofollow website link by default. Add a small ShipBoost badge to your homepage or footer, then verify it to unlock a dofollow backlink.
```

- [ ] **Step 4: Update badge verification success message**

In `src/server/services/submission-draft-service.ts`, replace the verified message with:

```ts
"Badge verified. Your free launch now unlocks a dofollow backlink."
```

- [ ] **Step 5: Search for stale faster-approval copy**

Run:

```bash
rg -n "faster approval|approved faster|priority review|24-48" src
```

Expected: no founder-facing public copy still claims badge verification is for faster approval.

---

### Task 5: Update Supporting Public Education Pages

**Files:**
- Modify: `src/app/faqs/page.tsx`
- Modify: `src/app/how-it-works/page.tsx`
- Modify: `src/app/launch-guide/page.tsx`

- [ ] **Step 1: Update FAQ answers**

In `src/app/faqs/page.tsx`, update the Free vs Premium answer:

```ts
"Free Launch goes through manual review and is queued into the next available weekly cohort with a nofollow website link by default. Founders can add and verify the ShipBoost badge to unlock a dofollow backlink. Premium Launch lets you reserve a launch week, gets stronger baseline placement, and includes a dofollow backlink by default.",
```

Update the badge FAQ answer:

```ts
"The badge helps visitors see where you launched, adds a simple trust signal to your site, and lets ShipBoost verify your free launch for a dofollow backlink.",
```

- [ ] **Step 2: Update how-it-works copy**

In `src/app/how-it-works/page.tsx`, change step 1 body:

```ts
"Founders submit their product, listing details, and launch preference. Free launches use a nofollow website link by default and can add an optional ShipBoost badge to unlock a dofollow backlink.",
```

Change Free Launch rules:

```ts
points: [
  "Reviewed before approval",
  "Nofollow website link by default",
  "Verified badge unlocks a dofollow backlink",
  "Queued into the next available weekly cohort",
],
```

Change Premium Launch rules:

```ts
points: [
  "Choose a launch week",
  "Dofollow backlink included by default",
  "No badge step required",
  "Starts ahead of free launches outside the top vote slots",
],
```

- [ ] **Step 3: Update launch guide copy**

In `src/app/launch-guide/page.tsx`, update the two card bodies:

```ts
body:
  "Use the free option when you want visibility, are comfortable with a nofollow website link by default, and can add the ShipBoost badge if you want to unlock a dofollow backlink.",
```

```ts
body:
  "Use Premium Launch when timing matters, you want to reserve a specific week, you want stronger baseline placement in the board, or you want a dofollow backlink included by default.",
```

- [ ] **Step 4: Re-run stale-copy search**

Run:

```bash
rg -n "faster approval|approved faster|priority review|24-48" src/app src/components src/server
```

Expected: no stale public/founder-facing references remain.

---

### Task 6: Verify End-to-End Behavior

**Files:**
- No direct edits unless verification finds an issue.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- src/lib/outbound-link.test.ts
```

Expected: pass.

- [ ] **Step 2: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected: pass.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: pass.

- [ ] **Step 4: Build**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 5: Manual source check**

Start the app:

```bash
npm run dev
```

Open a published tool page and inspect the `Visit website` anchor in page source:

- Unverified free/listing-only tool: `href="https://founder-site.example"` and `rel="nofollow noopener"`.
- Badge-verified free tool: `href="https://founder-site.example"` and `rel="noopener"`.
- Premium tool: `href="https://founder-site.example"` and `rel="noopener"`.

---

## Backend Feasibility Answer

Yes, the backend can make this automatic with the fields already present. Badge verification already writes `Tool.badgeVerification = VERIFIED`, and Premium Launch already marks tools with premium state through `isFeatured` and/or `currentLaunchType = FEATURED`. The missing piece is not the database; it is rendering the official tool-page backlink as a direct external link, deriving `rel` from those fields, and preserving PostHog tracking through browser-side metadata.

## Self-Review

- Spec coverage: covers pricing page, submission modal, badge modal, badge verification message, and automatic backend-driven link behavior.
- Placeholder scan: no TODO/TBD placeholders.
- Type consistency: plan uses existing Prisma enum values: `NOT_REQUIRED`, `PENDING`, `VERIFIED`, `FAILED`, `FREE`, `FEATURED`, `RELAUNCH`.
