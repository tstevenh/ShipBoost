# Revert Premium Launch to the $9 Founding Structure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the proven flat **$9 founding + spots-left scarcity** Premium Launch structure (app + cold email), remove the $19 ladder and the `LAUNCH9` discount/deadline outreach machinery, and persist the real charged amount on each payment.

**Architecture:** Two sibling repos. In `my-app`, delete the ladder display layer and restore the pre-ladder inline `$9` price logic driven by a **round-scoped** founding-spots count (so a fresh batch of 20 reads cleanly as "N of 20"). In `outreach`, swap only the pricing OFFER block back to "$9 founding, N of M spots left" and strip the discount-code/deadline plumbing — keeping all current template bodies and the AI-visibility angle. Add nullable `amountCents`/`discountCode` columns and populate them from the Dodo `payment.succeeded` payload.

**Tech Stack:** Next.js 16 / React 19, Prisma + Postgres (Neon), Dodo Payments, Vitest. `outreach` is a TypeScript pipeline with Vitest.

## Global Constraints

- **Pricing hunks only.** Do NOT change SEO, performance indexes, badge/free-launch verification, LLM personalization, hybrid-template *structure*, the `{{shipboost_dr}}` DR variable, or any non-pricing markup/logic.
- **Keep the in-app `LAUNCH9` free→premium upsell feature** (`launch-section.tsx`) intact — it is a conversion path, not the $19 discount. At $9 list it is simply redundant.
- **Keep all current outreach template bodies** (4 static + AI-visibility `out-11`, current follow-ups, `hyb-03`). Do NOT restore the deleted legacy templates.
- The **$19 anchor stays as a strikethrough compare-at** during founding (proven framing: "$9, was ~~$19~~"). $19 is not the charged price.
- Charged price is **Option A**: set manually in the Dodo dashboard. Code drives display + scarcity only.
- `my-app` requires Node 20.x. Run all `my-app` commands from `/Users/tsth/Coding/shipboost/my-app`; all `outreach` commands from `/Users/tsth/Coding/shipboost/outreach`.
- Commit after each task. Do NOT push unless the user asks.

---

## Phase A — `my-app`: ladder → flat $9 + founding scarcity

### Task A1: Round-scope the founding-spots count

**Files:**
- Modify: `src/server/env.ts:39` (schema) and `src/server/env.ts:83` (process.env mapping)
- Modify: `src/server/services/founding-offer-service.ts`
- Test: `src/server/services/founding-offer-service.test.ts`

**Interfaces:**
- Produces: `getRemainingFoundingPremiumLaunchSpots(): Promise<number>` (now counts paid launches since `env.PREMIUM_LAUNCH_ROUND_START`). `getPaidPremiumLaunchCount(): Promise<number>` (unchanged, all-time).
- Consumes: `env.FOUNDING_PREMIUM_LAUNCH_LIMIT` (20), `env.PREMIUM_LAUNCH_ROUND_START` (new Date).

- [ ] **Step 1: Add the env var.** In `src/server/env.ts`, add to the zod schema right after line 39:

```ts
  FOUNDING_PREMIUM_LAUNCH_LIMIT: z.coerce.number().int().positive().default(20),
  PREMIUM_LAUNCH_ROUND_START: z.coerce
    .date()
    .default(new Date("2026-06-30T00:00:00.000Z")),
```

And in the process.env mapping object right after line 83:

```ts
      FOUNDING_PREMIUM_LAUNCH_LIMIT: process.env.FOUNDING_PREMIUM_LAUNCH_LIMIT,
      PREMIUM_LAUNCH_ROUND_START: process.env.PREMIUM_LAUNCH_ROUND_START,
```

- [ ] **Step 2: Update the failing test.** Replace the body of `src/server/services/founding-offer-service.test.ts` with:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { submission: { count: vi.fn() } },
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));

const ROUND_START = new Date("2026-06-30T00:00:00.000Z");
vi.mock("@/server/env", () => ({
  getEnv: () => ({
    FOUNDING_PREMIUM_LAUNCH_LIMIT: 20,
    PREMIUM_LAUNCH_ROUND_START: ROUND_START,
  }),
}));

import { getRemainingFoundingPremiumLaunchSpots } from "@/server/services/founding-offer-service";

