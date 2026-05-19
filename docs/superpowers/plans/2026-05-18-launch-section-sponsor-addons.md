# Launch Section & Sponsor Add-ons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Schedule your launch" modal with a full `?section=launch` in-page flow that shows premium/free tier cards plus three sponsor placement add-ons as expandable rows, all paid in a single combined Dodo checkout; add auto-save to the submit form.

**Architecture:** The submit form detects `?section=launch` via `useSearchParams` and renders a new `LaunchSection` component instead of the form tabs. A new `launch-bundle-service.ts` owns all combined-checkout logic. A new `POST /api/dodo/checkout/launch-bundle` endpoint handles all four cases (free±sponsors, premium±sponsors). A new `GET /api/dodo/return/launch-bundle` route reconciles payment and redirects to `/dashboard`.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma, Dodo Payments, Zod, Vitest, Tailwind.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/server/services/sponsor-placement-service.ts` | Relax eligibility gate; add `createPendingSponsorPlacements` |
| Create | `src/server/services/launch-bundle-service.ts` | Combined checkout/reconcile business logic |
| Create | `src/server/validators/launch-bundle.ts` | Zod schema for bundle checkout body |
| Modify | `src/server/services/submission-service.ts` | Re-export bundle service functions |
| Create | `src/app/api/dodo/checkout/launch-bundle/route.ts` | POST handler for combined checkout |
| Create | `src/app/api/dodo/return/launch-bundle/route.ts` | GET handler; reconciles & redirects to dashboard |
| Create | `src/components/founder/launch-section.tsx` | Launch tier cards + sponsor add-on rows UI |
| Modify | `src/components/founder/submit-product-form.tsx` | Add auto-save; section nav; render LaunchSection; remove old modal JSX |

---

## Task 1: Relax sponsor eligibility + add `createPendingSponsorPlacements`

**Files:**
- Modify: `src/server/services/sponsor-placement-service.ts`

The current `getSponsorEligibleToolWhere` requires `publicationStatus: PUBLISHED` and `moderationStatus: APPROVED`. We need to allow any tool whose submission has been submitted (past DRAFT stage). We also need a helper that creates multiple pending placement records without creating a Dodo checkout (the checkout is created by the bundle service).

- [ ] **Step 1: Write failing test for relaxed eligibility**

Create test file `src/server/services/launch-bundle.eligibility.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

// We test the behaviour indirectly through listFounderSponsorEligibleTools
// by mocking prisma. The key assertion: a tool with a PENDING submission
// (not DRAFT) is included; a tool with only a DRAFT submission is not.