describe("founding-offer-service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("counts only paid launches in the current round", async () => {
    prismaMock.submission.count.mockResolvedValueOnce(6);
    await expect(getRemainingFoundingPremiumLaunchSpots()).resolves.toBe(14);
    expect(prismaMock.submission.count).toHaveBeenCalledWith({
      where: {
        submissionType: "FEATURED_LAUNCH",
        paymentStatus: "PAID",
        paidAt: { gte: ROUND_START },
      },
    });
  });

  it("never returns a negative number", async () => {
    prismaMock.submission.count.mockResolvedValueOnce(40);
    await expect(getRemainingFoundingPremiumLaunchSpots()).resolves.toBe(0);
  });
});
```

- [ ] **Step 3: Run it, verify it fails.** Run: `npx vitest run src/server/services/founding-offer-service.test.ts`. Expected: FAIL (count called without `paidAt`).

- [ ] **Step 4: Implement.** Replace `src/server/services/founding-offer-service.ts` with:

```ts
import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";

export async function getPaidPremiumLaunchCount() {
  return prisma.submission.count({
    where: { submissionType: "FEATURED_LAUNCH", paymentStatus: "PAID" },
  });
}

export async function getRemainingFoundingPremiumLaunchSpots() {
  const env = getEnv();
  const used = await prisma.submission.count({
    where: {
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      paidAt: { gte: env.PREMIUM_LAUNCH_ROUND_START },
    },
  });
  return Math.max(env.FOUNDING_PREMIUM_LAUNCH_LIMIT - used, 0);
}
```

- [ ] **Step 5: Run it, verify it passes.** Run: `npx vitest run src/server/services/founding-offer-service.test.ts`. Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add src/server/env.ts src/server/services/founding-offer-service.ts src/server/services/founding-offer-service.test.ts
git commit -m "feat(pricing): round-scope founding premium launch spots"
```

---

### Task A2: Delete the ladder module + its tests

**Files:**
- Delete: `src/lib/premium-pricing.ts`, `src/lib/premium-pricing.test.ts`
- Delete: `src/components/founder/premium-pricing-ladder.tsx`, `src/components/founder/premium-pricing-ladder.test.tsx`

> Do this AFTER A3/A4 remove the importers, OR in one commit with them. To keep the tree compiling, perform A3 and A4 first, then delete. (Subagent-driven: run A3, A4, then A2.)

- [ ] **Step 1: Confirm no remaining importers.** Run: `grep -rn "premium-pricing\|PremiumPricingLadder\|resolveCurrentPremiumLaunchTier\|resolvePremiumLaunchTier" src/ | grep -v "founding-offer"`. Expected: no matches (after A3/A4).

- [ ] **Step 2: Delete the files.**

```bash
git rm src/lib/premium-pricing.ts src/lib/premium-pricing.test.ts \
       src/components/founder/premium-pricing-ladder.tsx \
       src/components/founder/premium-pricing-ladder.test.tsx
```

- [ ] **Step 3: Typecheck/build.** Run: `npm run build`. Expected: success, no "cannot find module '@/lib/premium-pricing'".

- [ ] **Step 4: Commit.**

```bash
git commit -m "refactor(pricing): remove $19 premium launch ladder module"
```

---

### Task A3: Restore flat $9 display in the submit launch card

**Files:**
- Modify: `src/components/founder/launch-section.tsx` (imports `19-20`; price resolution `~330-345`; price JSX `~489-496`)
- Test: `src/components/founder/launch-section.test.tsx` (existing LAUNCH9 tests must still pass)

**Interfaces:**
- Consumes (existing props): `foundingPremiumSpotsLeft: number`, `foundingPremiumLaunchLimit: number`. The `FREE_UPGRADE_DISCOUNT_CODE = "LAUNCH9"` upsell block (lines ~738-757) stays untouched.

- [ ] **Step 1: Remove the ladder imports.** Delete these two lines (`src/components/founder/launch-section.tsx:19-20`):

```ts
import { PremiumPricingLadder } from "@/components/founder/premium-pricing-ladder";
import { resolveCurrentPremiumLaunchTier } from "@/lib/premium-pricing";
```

- [ ] **Step 2: Replace the price resolution.** Replace this block (around lines 331-339):

```ts
  // The founding ($9) phase is complete — shown as a passed tier; the ladder
  // lands on the current early-access ($19) tier.
  const premiumTier = resolveCurrentPremiumLaunchTier(
    paidPremiumLaunchCount,
    foundingPremiumLaunchLimit,
  );
  const premiumPrice = premiumTier.price;
```

with:

```ts
  // Founding $9 round: $9 while spots remain, with the $19 anchor struck through.
  const premiumPrice = foundingPremiumSpotsLeft > 0 ? 9 : 19;
  const premiumCompareAt = foundingPremiumSpotsLeft > 0 ? 19 : 29;
  const spotsLabel =
    foundingPremiumSpotsLeft > 0
      ? `${foundingPremiumSpotsLeft} of ${foundingPremiumLaunchLimit} founding spots left`
      : "Early access pricing — rising to $29 soon";
```

- [ ] **Step 3: Replace the price JSX + ladder.** Replace this block (lines ~489-496):

```tsx
            <div className="mt-5 flex items-end gap-3">
              <span className="text-5xl font-black tracking-tighter text-foreground">
                ${premiumPrice}
              </span>
              <span className="pb-1 text-sm font-bold text-muted-foreground">/ launch</span>
            </div>
            <PremiumPricingLadder tier={premiumTier} />
```

with:

```tsx
            <div className="mt-5 flex items-end gap-3">
              <span className="text-xl font-black text-muted-foreground line-through">${premiumCompareAt}</span>
              <span className="text-5xl font-black tracking-tighter text-foreground">
                ${premiumPrice}
              </span>
              <span className="pb-1 text-sm font-bold text-muted-foreground">/ launch</span>
            </div>
            {spotsLabel && (
              <p className="mt-1.5 text-[10px] font-black tracking-widest text-primary">
                {spotsLabel}
              </p>
            )}
```