vi.mock("@/server/db/client", () => ({
  prisma: {
    tool: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/db/client";
import { listFounderSponsorEligibleTools } from "./sponsor-placement-service";

describe("listFounderSponsorEligibleTools", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries tools where submissions.some.reviewStatus is not DRAFT", async () => {
    vi.mocked(prisma.tool.findMany).mockResolvedValue([]);

    await listFounderSponsorEligibleTools("founder-1");

    expect(prisma.tool.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerUserId: "founder-1",
          submissions: {
            some: {
              reviewStatus: { not: "DRAFT" },
            },
          },
        }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/server/services/launch-bundle.eligibility.test.ts
```

Expected: FAIL — the current where clause uses `publicationStatus`/`moderationStatus`, not `submissions.some`.

- [ ] **Step 3: Replace `getSponsorEligibleToolWhere` in `sponsor-placement-service.ts`**

Find lines 36-64 in `src/server/services/sponsor-placement-service.ts`:

```typescript
function getSponsorEligibleToolWhere(founderId: string, now = new Date()) {
  return {
    ownerUserId: founderId,
    publicationStatus: "PUBLISHED" as const,
    moderationStatus: "APPROVED" as const,
    OR: [
      { launches: { none: {} } },
      { launches: { some: getPublicLaunchWhere(now) } },
      { launches: { some: { status: "APPROVED" as const, launchDate: { gt: now } } } },
    ],
  };
}
```

Replace with:

```typescript
function getSponsorEligibleToolWhere(founderId: string) {
  return {
    ownerUserId: founderId,
    submissions: {
      some: {
        reviewStatus: { not: "DRAFT" as const },
      },
    },
  };
}
```

Also remove the unused `getPublicLaunchWhere` import if it's only used here. Check:

```bash
grep -n "getPublicLaunchWhere" src/server/services/sponsor-placement-service.ts
```

If `getPublicLaunchWhere` only appears in the deleted function, remove its import line.

- [ ] **Step 4: Add `createPendingSponsorPlacements` function**

Append to the end of `src/server/services/sponsor-placement-service.ts` (before the last export):

```typescript
export async function createPendingSponsorPlacements(
  toolId: string,
  founderId: string,
  slots: SponsorSlot[],
): Promise<Array<{ slot: SponsorSlot; placementId: string }>> {
  if (slots.length === 0) return [];

  const tool = await prisma.tool.findFirst({
    where: { id: toolId, ...getSponsorEligibleToolWhere(founderId) },
    select: { id: true },
  });

  if (!tool) {
    throw new AppError(400, "Tool is not eligible for sponsor placements.");
  }

  const results: Array<{ slot: SponsorSlot; placementId: string }> = [];

  for (const slot of slots) {
    const slotConfig = getSponsorSlotConfig(slot);

    if (!slotConfig.dodoProductId) {
      throw new AppError(500, `Dodo product for ${slot} sponsor placement is not configured.`);
    }

    if ((await countActiveSponsorPlacements(new Date(), slot)) >= slotConfig.inventoryCap) {
      throw new AppError(409, `${slotConfig.label} sponsor placements are sold out.`);
    }

    const active = await prisma.sponsorPlacement.findFirst({
      where: { toolId, slot, ...getActivePlacementWhere() },
      select: { id: true },
    });

    if (active) {
      throw new AppError(409, `Tool already has an active ${slotConfig.label} sponsor placement.`);
    }

    const placement = await prisma.sponsorPlacement.create({
      data: { toolId, slot, status: "PENDING_PAYMENT" },
      select: { id: true },
    });

    results.push({ slot, placementId: placement.id });
  }

  return results;
}
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
npx vitest run src/server/services/launch-bundle.eligibility.test.ts
```

Expected: PASS

- [ ] **Step 6: Run full test suite to catch regressions**

```bash
npm run test
```

Expected: all existing tests pass (the eligibility change is backward-compatible for sponsors already active — they stay active; new tools are gated by submission status not publication status).

- [ ] **Step 7: Commit**

```bash
git add src/server/services/sponsor-placement-service.ts src/server/services/launch-bundle.eligibility.test.ts
git commit -m "feat: relax sponsor eligibility to submitted tools; add createPendingSponsorPlacements"
```

---

## Task 2: Create `launch-bundle-service.ts` + validator

**Files:**
- Create: `src/server/services/launch-bundle-service.ts`
- Create: `src/server/validators/launch-bundle.ts`

- [ ] **Step 1: Write failing test for bundle service**

Create `src/server/services/launch-bundle-service.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/server/db/client", () => ({ prisma: { submission: { update: vi.fn() }, sponsorPlacement: { update: vi.fn() } } }));
vi.mock("@/server/dodo", () => ({
  getDodoClient: vi.fn(() => ({
    checkoutSessions: {
      create: vi.fn().mockResolvedValue({ checkout_url: "https://pay.dodo.test/checkout", session_id: "sess_1" }),
    },
  })),
  getDodoDashboardReturnUrl: vi.fn(() => "https://app.test/dashboard?checkout=success&submission_id=sub_1"),
}));
vi.mock("@/server/services/submission-service", () => ({
  scheduleFreeSubmissionLaunch: vi.fn().mockResolvedValue({
    submission: { id: "sub_1", submissionType: "FREE_LAUNCH", reviewStatus: "PENDING", paymentStatus: "NOT_REQUIRED", badgeVerification: "PENDING" },
    launch: { id: "launch_1", launchType: "FREE", status: "APPROVED", launchDate: "2026-06-01" },
  }),
}));
vi.mock("@/server/repositories/submission-repository", () => ({
  getSubmissionByIdForFounder: vi.fn().mockResolvedValue({
    id: "sub_1",
    toolId: "tool_1",
    submissionType: "LISTING_ONLY",
    reviewStatus: "DRAFT",
    paymentStatus: "NOT_REQUIRED",
    preferredLaunchDate: null,
  }),
}));
vi.mock("@/server/services/sponsor-placement-service", () => ({
  createPendingSponsorPlacements: vi.fn().mockResolvedValue([]),
  handleSponsorPlacementPaymentSucceeded: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/server/env", () => ({
  getEnv: vi.fn(() => ({
    DODO_PREMIUM_LAUNCH_PRODUCT_ID: "prod_premium",
    NEXT_PUBLIC_APP_URL: "https://app.test",
  })),
}));

import { createLaunchBundleCheckout } from "./launch-bundle-service";
import { scheduleFreeSubmissionLaunch } from "@/server/services/submission-service";

const founder = { id: "founder_1", email: "f@test.com", name: "Founder" };

describe("createLaunchBundleCheckout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("schedules free launch and returns no checkoutUrl when free + no sponsors", async () => {
    const result = await createLaunchBundleCheckout({
      submissionId: "sub_1",
      launchType: "FREE",
      sponsorSlots: [],
      founder,
    });

    expect(scheduleFreeSubmissionLaunch).toHaveBeenCalledWith("sub_1", { id: "founder_1" });
    expect(result.checkoutUrl).toBeNull();
    expect(result.launchScheduled).toBe(true);
    expect(result.scheduledLaunch).toBeDefined();
  });

  it("creates dodo checkout for premium launch", async () => {
    const { getDodoClient } = await import("@/server/dodo");
    const result = await createLaunchBundleCheckout({
      submissionId: "sub_1",
      launchType: "FEATURED",
      preferredLaunchDate: "2026-07-07",
      sponsorSlots: [],
      founder,
    });

    expect(getDodoClient().checkoutSessions.create).toHaveBeenCalled();
    expect(result.checkoutUrl).toBe("https://pay.dodo.test/checkout");
    expect(result.launchScheduled).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm test fails**

```bash
npx vitest run src/server/services/launch-bundle-service.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create validator**

Create `src/server/validators/launch-bundle.ts`:

```typescript
import { z } from "zod";
import { cuidSchema } from "@/server/validators/shared";

export const launchBundleCheckoutSchema = z.object({
  submissionId: cuidSchema,
  launchType: z.enum(["FREE", "FEATURED"]),
  preferredLaunchDate: z.string().optional(),
  sponsorSlots: z
    .array(z.enum(["SIDEBAR", "INLINE_BANNER", "INLINE_PRODUCT"]))
    .default([]),
});

export type LaunchBundleCheckoutInput = z.infer<typeof launchBundleCheckoutSchema>;
```

- [ ] **Step 4: Create `launch-bundle-service.ts`**

Create `src/server/services/launch-bundle-service.ts`:

```typescript
import { prisma } from "@/server/db/client";
import { getDodoClient } from "@/server/dodo";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { getSubmissionByIdForFounder } from "@/server/repositories/submission-repository";
import {
  createPendingSponsorPlacements,
  handleSponsorPlacementPaymentSucceeded,
} from "@/server/services/sponsor-placement-service";
import { getSponsorSlotConfig } from "@/server/services/sponsor-pricing";
import { scheduleFreeSubmissionLaunch } from "@/server/services/submission-service";
import type { SponsorSlot } from "@prisma/client";

type FounderLike = { id: string; email: string; name?: string | null };

function getBundleReturnUrl(opts: {
  submissionId: string;
  placementIds: string[];
  launchType: "FREE" | "FEATURED";
}) {
  const env = getEnv();
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const url = new URL(`${base}/api/dodo/return/launch-bundle`);
  url.searchParams.set("submission_id", opts.submissionId);
  url.searchParams.set("type", opts.launchType);
  if (opts.placementIds.length > 0) {
    url.searchParams.set("placement_ids", opts.placementIds.join(","));
  }
  return url.toString();
}

export async function createLaunchBundleCheckout(input: {
  submissionId: string;
  launchType: "FREE" | "FEATURED";
  preferredLaunchDate?: string;
  sponsorSlots: SponsorSlot[];
  founder: FounderLike;
}) {
  const { submissionId, launchType, preferredLaunchDate, sponsorSlots, founder } = input;

  const submission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );
  if (!submission) throw new AppError(404, "Submission not found.");
  if (!submission.toolId) throw new AppError(400, "Submission has no associated tool.");

  const placements = await createPendingSponsorPlacements(
    submission.toolId,
    founder.id,
    sponsorSlots,
  );

  if (launchType === "FREE") {
    const freeResult = await scheduleFreeSubmissionLaunch(submissionId, {
      id: founder.id,
    });

    if (placements.length === 0) {
      return {
        checkoutUrl: null as null,
        launchScheduled: true,
        scheduledLaunch: freeResult.launch,
        submission: freeResult.submission,
      };
    }

    const checkoutUrl = await createSponsorOnlyCheckout({
      toolId: submission.toolId,
      founder,
      placements,
      submissionId,
    });
    return {
      checkoutUrl,
      launchScheduled: true,
      scheduledLaunch: freeResult.launch,
      submission: freeResult.submission,
    };
  }

  // FEATURED
  if (!preferredLaunchDate) {
    throw new AppError(400, "Preferred launch date is required for premium launches.");
  }

  const checkoutUrl = await createPremiumBundleCheckout({
    submissionId,
    preferredLaunchDate,
    founder,
    placements,
  });

  return {
    checkoutUrl,
    launchScheduled: false,
    scheduledLaunch: null,
    submission: null,
  };
}

async function createSponsorOnlyCheckout(opts: {
  toolId: string;
  founder: FounderLike;
  placements: Array<{ slot: SponsorSlot; placementId: string }>;
  submissionId: string;
}): Promise<string> {
  const productCart = opts.placements.map(({ slot }) => ({
    product_id: getSponsorSlotConfig(slot).dodoProductId!,
    quantity: 1 as const,
  }));

  const returnUrl = getBundleReturnUrl({
    submissionId: opts.submissionId,
    placementIds: opts.placements.map((p) => p.placementId),
    launchType: "FREE",
  });

  const checkout = await getDodoClient().checkoutSessions.create({
    product_cart: productCart,
    customer: { email: opts.founder.email, name: opts.founder.name ?? undefined },
    return_url: returnUrl,
    metadata: {
      shipboostProduct: "launch_bundle",
      shipboostLaunchType: "FREE",
      shipboostSubmissionId: opts.submissionId,
      shipboostSponsorPlacementIds: opts.placements.map((p) => p.placementId).join(","),
    },
  });

  if (!checkout.checkout_url || !checkout.session_id) {
    throw new AppError(500, "Dodo checkout url or session id is missing.");
  }

  for (const { placementId } of opts.placements) {
    await prisma.sponsorPlacement.update({
      where: { id: placementId },
      data: { checkoutSessionId: checkout.session_id },
    });
  }

  return checkout.checkout_url;
}

async function createPremiumBundleCheckout(opts: {
  submissionId: string;
  preferredLaunchDate: string;
  founder: FounderLike;
  placements: Array<{ slot: SponsorSlot; placementId: string }>;
}): Promise<string> {
  const env = getEnv();

  if (!env.DODO_PREMIUM_LAUNCH_PRODUCT_ID) {
    throw new AppError(500, "Dodo premium launch product is not configured.");
  }

  const preferredDate = new Date(opts.preferredLaunchDate);
  if (isNaN(preferredDate.getTime()) || preferredDate <= new Date()) {
    throw new AppError(400, "Choose a future launch week.");
  }

  await prisma.submission.update({
    where: { id: opts.submissionId },
    data: {
      submissionType: "FEATURED_LAUNCH",
      preferredLaunchDate: preferredDate,
      paymentStatus: "PENDING",
    },
  });

  const productCart: Array<{ product_id: string; quantity: 1 }> = [
    { product_id: env.DODO_PREMIUM_LAUNCH_PRODUCT_ID, quantity: 1 },
    ...opts.placements.map(({ slot }) => ({
      product_id: getSponsorSlotConfig(slot).dodoProductId!,
      quantity: 1 as const,
    })),
  ];

  const returnUrl = getBundleReturnUrl({
    submissionId: opts.submissionId,
    placementIds: opts.placements.map((p) => p.placementId),
    launchType: "FEATURED",
  });

  let checkout: Awaited<
    ReturnType<ReturnType<typeof getDodoClient>["checkoutSessions"]["create"]>
  >;

  try {
    checkout = await getDodoClient().checkoutSessions.create({
      product_cart: productCart,
      customer: { email: opts.founder.email, name: opts.founder.name ?? undefined },
      return_url: returnUrl,
      metadata: {
        shipboostProduct: "launch_bundle",
        shipboostLaunchType: "FEATURED",
        shipboostSubmissionId: opts.submissionId,
        shipboostPreferredLaunchDate: preferredDate.toISOString(),
        shipboostSponsorPlacementIds: opts.placements.map((p) => p.placementId).join(","),
      },
    });
  } catch (error) {
    await prisma.submission.update({
      where: { id: opts.submissionId },
      data: { paymentStatus: "NOT_REQUIRED", submissionType: "LISTING_ONLY" },
    });
    for (const { placementId } of opts.placements) {
      await prisma.sponsorPlacement.update({
        where: { id: placementId },
        data: { status: "DISABLED", disabledAt: new Date() },
      });
    }
    throw error;
  }

  if (!checkout.checkout_url || !checkout.session_id) {
    throw new AppError(500, "Dodo checkout url or session id is missing.");
  }

  await prisma.submission.update({
    where: { id: opts.submissionId },
    data: { polarCheckoutId: checkout.session_id },
  });

  for (const { placementId } of opts.placements) {
    await prisma.sponsorPlacement.update({
      where: { id: placementId },
      data: { checkoutSessionId: checkout.session_id },
    });
  }

  return checkout.checkout_url;
}

export async function reconcileLaunchBundlePayment(input: {
  submissionId: string;
  placementIds: string[];
  launchType: "FREE" | "FEATURED";
  paymentId: string;
  founderUserId: string;
}) {
  const dodo = getDodoClient();
  const payment = await dodo.payments.retrieve(input.paymentId);

  if (payment.status !== "succeeded") {
    return null;
  }

  if (input.launchType === "FEATURED") {
    const existing = await prisma.submission.findUnique({
      where: { id: input.submissionId },
      select: { paymentStatus: true },
    });

    if (existing && existing.paymentStatus !== "PAID") {
      const { applyPremiumLaunchPaymentSucceeded } = await import(
        "@/server/services/submission-payment-service"
      );
      await applyPremiumLaunchPaymentSucceeded({
        id: payment.payment_id,
        checkoutSessionId: payment.checkout_session_id ?? null,
        metadata: {
          ...(payment.metadata ?? {}),
          shipboostSubmissionId: input.submissionId,
        },
      });
    }
  }

  for (const placementId of input.placementIds) {
    const placement = await prisma.sponsorPlacement.findUnique({
      where: { id: placementId },
      select: { tool: { select: { ownerUserId: true } } },
    });
    if (!placement || placement.tool.ownerUserId !== input.founderUserId) continue;

    await handleSponsorPlacementPaymentSucceeded({
      paymentId: payment.payment_id,
      checkoutSessionId: payment.checkout_session_id ?? null,
      metadata: { shipboostSponsorPlacementId: placementId },
    });
  }
}
```

> **Note:** `applyPremiumLaunchPaymentSucceeded` is a non-exported internal function in `submission-payment-service.ts`. Before running the test, export it: add `export` to its `async function applyPremiumLaunchPaymentSucceeded` declaration in that file (around line 380-400). Search: `grep -n "applyPremiumLaunchPaymentSucceeded" src/server/services/submission-payment-service.ts`.

- [ ] **Step 5: Export `applyPremiumLaunchPaymentSucceeded` from submission-payment-service.ts**

```bash
grep -n "async function applyPremiumLaunchPaymentSucceeded" src/server/services/submission-payment-service.ts
```

Add `export` before that function declaration. Also re-export it from `submission-service.ts`:

```typescript
// In src/server/services/submission-service.ts, add to the submission-payment-service export block:
export {
  applyPremiumLaunchPaymentSucceeded,
  createPremiumLaunchCheckout,
  ...
} from "@/server/services/submission-payment-service";
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run src/server/services/launch-bundle-service.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 7: Commit**

```bash
git add src/server/services/launch-bundle-service.ts src/server/services/launch-bundle-service.test.ts src/server/validators/launch-bundle.ts src/server/services/submission-payment-service.ts src/server/services/submission-service.ts
git commit -m "feat: add launch-bundle service with combined checkout logic"
```

---

## Task 3: Checkout route + return route

**Files:**
- Create: `src/app/api/dodo/checkout/launch-bundle/route.ts`
- Create: `src/app/api/dodo/return/launch-bundle/route.ts`

- [ ] **Step 1: Create checkout route**

Create `src/app/api/dodo/checkout/launch-bundle/route.ts`:

```typescript
import type { NextRequest } from "next/server";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { createLaunchBundleCheckout } from "@/server/services/launch-bundle-service";
import { launchBundleCheckoutSchema } from "@/server/validators/launch-bundle";
import { premiumLaunchAvailable, premiumLaunchUnavailableMessage } from "@/lib/premium-launch";
import { AppError } from "@/server/http/app-error";

export async function POST(request: NextRequest) {
  try {
    getEnv();

    const session = await requireSession(request);
    const body = launchBundleCheckoutSchema.parse(await request.json());

    if (body.launchType === "FEATURED" && !premiumLaunchAvailable) {
      throw new AppError(503, premiumLaunchUnavailableMessage);
    }

    const result = await createLaunchBundleCheckout({
      submissionId: body.submissionId,
      launchType: body.launchType,
      preferredLaunchDate: body.preferredLaunchDate,
      sponsorSlots: body.sponsorSlots,
      founder: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });

    if (result.launchScheduled) {
      revalidateAllPublicContent();
    }

    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Create return route**

Create `src/app/api/dodo/return/launch-bundle/route.ts`:

```typescript
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getServerSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { reconcileLaunchBundlePayment } from "@/server/services/launch-bundle-service";
import { revalidateAllPublicContent } from "@/server/cache/public-content";

export async function GET(request: NextRequest) {
  const env = getEnv();
  const url = new URL(request.url);

  const submissionId = url.searchParams.get("submission_id") ?? "";
  const launchType = (url.searchParams.get("type") ?? "FREE") as "FREE" | "FEATURED";
  const rawPlacementIds = url.searchParams.get("placement_ids") ?? "";
  const paymentId = url.searchParams.get("payment_id") ?? "";

  const placementIds = rawPlacementIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const dashboardBase = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/dashboard`;
  const successUrl = new URL(dashboardBase);
  successUrl.searchParams.set("checkout", "success");
  if (submissionId) successUrl.searchParams.set("submission_id", submissionId);
  if (paymentId) successUrl.searchParams.set("payment_id", paymentId);

  const errorUrl = new URL(dashboardBase);
  errorUrl.searchParams.set("checkout", "error");

  try {
    const session = await getServerSession();

    if (session && paymentId) {
      await reconcileLaunchBundlePayment({
        submissionId,
        placementIds,
        launchType,
        paymentId,
        founderUserId: session.user.id,
      });
      revalidateAllPublicContent();
    }
  } catch {
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(successUrl);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -E "launch-bundle" | head -20
```

Expected: no errors for the new files.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/dodo/checkout/launch-bundle/route.ts src/app/api/dodo/return/launch-bundle/route.ts
git commit -m "feat: add launch-bundle checkout and return routes"
```

---

## Task 4: Build `LaunchSection` component

**Files:**
- Create: `src/components/founder/launch-section.tsx`

This component replaces the old schedule modal. It shows a premium tier card (default/highlighted), a free tier card with estimated date, and three sponsor add-on rows with expandable dropdowns showing detailed benefits. State: selected launch type, preferred date, selected sponsor slots, expanded slot, loading flag.

- [ ] **Step 1: Create the component**

Create `src/components/founder/launch-section.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Flame,
  Zap,
  CheckCircle2,
  XCircle,
  Calendar,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SponsorEligibilitySlot } from "@/app/api/sponsor/eligibility/route";

type PremiumLaunchWeek = { value: string; label: string };

type ScheduledLaunch = {
  id: string;
  launchType: "FREE" | "FEATURED";
  status: string;
  launchDate: string;
};

type SavedSubmission = {
  id: string;
  toolId?: string;
  submissionType: string;
  reviewStatus: string;
  paymentStatus: string;
  badgeVerification: string;
};

export type LaunchSectionProps = {
  submissionId: string;
  toolId: string | null;
  freeLaunchEstimateDate: string | null;
  premiumLaunchWeeks: PremiumLaunchWeek[];
  foundingPremiumSpotsLeft: number;
  foundingPremiumLaunchLimit: number;
  currentScheduledLaunch: ScheduledLaunch | null;
  isPremiumScheduled: boolean;
  isFreeScheduled: boolean;
  onBack: () => void;
  onFreeScheduled: (launch: ScheduledLaunch, submission: SavedSubmission) => void;
};

const PREMIUM_FEATURES = [
  "Instant publish — go live immediately",
  "Top of home placement for your launch week",
  "14 days featured on the homepage",
  "Editorial spotlight brief shared with newsletter",
  "Dofollow backlink (DR 70+)",
  "Premium verified badge",
  "Priority support",
];

const FREE_INCLUDES = [
  "Basic listing in the directory",
  "Scheduled slot in the launch queue",
  "Badge verification required",
];

const FREE_NOT_INCLUDED = [
  "Instant publish",
  "Top placement",
  "Editorial spotlight",
  "Premium badge",
];

const SLOT_BENEFITS: Record<string, string[]> = {
  SIDEBAR: [
    "Persistent card on every discovery page (home, categories, tags, launchboards)",
    "Rotates with other sidebar sponsors — always visible",
    "Your logo, product name, and tagline",
    "30 days of placement",
    "Best reach across all page types",
  ],
  INLINE_BANNER: [
    "Animated inline banner injected directly in the launchboard feed",
    "Hard to miss — stops the scroll",
    "Founders actively browsing launches see it",
    "30 days of placement",
  ],
  INLINE_PRODUCT: [
    "Native-style product row that looks organic in the feed",
    "Founders read it — no banner blindness",
    "Your logo, name, tagline, and link",
    "30 days of placement",
  ],
};

function getLaunchWeekDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function LaunchSection({
  submissionId,
  toolId,
  freeLaunchEstimateDate,
  premiumLaunchWeeks,
  foundingPremiumSpotsLeft,
  foundingPremiumLaunchLimit,
  currentScheduledLaunch,
  isPremiumScheduled,
  isFreeScheduled,
  onBack,
  onFreeScheduled,
}: LaunchSectionProps) {
  const [selectedLaunch, setSelectedLaunch] = useState<"FREE" | "FEATURED">("FEATURED");
  const [preferredDate, setPreferredDate] = useState<string>(
    premiumLaunchWeeks[0]?.value ?? "",
  );
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<SponsorEligibilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toolId) return;
    fetch("/api/sponsor/eligibility")
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.slots) setSlots(data.data.slots as SponsorEligibilitySlot[]);
      })
      .catch(() => {});
  }, [toolId]);

  function toggleSlot(slot: string) {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  }

  const selectedSponsorPrice = slots
    .filter((s) => selectedSlots.includes(s.slot))
    .reduce((sum, s) => sum + s.priceUsd, 0);

  const premiumPrice = foundingPremiumSpotsLeft > 0 ? 9 : 19;
  const totalPrice =
    selectedLaunch === "FEATURED"
      ? premiumPrice + selectedSponsorPrice
      : selectedSponsorPrice;

  async function handleConfirm() {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/dodo/checkout/launch-bundle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionId,
          launchType: selectedLaunch,
          preferredLaunchDate: selectedLaunch === "FEATURED" ? preferredDate : undefined,
          sponsorSlots: selectedSlots,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Something went wrong.");
      }

      const data = payload.data as {
        checkoutUrl: string | null;
        launchScheduled: boolean;
        scheduledLaunch: ScheduledLaunch | null;
        submission: SavedSubmission | null;
      };

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.launchScheduled && data.scheduledLaunch && data.submission) {
        onFreeScheduled(data.scheduledLaunch, data.submission);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  const spotsLabel =
    foundingPremiumSpotsLeft > 0
      ? `${foundingPremiumSpotsLeft} of ${foundingPremiumLaunchLimit} founding spots left`
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h2 className="text-xl font-black text-foreground">Launch your product</h2>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Launch tier cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Premium card */}
        <button
          type="button"
          onClick={() => setSelectedLaunch("FEATURED")}
          className={cn(
            "relative rounded-2xl border-2 p-5 text-left transition",
            selectedLaunch === "FEATURED"
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40",
          )}
        >
          {selectedLaunch === "FEATURED" && (
            <span className="absolute -top-3 left-4 rounded-full bg-primary px-3 py-0.5 text-xs font-black text-primary-foreground">
              Selected
            </span>
          )}
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-orange-500" />
            <span className="font-black text-foreground">Premium Launch</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Maximum visibility, instant publish</p>
          <div className="mt-4 space-y-1.5">
            {PREMIUM_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2 text-xs text-foreground">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-primary" />
                {f}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            {foundingPremiumSpotsLeft > 0 && (
              <span className="text-sm text-muted-foreground line-through">$19</span>
            )}
            <span className="text-2xl font-black text-foreground">${premiumPrice}</span>
          </div>
          {spotsLabel && (
            <p className="mt-1 text-xs font-medium text-orange-500">{spotsLabel}</p>
          )}
        </button>

        {/* Free card */}
        <button
          type="button"
          onClick={() => setSelectedLaunch("FREE")}
          className={cn(
            "relative rounded-2xl border-2 p-5 text-left transition",
            selectedLaunch === "FREE"
              ? "border-border bg-muted/30 ring-1 ring-border"
              : "border-border bg-card hover:border-border",
          )}
        >
          {selectedLaunch === "FREE" && (
            <span className="absolute -top-3 left-4 rounded-full bg-muted px-3 py-0.5 text-xs font-black text-muted-foreground border border-border">
              Selected
            </span>
          )}
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-muted-foreground" />
            <span className="font-black text-foreground">Free Launch</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Community scheduling, badge required</p>

          {freeLaunchEstimateDate && (
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <Calendar size={12} />
              Estimated slot:{" "}
              <span className="font-semibold text-foreground">
                {getLaunchWeekDate(freeLaunchEstimateDate)}
              </span>
            </div>
          )}

          <div className="mt-4 space-y-1.5">
            {FREE_INCLUDES.map((f) => (
              <div key={f} className="flex items-start gap-2 text-xs text-foreground">
                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-green-500" />
                {f}
              </div>
            ))}
            {FREE_NOT_INCLUDED.map((f) => (
              <div key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                <XCircle size={12} className="mt-0.5 shrink-0 text-muted-foreground/50" />
                {f}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-foreground">Free</span>
          </div>
        </button>
      </div>

      {/* Premium date picker */}
      {selectedLaunch === "FEATURED" && premiumLaunchWeeks.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <label className="block text-sm font-bold text-foreground mb-2">
            Choose your preferred launch week
          </label>
          <select
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {premiumLaunchWeeks.map((week) => (
              <option key={week.value} value={week.value}>
                {week.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sponsor add-ons */}
      {slots.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-black text-foreground">Boost your launch</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Optional sponsor placements — added at checkout
            </p>
          </div>

          {slots.map((slotInfo) => {
            const isSelected = selectedSlots.includes(slotInfo.slot);
            const isExpanded = expandedSlot === slotInfo.slot;
            const benefits = SLOT_BENEFITS[slotInfo.slot] ?? [];

            return (
              <div
                key={slotInfo.slot}
                className={cn(
                  "rounded-xl border transition",
                  isSelected ? "border-primary bg-primary/5" : "border-border bg-card",
                  slotInfo.soldOut && "opacity-50",
                )}
              >
                <div className="flex items-center gap-3 p-4">
                  <input
                    type="checkbox"
                    id={`slot-${slotInfo.slot}`}
                    checked={isSelected}
                    disabled={slotInfo.soldOut}
                    onChange={() => toggleSlot(slotInfo.slot)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <label
                    htmlFor={`slot-${slotInfo.slot}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{slotInfo.label}</span>
                      {slotInfo.soldOut && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-muted-foreground">
                          SOLD OUT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {slotInfo.description}
                    </p>
                  </label>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black text-foreground">
                      ${slotInfo.priceUsd}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedSlot(isExpanded ? null : slotInfo.slot)}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <BarChart2 size={13} className="text-primary" />
                      <span className="text-xs font-bold text-foreground">What's included</span>
                    </div>
                    <ul className="space-y-1.5">
                      {benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-primary" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Availability: </span>
                      {slotInfo.inventoryCap - slotInfo.activeCount} of {slotInfo.inventoryCap} spots open
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Total + CTA */}
      <div className="sticky bottom-0 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            {selectedLaunch === "FEATURED" ? "Premium Launch" : "Free Launch"}
            {selectedSlots.length > 0 ? ` + ${selectedSlots.length} placement${selectedSlots.length > 1 ? "s" : ""}` : ""}
          </span>
          <span className="text-lg font-black text-foreground">
            {totalPrice === 0 ? "Free" : `$${totalPrice}`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={isLoading || (selectedLaunch === "FEATURED" && !preferredDate)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : selectedLaunch === "FREE" && selectedSlots.length === 0 ? (
            "Schedule free launch"
          ) : (
            `Continue to checkout — ${totalPrice === 0 ? "Free" : `$${totalPrice}`}`
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "launch-section" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/founder/launch-section.tsx
git commit -m "feat: add LaunchSection component with launch tiers and sponsor add-on rows"
```

---

## Task 5: Integrate LaunchSection + auto-save into submit form

**Files:**
- Modify: `src/components/founder/submit-product-form.tsx`

Four changes in one commit:
1. **Auto-save** — debounced `useEffect` watching `form` state, fires only when `logo?.asset` exists
2. **Section navigation** — `useSearchParams` + push `?section=launch`  
3. **Render LaunchSection** — when `section === "launch"` render the new component instead of tabs  
4. **Remove old modal** — delete the schedule modal JSX (lines ~1160-1371) and its state variables

- [ ] **Step 1: Add `useSearchParams` import and section-reading logic**

In `submit-product-form.tsx`, locate the imports block (line ~1-20). Add:

```typescript
import { useSearchParams } from "next/navigation";
```

Locate where `const router = useRouter();` is (line ~457). Add directly below:

```typescript
const searchParams = useSearchParams();
const activeSection = searchParams.get("section");
```

- [ ] **Step 2: Add auto-save via debounced useEffect**

After all existing `useState` declarations (after line ~521), add:

```typescript
const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const saveDraftFnRef = useRef(saveDraft);
const logoRef = useRef(logo);
const isBusyRef = useRef(isBusy);

useEffect(() => { saveDraftFnRef.current = saveDraft; });
useEffect(() => { logoRef.current = logo; });
useEffect(() => { isBusyRef.current = isBusy; });

useEffect(() => {
  if (!logoRef.current?.asset) return;
  if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
  autoSaveRef.current = setTimeout(() => {
    if (!logoRef.current?.asset || isBusyRef.current) return;
    saveDraftFnRef.current().catch(() => {});
  }, 800);
  return () => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [form]);
```

Also add `useRef` to the React import at the top of the file if not already present:

```typescript
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
```

Check if `useRef` and `useEffect` are already imported:
```bash
head -10 src/components/founder/submit-product-form.tsx
```

- [ ] **Step 3: Add `handleNavigateToLaunch` function**

After `handleOpenScheduleModal` (line ~830), add:

```typescript
async function handleNavigateToLaunch() {
  setErrorMessage(null);

  if (incompleteChecklistItems.length > 0) {
    setErrorMessage(`Please complete: ${incompleteChecklistItems.join(", ")}.`);
    return;
  }

  try {
    await saveDraft({
      submissionType: isPremiumScheduled ? "FEATURED_LAUNCH" : form.submissionType,
    });
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", "launch");
    router.push(`?${params.toString()}`);
  } catch (error) {
    setErrorMessage(getErrorMessage(error, "Unable to save before scheduling."));
  }
}
```

- [ ] **Step 4: Replace the "Schedule your launch" button**

Find the existing button at line ~1541-1549:

```tsx
<button
  type="button"
  onClick={() => void handleOpenScheduleModal()}
  disabled={isBusy || !requiredFieldsComplete}
  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
>
  {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
  Schedule your launch
</button>
```

Replace with:

```tsx
<button
  type="button"
  onClick={() => void handleNavigateToLaunch()}
  disabled={isBusy || !requiredFieldsComplete}
  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
>
  {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
  Schedule your launch
</button>
```

(Button text/style unchanged — just the `onClick` changes.)

- [ ] **Step 5: Add LaunchSection import and conditional render**

Add import near other component imports (top of file):

```typescript
import { LaunchSection } from "@/components/founder/launch-section";
```

Find the main return statement — the component renders a large JSX tree. Locate where the tabs and main content start (approximately where `<div className="... grid ...">` wraps the left column and right sidebar). Add at the very beginning of the return block, before existing JSX:

```tsx
if (activeSection === "launch" && draftSubmissionId) {
  return (
    <LaunchSection
      submissionId={draftSubmissionId}
      toolId={toolId}
      freeLaunchEstimateDate={freeLaunchEstimateDate ?? null}
      premiumLaunchWeeks={premiumLaunchWeeks}
      foundingPremiumSpotsLeft={foundingPremiumLaunchSpotsLeft}
      foundingPremiumLaunchLimit={foundingPremiumLaunchLimit}
      currentScheduledLaunch={currentScheduledLaunch}
      isPremiumScheduled={isPremiumScheduled}
      isFreeScheduled={isFreeScheduled}
      onBack={() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("section");
        router.push(`?${params.toString()}`);
      }}
      onFreeScheduled={(launch, submission) => {
        setLastSavedDraft({
          id: submission.id,
          submissionType: submission.submissionType as never,
          reviewStatus: submission.reviewStatus as never,
          paymentStatus: submission.paymentStatus as never,
          badgeVerification: submission.badgeVerification as never,
        });
        setDraftSubmissionId(submission.id);
        setCurrentScheduledLaunch(launch);
        const params = new URLSearchParams(searchParams.toString());
        params.delete("section");
        router.push(`?${params.toString()}`);
        setBadgePromptSubmissionId(submission.id);
        setIsBadgePromptOpen(true);
      }}
    />
  );
}
```

- [ ] **Step 6: Remove the old schedule modal JSX and its state**

The old schedule modal lives between approximately lines 1160 and 1371 of `submit-product-form.tsx`. It is wrapped in an `{isScheduleModalOpen && (...)}` conditional. Delete the entire block.

Remove the now-unused state declarations (around lines 477-484):
- `isScheduleModalOpen` / `setIsScheduleModalOpen`
- `scheduleModalView` / `setScheduleModalView`  
- `premiumLaunchMonthIndex` / `setPremiumLaunchMonthIndex`

Remove the `useBodyScrollLock` argument `isScheduleModalOpen` (replace with just `isDeleteModalOpen || isBadgePromptOpen`).

Remove functions that are no longer called from anywhere else (check with grep first):
```bash
grep -n "handleOpenScheduleModal\|handleJoinFreeQueue\|handlePremiumLaunch\|choosePremiumDate" src/components/founder/submit-product-form.tsx
```

If `handleOpenScheduleModal`, `handleJoinFreeQueue`, `handlePremiumLaunch`, `choosePremiumDate` are only referenced in the now-deleted modal JSX and nowhere else, delete those functions too.

Remove `premiumLaunchMonths`, `visiblePremiumLaunchMonth`, `foundingPremiumSpotsLabel` derived values if no longer used (check with grep):
```bash
grep -n "premiumLaunchMonths\|visiblePremiumLaunchMonth\|foundingPremiumSpotsLabel" src/components/founder/submit-product-form.tsx
```

- [ ] **Step 7: Verify TypeScript and lint**

```bash
npx tsc --noEmit 2>&1 | grep "submit-product-form" | head -20
npm run lint 2>&1 | grep "submit-product-form" | head -20
```

Fix any errors. Common issues:
- Unused imports (`CalendarDays` may still be needed by the button)
- Unused variable warnings from removed state
- The `ScheduledLaunch` type may need the `"FREE" | "FEATURED"` union if it previously used `LaunchType` — check the import

- [ ] **Step 8: Run full test suite**

```bash
npm run test
```

Expected: all tests pass. The `submit-product-form.test.tsx` file may have tests for the modal — update them to test the new `?section=launch` navigation instead.

- [ ] **Step 9: Commit**

```bash
git add src/components/founder/submit-product-form.tsx
git commit -m "feat: replace schedule modal with section-nav launch flow; add auto-save"
```

---

## Self-Review Checklist

| Requirement | Covered in |
|---|---|
| Auto-save on field change | Task 5, Step 2 |
| `?section=launch` URL-based nav | Task 5, Steps 1, 3, 4, 5 |
| Premium as default tier | Task 4 — `useState("FEATURED")` default |
| Free tier with estimated date | Task 4 — `freeLaunchEstimateDate` display |
| 3 sponsor add-ons with expand/collapse | Task 4 — slot rows with `expandedSlot` state |
| Combined single checkout | Task 2/3 — `createLaunchBundleCheckout`, `POST /api/dodo/checkout/launch-bundle` |
| Free + sponsors in one payment | Task 2 — `createSponsorOnlyCheckout` for free+sponsors |
| Premium + sponsors in one payment | Task 2 — `createPremiumBundleCheckout` with multi-item `product_cart` |
| Sponsor eligible on submit (not just approval) | Task 1 — `getSponsorEligibleToolWhere` change |
| Bundle return reconciliation | Task 3 — `GET /api/dodo/return/launch-bundle` |
| Badge prompt preserved for free launches | Task 5, Step 5 — `onFreeScheduled` callback |