- [ ] **Step 4: Handle the now-unused prop.** If `paidPremiumLaunchCount` is destructured in the component props and eslint flags it as unused, remove it from the destructuring list ONLY (leave the prop in the component's props type so the parent call sites in `submit/page.tsx` and `dashboard/tools/[toolId]/page.tsx` stay unchanged). Run: `npm run lint -- src/components/founder/launch-section.tsx`.

- [ ] **Step 5: Run the existing component tests.** Run: `npx vitest run src/components/founder/launch-section.test.tsx`. Expected: PASS. The LAUNCH9 tests render with `foundingPremiumSpotsLeft={0}` (so price shows $19/$29) and assert the "Unlock Premium Launch for $9" upsell — both still hold. If any assertion referenced ladder text, update it to the new spots label.

- [ ] **Step 6: Commit.**

```bash
git add src/components/founder/launch-section.tsx src/components/founder/launch-section.test.tsx
git commit -m "feat(pricing): flat $9 founding display on submit launch card"
```

---

### Task A4: Restore flat $9 display on the `/pricing` page

**Files:**
- Modify: `src/app/pricing/page.tsx` (import `26`; data block `~68-74`; premium article JSX `~143-193`)

**Interfaces:**
- Consumes: `getRemainingFoundingPremiumLaunchSpots()` from `@/server/services/founding-offer-service`.

- [ ] **Step 1: Swap imports.** Remove the `resolveCurrentPremiumLaunchTier` import (line 26) and the `PremiumPricingLadder` import. Ensure this import is present (add if missing):

```ts
import { getRemainingFoundingPremiumLaunchSpots } from "@/server/services/founding-offer-service";
```

- [ ] **Step 2: Replace the data block.** Replace (lines ~68-74):

```ts
  const paidPremiumLaunchCount = await getCachedPaidPremiumLaunchCount();
  // Founding ($9) is complete (shown as a passed tier); the ladder lands on the
  // current early-access price. The charged Dodo price is updated manually per band.
  const premiumTier = resolveCurrentPremiumLaunchTier(
    paidPremiumLaunchCount,
    env.FOUNDING_PREMIUM_LAUNCH_LIMIT,
  );
  const premiumBadge = premiumTier.label;
```

with:

```ts
  const foundingPremiumLaunchSpotsLeft = await getRemainingFoundingPremiumLaunchSpots();
  const premiumPrice = foundingPremiumLaunchSpotsLeft > 0 ? 9 : 19;
  const premiumCompareAt = foundingPremiumLaunchSpotsLeft > 0 ? 19 : 29;
  const premiumBadge = foundingPremiumLaunchSpotsLeft > 0 ? "Founding" : "Early access";
```

> If `getCachedPaidPremiumLaunchCount` becomes unused on this page, remove its import. Leave it defined wherever it lives if other files use it.

- [ ] **Step 3: Replace the price markup.** In the premium `<article>` (lines ~143-193), replace the price `<div>` and the `<PremiumPricingLadder .../>` line:

```tsx
  <div className="mt-5 flex items-end gap-3">
    <span className="text-5xl font-black tracking-tighter text-foreground">
      ${premiumTier.price}
    </span>
    <span className="pb-1 text-sm font-bold text-muted-foreground">/ launch</span>
  </div>
  <PremiumPricingLadder tier={premiumTier} />
```

with:

```tsx
  <div className="mt-5 flex items-end gap-3">
    <span className="text-xl font-black text-muted-foreground line-through">${premiumCompareAt}</span>
    <span className="text-5xl font-black tracking-tighter text-foreground">
      ${premiumPrice}
    </span>
    <span className="pb-1 text-sm font-bold text-muted-foreground">/ launch</span>
  </div>
  {foundingPremiumLaunchSpotsLeft > 0 && (
    <p className="mt-3 text-[10px] font-black tracking-widest text-primary">
      {foundingPremiumLaunchSpotsLeft} of {env.FOUNDING_PREMIUM_LAUNCH_LIMIT} founding spots left
    </p>
  )}
```

> `{premiumBadge}` in the ribbon (top of the article) stays — it now reads "Founding". Confirm `env` is already in scope on this page (it is used for `env.FOUNDING_PREMIUM_LAUNCH_LIMIT`); if not, add `const env = getEnv();`.

- [ ] **Step 4: Build.** Run: `npm run build`. Expected: success.

- [ ] **Step 5: Commit.**

```bash
git add src/app/pricing/page.tsx
git commit -m "feat(pricing): flat $9 founding display on /pricing"
```

---

## Phase B — `my-app`: persist the real charged amount

### Task B1: Add `amountCents` / `discountCode` columns

**Files:**
- Modify: `prisma/schema.prisma` (Submission model, after line 305 `paidAt`)
- Create: `prisma/migrations/<timestamp>_add_submission_amount_and_discount_code/migration.sql` (generated)

- [ ] **Step 1: Edit the schema.** In `prisma/schema.prisma`, inside `model Submission`, immediately after the `paidAt              DateTime?` line (305), add:

```prisma
  amountCents         Int?
  discountCode        String?
```

- [ ] **Step 2: Create + apply the migration.** Run:

```bash
npm run db:migrate -- --name add_submission_amount_and_discount_code
```

Expected: a new migration folder is created and applied; both columns are nullable (additive, non-breaking). Then run `npm run prisma:generate`.

- [ ] **Step 3: Commit.**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(payments): add amountCents and discountCode to Submission"
```

---

### Task B2: Populate amount + discount from the `payment.succeeded` payload

**Files:**
- Modify: `src/app/api/dodo/webhooks/route.ts` (payload type + the two `handlePremiumLaunchPaymentSucceeded` calls at lines ~78 and ~88)
- Modify: `src/server/services/submission-payment-service.ts` (`handlePremiumLaunchPaymentSucceeded` signature ~376; `PremiumLaunchPaymentLike` type; the `tx.submission.update` data block ~118-128)
- Test: `src/server/services/submission-payment-service.test.ts`

**Interfaces:**
- `handlePremiumLaunchPaymentSucceeded(input: { paymentId: string; checkoutSessionId?: string | null; metadata?: Record<string, unknown>; amountCents?: number | null; discountCode?: string | null; })`
- The persisted Submission gains `amountCents` and `discountCode`.

- [ ] **Step 1: Extend the webhook payload type + pass the fields.** In `src/app/api/dodo/webhooks/route.ts`, add `total_amount` to the payload data type:

```ts
type DodoWebhookPayload = {
  type: string;
  data: {
    payment_id?: string;
    checkout_session_id?: string | null;
    status?: string | null;
    metadata?: Record<string, unknown>;
    discount_id?: string | null;
    discount_code?: string | null;
    total_amount?: number | null;
  };
};
```

Then, in BOTH places that call `handlePremiumLaunchPaymentSucceeded` (the `launch_bundle` FEATURED branch ~78 and the default `else` branch ~88), add the two fields to the argument object:

```ts
        handlePremiumLaunchPaymentSucceeded({
          paymentId,
          checkoutSessionId: payload.data.checkout_session_id ?? null,
          metadata: payload.data.metadata ?? {},
          amountCents: payload.data.total_amount ?? null,
          discountCode: payload.data.discount_code ?? null,
        }),
```

- [ ] **Step 2: Write the failing test.** In `src/server/services/submission-payment-service.test.ts`, add a test that drives the handler and asserts the new fields are persisted. Mirror the existing mock setup in that file (it already mocks `@/server/db/client` and `getDodoClient`). Add:

```ts
it("persists amountCents and discountCode from a premium launch payment", async () => {
  // Arrange: a draft FEATURED submission matched by metadata id (reuse the
  // file's existing prisma + submission.update mocks / helpers).
  await handlePremiumLaunchPaymentSucceeded({
    paymentId: "pay_amt_1",
    checkoutSessionId: "cs_amt_1",
    metadata: { shipboostSubmissionId: "submission_amt_1" },
    amountCents: 900,
    discountCode: "LAUNCH9",
  });

  // Assert: the submission update was called with the new fields.
  expect(submissionUpdateMock).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        paymentStatus: "PAID",
        amountCents: 900,
        discountCode: "LAUNCH9",
      }),
    }),
  );
});
```

> Use the SAME mock handle the existing tests use for `tx.submission.update` (name it to match — inspect the top of the file; the existing "matches payment.succeeded…" test already asserts on the update). If the file lacks a reusable update mock, capture it via `prismaMock.$transaction` the way the existing tests do.

- [ ] **Step 3: Run it, verify it fails.** Run: `npx vitest run src/server/services/submission-payment-service.test.ts -t "persists amountCents"`. Expected: FAIL (fields not in update data).

- [ ] **Step 4: Implement.** In `src/server/services/submission-payment-service.ts`:

(a) Add the fields to the `PremiumLaunchPaymentLike` type (the type used for `payment`) — add `amountCents?: number | null;` and `discountCode?: string | null;`.

(b) Extend `handlePremiumLaunchPaymentSucceeded` (line ~376) to accept and forward them:

```ts
export async function handlePremiumLaunchPaymentSucceeded(input: {
  paymentId: string;
  checkoutSessionId?: string | null;
  metadata?: Record<string, unknown>;
  amountCents?: number | null;
  discountCode?: string | null;
}) {
  const payment = {
    id: input.paymentId,
    checkoutSessionId: input.checkoutSessionId ?? null,
    metadata: input.metadata ?? {},
    amountCents: input.amountCents ?? null,
    discountCode: input.discountCode ?? null,
  };
  const updatedSubmission = await applyPremiumLaunchPaymentSucceeded(payment);
  // ...unchanged warn block...
}
```

(c) In `applyPremiumLaunchPaymentSucceeded`, add the two fields to the `tx.submission.update` `data` object (the block at ~118-128, alongside `paidAt: now`):

```ts
        data: {
          paymentStatus: "PAID",
          submissionType: "FEATURED_LAUNCH",
          preferredLaunchDate,
          polarOrderId: payment.id,
          polarCheckoutId:
            payment.checkoutSessionId ?? submission.polarCheckoutId,
          paidAt: now,
          reviewStatus: "APPROVED",
          amountCents: payment.amountCents ?? null,
          discountCode: payment.discountCode ?? null,
        },
```

- [ ] **Step 5: Run it, verify it passes.** Run: `npx vitest run src/server/services/submission-payment-service.test.ts`. Expected: PASS (new + all existing tests).

- [ ] **Step 6: Commit.**

```bash
git add src/app/api/dodo/webhooks/route.ts src/server/services/submission-payment-service.ts src/server/services/submission-payment-service.test.ts
git commit -m "feat(payments): persist charged amount and discount code on payment.succeeded"
```

---

## Phase C — `outreach`: cold-email templates → clean $9

> All commands/paths in this phase are in `/Users/tsth/Coding/shipboost/outreach`.

### Task C1: Swap the pricing OFFER block back to $9 founding scarcity

**Files:**
- Modify: `src/lib/draft/templates.ts` (header comment `3-6`; constants; `OFFER` const line 11)
- Modify: `src/lib/draft/hybrid-templates.ts` (JSDoc `15-16`; constants; the inline offer in `hyb-03` line ~29)
- Test: `tests/draft/templates.test.ts` (create if absent)

**Interfaces:**
- After this task, NO template body references `{{discount_code}}` or `{{discount_deadline}}`. Scarcity comes from module-local `SLOTS_LEFT` / `SLOTS_TOTAL` consts.

- [ ] **Step 1: `templates.ts` — constants + OFFER.** Replace the header/offer region (lines 1-11) so it reads:

```ts
import type { Template } from "./select";

// Premium Launch is $9 (founding price). Cold outreach uses the same flat $9 as
// the app; scarcity comes from the founding spots count below. Update SLOTS_LEFT
// as founding spots fill.
const SLOTS_LEFT = 12;
const SLOTS_TOTAL = 20;
const CTA_URL = "https://shipboost.io/submit";
const SIG = `<p>{{sender_first_name}}<br/><a href="https://shipboost.io">shipboost.io</a></p>`;

// Action block reused across templates: price lands here, never in the subject.
const OFFER = `<p>Premium Launch is $9 right now (founding price, ${SLOTS_LEFT} of ${SLOTS_TOTAL} spots left). Reserved launch week, permanent listing, plus an editorial spotlight on /blog with a DR {{shipboost_dr}} dofollow link to {{website_domain}}.</p>`;
```

> Leave all four current template objects (`out-02`, `out-04`, `out-11-ai-visibility-noname`, `out-12`) exactly as they are — they already interpolate `${OFFER}`.

- [ ] **Step 2: `hybrid-templates.ts` — JSDoc + constants + inline offer.** (a) In the JSDoc variable list, DELETE the two lines:

```ts
 *   {{discount_code}}         - the $9 Premium Launch code (per-day, from my-app)
 *   {{discount_deadline}}     - "Month D" the code closes
```

(b) Add the scarcity constants next to `CTA_URL`:

```ts
const SLOTS_LEFT = 12;
const SLOTS_TOTAL = 20;
const CTA_URL = "https://shipboost.io/submit";
```

(c) In `hyb-03-second-job`, replace the offer line (line ~29):

```ts
<p>Premium Launch is $9 right now, normally $19. Use code {{discount_code}} at checkout, it closes {{discount_deadline}}.</p>
```

with:

```ts
<p>Premium Launch is $9 right now (founding price, ${SLOTS_LEFT} of ${SLOTS_TOTAL} spots left). Reserved launch week, permanent listing, editorial spotlight on /blog with a DR {{shipboost_dr}} dofollow link.</p>
```

- [ ] **Step 3: Write a guard test.** Create `tests/draft/templates.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { templates } from "@/lib/draft/templates";
import { hybridTemplates } from "@/lib/draft/hybrid-templates";

const all = [...templates, ...hybridTemplates];

describe("outreach templates pricing", () => {
  it("never reference the removed discount tokens", () => {
    for (const t of all) {
      expect(t.bodyHtml).not.toContain("discount_code");
      expect(t.bodyHtml).not.toContain("discount_deadline");
    }
  });

  it("offer $9 founding with spots-left scarcity", () => {
    const offers = all.filter((t) => t.bodyHtml.includes("Premium Launch is $9"));
    expect(offers.length).toBeGreaterThan(0);
    for (const t of offers) {
      expect(t.bodyHtml).toContain("$9");
      expect(t.bodyHtml).toContain("spots left");
      expect(t.bodyHtml).not.toContain("normally $19");
    }
  });
});
```

> Confirm the export names (`templates`, `hybridTemplates`) by checking the bottom of each file; adjust the imports to match the actual exported identifiers.

- [ ] **Step 4: Run it.** Run: `npx vitest run tests/draft/templates.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/lib/draft/templates.ts src/lib/draft/hybrid-templates.ts tests/draft/templates.test.ts
git commit -m "feat(outreach): revert cold-email offer to $9 founding scarcity"
```

---

### Task C2: Remove the discount/deadline plumbing

**Files:**
- Delete: `src/lib/draft/discount.ts`, `src/lib/draft/format-deadline.ts`
- Delete: `tests/draft/discount.test.ts`, `tests/draft/format-deadline.test.ts`
- Modify: `src/lib/draft/render.ts` (`RenderVars` type)
- Modify: `tests/draft/render.test.ts` (remove the two discount-specific tests)
- Modify: `src/lib/pipeline/process-launch.ts` (imports `9-10`; discount block `~107-110`; the two `renderTemplate` calls `~138-149` and `~174-183`)

- [ ] **Step 1: Trim `RenderVars`.** In `src/lib/draft/render.ts`, delete the `discount_code` / `discount_deadline` fields and their comment from the `RenderVars` type:

```ts
export type RenderVars = {
  first_name?: string;
  product_name: string;
  tagline: string;
  website_domain: string;
  sender_first_name: string;
  shipboost_dr: string;
  // Optional — used by hybrid templates that delegate the opener + subject to the LLM.
  personalized_subject?: string;
  personalized_opener?: string;
};
```

(The `substitute()` throw-on-missing behavior stays unchanged.)

- [ ] **Step 2: Update `process-launch.ts`.** Remove the two imports (lines 9-10):

```ts
import { formatDeadline } from "@/lib/draft/format-deadline";
import { getOutreachDiscount } from "@/lib/draft/discount";
```

Remove the discount block (lines ~107-110):

```ts
const discount = getOutreachDiscount();
const discountDeadlineFmt = formatDeadline(discount.deadline);
```

In BOTH `renderTemplate(...)` calls (the hybrid one ~138-149 and the static one ~174-183), delete the two lines:

```ts
  discount_code: discount.code,
  discount_deadline: discountDeadlineFmt,
```

- [ ] **Step 3: Remove the discount-specific render tests.** In `tests/draft/render.test.ts`, delete the two tests: `"renders discount code and deadline into body and text"` and `"throws when a discount template renders without the discount vars"`. (The throw-on-missing behavior is still exercised by real templates needing `product_name` etc.; if you want to keep an explicit guard, rewrite the throw test to omit `product_name` instead of `discount_code`.)

- [ ] **Step 4: Delete the dead modules + their tests.**

```bash
git rm src/lib/draft/discount.ts src/lib/draft/format-deadline.ts \
       tests/draft/discount.test.ts tests/draft/format-deadline.test.ts
```

- [ ] **Step 5: Confirm nothing references the removed symbols.** Run: `grep -rn "getOutreachDiscount\|formatDeadline\|discount_code\|discount_deadline" src/ tests/`. Expected: no matches.

- [ ] **Step 6: Run the full outreach test suite + typecheck.** Run: `npm run test` (or `npx vitest run`) and the repo's typecheck/build command. Expected: PASS / success.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "refactor(outreach): remove LAUNCH9 discount-code and deadline plumbing"
```

---

## Manual operator steps (NOT code — flag in the handoff)

1. **Dodo dashboard:** set the `DODO_PREMIUM_LAUNCH_PRODUCT_ID` product price to **$9**. The app reads the live product price, so this is what actually gets charged. When the 20-spot round sells out, bump it to $19.
2. **`my-app` env (optional):** set `PREMIUM_LAUNCH_ROUND_START` to the real round-open timestamp if different from the `2026-06-30` default. Set it in the deploy env, not just `.env.local`.
3. **`outreach`:** the operator-tunable `SLOTS_LEFT` (default 12) lives in `templates.ts` / `hybrid-templates.ts`. Keep it roughly in sync with the app's founding count.
4. Deprecated outreach env (`PREMIUM_DISCOUNT_CODE`, `DISCOUNT_DEADLINE_DAYS`) are now unused — safe to remove from the env at your leisure.

---

## Self-Review

**Spec coverage:**
- Part 1 (app: ladder → flat $9) → Tasks A1–A4. ✓
- Part 2 (outreach → clean $9) → Tasks C1–C2. ✓
- Part 3 (revenue tracking) → Tasks B1–B2. ✓
- Keep-features constraint → A3 step 4 (LAUNCH9 upsell untouched), C1 step 1 (current template bodies + AI-visibility kept). ✓
- $19 strikethrough anchor kept → A3 step 3, A4 step 3. ✓
- Manual Dodo step flagged → Manual operator steps §1. ✓

**Placeholder scan:** No TBD/TODO. Two spots require the implementer to confirm an exact identifier (the `tx.submission.update` mock handle in B2 step 2; the template export names in C1 step 3) — these are explicit "confirm by inspecting the file" instructions with the fallback named, not vague placeholders.

**Type consistency:** `getRemainingFoundingPremiumLaunchSpots` / `getPaidPremiumLaunchCount` names match across A1/A4. `handlePremiumLaunchPaymentSucceeded` signature in B2 webhook calls matches the service definition. `amountCents`/`discountCode` field names match across schema (B1), service (B2), and test (B2). `RenderVars` field removals (C2) match the tokens removed from templates (C1).
