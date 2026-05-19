# Multi-Tier Sponsor Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing sidebar-only sponsor placement system to support three tiers — SIDEBAR ($59), INLINE_BANNER ($49), INLINE_PRODUCT ($29) — with separate inventory caps, Dodo products, and UI for each.

**Architecture:** The `SponsorSlot` enum and `slot` column already exist in the DB (migration applied). Service, API, cache, and UI layers all need slot-awareness threaded through them. Each placement surface gets its own pre-locked modal (no tier picker) — `SponsorAdvertiseModal` gains a required `slot` prop that drives all copy and logic. Inline components conditionally render real placement data vs. house ads.

**Tech Stack:** Next.js 16 App Router, Prisma (Postgres/Neon), Dodo Payments, React 19, Vitest, TypeScript

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/server/services/sponsor-pricing.ts` | Per-slot config (label, price, cap, Dodo product ID) |
| Modify | `src/server/env.ts` | Add `DODO_SPONSOR_BANNER_PRODUCT_ID`, `DODO_SPONSOR_PRODUCT_AD_PRODUCT_ID` |
| Modify | `.env.example` | Document new env vars |
| Modify | `.env.production.example` | Document new env vars |
| Modify | `src/server/services/sponsor-placement-service.ts` | Slot-aware service layer |
| Modify | `src/app/api/sponsor/eligibility/route.ts` | Per-slot eligibility response |
| Modify | `src/server/validators/sponsor-placement.ts` | Add `slot` field to checkout schema |
| Modify | `src/app/api/dodo/checkout/sponsor-placement/route.ts` | Pass `slot` to service |
| Modify | `src/app/api/sponsor/return/route.ts` | Forward `placement_slot` in redirect URL |
| Modify | `src/server/cache/public-content.ts` | `getCachedActiveSponsorPlacements` accepts optional slot param |
| Modify | `src/components/public/showcase-layout.tsx` | Pass `"SIDEBAR"` slot to cache call |
| Modify | `src/components/public/launchpad-showcase.tsx` | Async server component; fetch inline placements |
| Modify | `src/components/public/inline-sponsor-banner.tsx` | Accept `placement` prop; render real data; pass `slot="INLINE_BANNER"` to modal |
| Modify | `src/components/public/inline-product-ad.tsx` | Accept `placement` prop; render real data; pass `slot="INLINE_PRODUCT"` to modal |
| Modify | `src/components/public/sidebar-sponsor-placements.tsx` | Pass `slot="SIDEBAR"` to all `SponsorAdvertiseModal` usages |
| Modify | `src/components/public/sponsor-advertise-modal.tsx` | Replace tier picker with `slot` prop; per-slot copy, price, sold-out |

---

## Task 1: Add env vars and create sponsor-pricing.ts

**Files:**
- Modify: `src/server/env.ts`
- Modify: `.env.example`
- Modify: `.env.production.example`
- Create: `src/server/services/sponsor-pricing.ts`

- [ ] **Step 1: Add two new env vars to src/server/env.ts**

In the `envSchema` object, directly after the `DODO_SPONSOR_PLACEMENT_PRODUCT_ID` line (line 48), add:

```typescript
  DODO_SPONSOR_BANNER_PRODUCT_ID: optionalEnvString,
  DODO_SPONSOR_PRODUCT_AD_PRODUCT_ID: optionalEnvString,
```

In the `envSchema.parse({...})` call body, directly after `DODO_SPONSOR_PLACEMENT_PRODUCT_ID: process.env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID,`, add:

```typescript
      DODO_SPONSOR_BANNER_PRODUCT_ID: process.env.DODO_SPONSOR_BANNER_PRODUCT_ID,
      DODO_SPONSOR_PRODUCT_AD_PRODUCT_ID: process.env.DODO_SPONSOR_PRODUCT_AD_PRODUCT_ID,
```

- [ ] **Step 2: Document env vars in .env.example**

In `.env.example`, directly after the `DODO_PREMIUM_LAUNCH_PRODUCT_ID=""` line, add:

```
DODO_SPONSOR_PLACEMENT_PRODUCT_ID=""
DODO_SPONSOR_BANNER_PRODUCT_ID=""
DODO_SPONSOR_PRODUCT_AD_PRODUCT_ID=""
```

(Note: `DODO_SPONSOR_PLACEMENT_PRODUCT_ID` is missing from .env.example — add all three.)

- [ ] **Step 3: Document env vars in .env.production.example**

Same as Step 2 but in `.env.production.example`, after the `DODO_PREMIUM_LAUNCH_PRODUCT_ID=""` line.

- [ ] **Step 4: Create src/server/services/sponsor-pricing.ts**

```typescript
import { getEnv } from "@/server/env";
import type { SponsorSlot } from "@prisma/client";

export type SponsorSlotConfig = {
  slot: SponsorSlot;
  label: string;
  description: string;
  priceUsd: number;
  inventoryCap: number;
  dodoProductId: string | undefined;
};

export function getSponsorSlotConfig(slot: SponsorSlot): SponsorSlotConfig {
  const env = getEnv();
  switch (slot) {
    case "SIDEBAR":
      return {
        slot: "SIDEBAR",
        label: "Sidebar",
        description:
          "Persistent slot on every discovery page (home, categories, tags, launchboards).",
        priceUsd: 59,
        inventoryCap: 3,
        dodoProductId: env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID,
      };
    case "INLINE_BANNER":
      return {
        slot: "INLINE_BANNER",
        label: "Banner",
        description: "Inline banner in the launchboard feed. Animated, hard to miss.",
        priceUsd: 49,
        inventoryCap: 1,
        dodoProductId: env.DODO_SPONSOR_BANNER_PRODUCT_ID,
      };
    case "INLINE_PRODUCT":
      return {
        slot: "INLINE_PRODUCT",
        label: "Product ad",
        description: "Native-style row in the launchboard feed.",
        priceUsd: 29,
        inventoryCap: 2,
        dodoProductId: env.DODO_SPONSOR_PRODUCT_AD_PRODUCT_ID,
      };
  }
}

export const ALL_SPONSOR_SLOTS: SponsorSlot[] = [
  "SIDEBAR",
  "INLINE_BANNER",
  "INLINE_PRODUCT",
];
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```

Expected: no errors related to the new files.

- [ ] **Step 6: Commit**

```bash
git add src/server/env.ts src/server/services/sponsor-pricing.ts .env.example .env.production.example
git commit -m "feat: add env vars and sponsor-pricing config for multi-tier placements"
```

---

## Task 2: Update sponsor-placement-service.ts (slot-aware service layer)

**Files:**
- Modify: `src/server/services/sponsor-placement-service.ts`

This task rewrites key functions in the service to be slot-aware. Read the full file before editing.

- [ ] **Step 1: Add import for sponsor-pricing at top of service file**

After the existing imports, add:

```typescript
import {
  getSponsorSlotConfig,
  ALL_SPONSOR_SLOTS,
} from "@/server/services/sponsor-pricing";
import type { SponsorSlot } from "@prisma/client";
```

- [ ] **Step 2: Remove SPONSOR_SLOT_LIMIT constant and update getActivePlacementWhere**

Remove the line:
```typescript
const SPONSOR_SLOT_LIMIT = 3;
```

Update `getActivePlacementWhere` to accept an optional slot:

```typescript
function getActivePlacementWhere(now = new Date(), slot?: SponsorSlot) {
  return {
    status: "ACTIVE" as const,
    disabledAt: null,
    endsAt: { gt: now },
    ...(slot ? { slot } : {}),
  };
}
```

- [ ] **Step 3: Update countActiveSponsorPlacements to accept optional slot**

Replace:
```typescript
export async function countActiveSponsorPlacements(now = new Date()) {
  return prisma.sponsorPlacement.count({
    where: getActivePlacementWhere(now),
  });
}
```

With:
```typescript
export async function countActiveSponsorPlacements(
  now = new Date(),
  slot?: SponsorSlot,
) {
  return prisma.sponsorPlacement.count({
    where: getActivePlacementWhere(now, slot),
  });
}
```

- [ ] **Step 4: Add countActiveSponsorPlacementsBySlot helper**

Add this new export after `countActiveSponsorPlacements`:

```typescript
export async function countActiveSponsorPlacementsBySlot(
  now = new Date(),
): Promise<Record<SponsorSlot, number>> {
  const counts = await prisma.sponsorPlacement.groupBy({
    by: ["slot"],
    where: getActivePlacementWhere(now),
    _count: { id: true },
  });

  const result: Record<SponsorSlot, number> = {
    SIDEBAR: 0,
    INLINE_BANNER: 0,
    INLINE_PRODUCT: 0,
  };

  for (const row of counts) {
    result[row.slot] = row._count.id;
  }

  return result;
}
```

- [ ] **Step 5: Update listFounderSponsorEligibleTools to return activeSlots per tool**

Replace the `sponsorPlacements` select inside `listFounderSponsorEligibleTools`:

```typescript
// Old:
sponsorPlacements: {
  where: getActivePlacementWhere(),
  select: { id: true, endsAt: true },
  take: 1,
},

// New:
sponsorPlacements: {
  where: getActivePlacementWhere(),
  select: { slot: true },
},
```

The function signature and orderBy stay the same. The return shape now has `sponsorPlacements: { slot: SponsorSlot }[]` instead of `{ id, endsAt }[]`.

- [ ] **Step 6: Update listActiveSponsorPlacements to accept slot param**

Replace:
```typescript
export async function listActiveSponsorPlacements(now = new Date()) {
  return prisma.sponsorPlacement.findMany({
    where: {
      ...getVisiblePlacementWhere(now),
      tool: {
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
      },
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      tool: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          websiteUrl: true,
          affiliateUrl: true,
          logoMedia: { select: { url: true } },
          toolCategories: {
            select: { category: { select: { name: true, slug: true } } },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { startsAt: "asc" },
    take: SPONSOR_SLOT_LIMIT,
  });
}
```

With:
```typescript
export async function listActiveSponsorPlacements(
  slot?: SponsorSlot,
  now = new Date(),
) {
  const config = slot ? getSponsorSlotConfig(slot) : null;
  return prisma.sponsorPlacement.findMany({
    where: {
      ...getVisiblePlacementWhere(now, slot),
      tool: {
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
      },
    },
    select: {
      id: true,
      slot: true,
      startsAt: true,
      endsAt: true,
      tool: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          websiteUrl: true,
          affiliateUrl: true,
          logoMedia: { select: { url: true } },
          toolCategories: {
            select: { category: { select: { name: true, slug: true } } },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { startsAt: "asc" },
    ...(config ? { take: config.inventoryCap } : {}),
  });
}
```

Note: `getVisiblePlacementWhere` also needs the slot param — update it:
```typescript
function getVisiblePlacementWhere(now = new Date(), slot?: SponsorSlot) {
  return getActivePlacementWhere(now, slot);
}
```

- [ ] **Step 7: Update createSponsorPlacementCheckout to accept slot**

Replace the function signature and body. Full replacement:

```typescript
export async function createSponsorPlacementCheckout(
  toolId: string,
  founder: FounderLike,
  slot: SponsorSlot = "SIDEBAR",
) {
  const slotConfig = getSponsorSlotConfig(slot);

  if (!slotConfig.dodoProductId) {
    throw new AppError(
      500,
      `Dodo product for ${slot} sponsor placement is not configured.`,
    );
  }

  const tool = await prisma.tool.findFirst({
    where: {
      id: toolId,
      ...getSponsorEligibleToolWhere(founder.id),
      sponsorPlacements: {
        none: getActivePlacementWhere(new Date(), slot),
      },
    },
    select: {
      id: true,
      name: true,
      launches: {
        select: {
          status: true,
          launchDate: true,
        },
      },
    },
  });

  if (!tool) {
    throw new AppError(
      400,
      "Tool is not eligible for this sponsor placement tier.",
    );
  }

  if ((await countActiveSponsorPlacements(new Date(), slot)) >= slotConfig.inventoryCap) {
    throw new AppError(409, `${slotConfig.label} sponsor placements are sold out.`);
  }

  const placement = await prisma.sponsorPlacement.create({
    data: {
      toolId: tool.id,
      slot,
      status: "PENDING_PAYMENT",
    },
    select: { id: true },
  });

  let checkout: Awaited<
    ReturnType<ReturnType<typeof getDodoClient>["checkoutSessions"]["create"]>
  >;

  try {
    checkout = await getDodoClient().checkoutSessions.create({
      product_cart: [
        {
          product_id: slotConfig.dodoProductId,
          quantity: 1,
        },
      ],
      customer: {
        email: founder.email,
        name: founder.name ?? undefined,
      },
      return_url: getDodoSponsorPlacementReturnUrl(placement.id),
      metadata: {
        shipboostProduct: "sponsor_placement",
        shipboostToolId: tool.id,
        shipboostSponsorPlacementId: placement.id,
        shipboostSponsorSlot: slot,
      },
    });
  } catch (error) {
    await prisma.sponsorPlacement.update({
      where: { id: placement.id },
      data: {
        status: "DISABLED",
        disabledAt: new Date(),
      },
    });
    throw error;
  }

  if (!checkout.checkout_url || !checkout.session_id) {
    throw new AppError(
      500,
      "Dodo checkout url or session id is missing from the session response.",
    );
  }

  await prisma.sponsorPlacement.update({
    where: { id: placement.id },
    data: { checkoutSessionId: checkout.session_id },
  });

  return {
    checkoutUrl: checkout.checkout_url,
    checkoutId: checkout.session_id,
  };
}
```

- [ ] **Step 8: Update handleSponsorPlacementPaymentSucceeded to use per-slot cap**

The placement lookups need `slot` in their select. Update both findUnique calls and both update calls. The `slot` on an existing placement must drive the cap check.

Find the two `prisma.sponsorPlacement.findUnique` calls inside `handleSponsorPlacementPaymentSucceeded`. Both use:
```typescript
select: {
  id: true,
  status: true,
  startsAt: true,
  tool: { select: { launches: { select: { status: true, launchDate: true } } } },
}
```

Change both to also select `slot: true`:
```typescript
select: {
  id: true,
  slot: true,
  status: true,
  startsAt: true,
  tool: { select: { launches: { select: { status: true, launchDate: true } } } },
}
```

Then replace the cap check (currently `countActiveSponsorPlacements(now) >= SPONSOR_SLOT_LIMIT`) with a per-slot check:

```typescript
const slotConfig = getSponsorSlotConfig(placement.slot);
if ((await countActiveSponsorPlacements(now, placement.slot)) >= slotConfig.inventoryCap) {
  return prisma.sponsorPlacement.update({
    where: { id: placement.id },
    data: {
      status: "PAID_WAITLISTED",
      paidAt: now,
      paymentId: input.paymentId,
      checkoutSessionId: input.checkoutSessionId ?? undefined,
    },
  });
}
```

The existing active-path update (setting `status: "ACTIVE"`, etc.) is unchanged.

- [ ] **Step 9: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/server/services/sponsor-placement-service.ts src/server/services/sponsor-pricing.ts
git commit -m "feat: make sponsor-placement-service slot-aware with per-slot caps and Dodo products"
```

---

## Task 3: Rewrite eligibility API

**Files:**
- Modify: `src/app/api/sponsor/eligibility/route.ts`

- [ ] **Step 1: Rewrite the eligibility route**

Replace the entire file content:

```typescript
import { errorResponse, ok } from "@/server/http/response";
import { getServerSession } from "@/server/auth/session";
import {
  countActiveSponsorPlacementsBySlot,
  listFounderSponsorEligibleTools,
} from "@/server/services/sponsor-placement-service";
import {
  getSponsorSlotConfig,
  ALL_SPONSOR_SLOTS,
} from "@/server/services/sponsor-pricing";
import type { SponsorSlot } from "@prisma/client";

export type SponsorEligibilityTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  activeSlots: SponsorSlot[];
};

export type SponsorEligibilitySlot = {
  slot: SponsorSlot;
  label: string;
  description: string;
  priceUsd: number;
  inventoryCap: number;
  activeCount: number;
  soldOut: boolean;
};

export type SponsorEligibilityResponse = {
  isSignedIn: boolean;
  tools: SponsorEligibilityTool[];
  slots: SponsorEligibilitySlot[];
};

export async function GET() {
  try {
    const session = await getServerSession();
    const isSignedIn = Boolean(session?.user);

    const [slotCounts, tools] = await Promise.all([
      countActiveSponsorPlacementsBySlot(),
      isSignedIn
        ? listFounderSponsorEligibleTools(session!.user.id)
        : Promise.resolve(
            [] as Awaited<ReturnType<typeof listFounderSponsorEligibleTools>>,
          ),
    ]);

    const slots: SponsorEligibilitySlot[] = ALL_SPONSOR_SLOTS.map((slot) => {
      const config = getSponsorSlotConfig(slot);
      const activeCount = slotCounts[slot];
      return {
        slot,
        label: config.label,
        description: config.description,
        priceUsd: config.priceUsd,
        inventoryCap: config.inventoryCap,
        activeCount,
        soldOut: activeCount >= config.inventoryCap,
      };
    });

    const data: SponsorEligibilityResponse = {
      isSignedIn,
      slots,
      tools: tools.map((tool) => ({
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        tagline: tool.tagline,
        activeSlots: tool.sponsorPlacements.map((p) => p.slot),
      })),
    };

    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/sponsor/eligibility/route.ts
git commit -m "feat: rewrite eligibility API to return per-slot availability data"
```

---

## Task 4: Update validator and checkout route

**Files:**
- Modify: `src/server/validators/sponsor-placement.ts`
- Modify: `src/app/api/dodo/checkout/sponsor-placement/route.ts`

- [ ] **Step 1: Add slot field to sponsorPlacementCheckoutSchema**

Replace the entire `src/server/validators/sponsor-placement.ts`:

```typescript
import { z } from "zod";

import { cuidSchema } from "@/server/validators/shared";

export const sponsorPlacementCheckoutSchema = z.object({
  toolId: cuidSchema,
  slot: z
    .enum(["SIDEBAR", "INLINE_BANNER", "INLINE_PRODUCT"])
    .default("SIDEBAR"),
});

export const sponsorPlacementDisableSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type SponsorPlacementCheckoutInput = z.infer<
  typeof sponsorPlacementCheckoutSchema
>;
```

- [ ] **Step 2: Pass slot through to service in the checkout route**

Replace `src/app/api/dodo/checkout/sponsor-placement/route.ts`:

```typescript
import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { createSponsorPlacementCheckout } from "@/server/services/sponsor-placement-service";
import { sponsorPlacementCheckoutSchema } from "@/server/validators/sponsor-placement";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = sponsorPlacementCheckoutSchema.parse(await request.json());

    const checkout = await createSponsorPlacementCheckout(
      body.toolId,
      {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      body.slot,
    );

    return ok(checkout);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/server/validators/sponsor-placement.ts src/app/api/dodo/checkout/sponsor-placement/route.ts
git commit -m "feat: add slot field to sponsor placement checkout validator and route"
```

---

## Task 5: Update return route and cache layer

**Files:**
- Modify: `src/app/api/sponsor/return/route.ts`
- Modify: `src/server/cache/public-content.ts`
- Modify: `src/components/public/showcase-layout.tsx`

- [ ] **Step 1: Forward placement_slot in return route**

In `src/app/api/sponsor/return/route.ts`, inside the `try` block after `redirectUrl.searchParams.set("placement_status", reconciled.status)`, add:

```typescript
      if (reconciled?.status) {
        redirectUrl.searchParams.set("placement_status", reconciled.status);
      }
      // Forward the slot so the modal can show "Your Sidebar placement is active"
      if (reconciled && "slot" in reconciled && reconciled.slot) {
        redirectUrl.searchParams.set("placement_slot", String(reconciled.slot));
      }
```

Replace the existing `if (reconciled?.status)` block with the full version above.

- [ ] **Step 2: Update getCachedActiveSponsorPlacements to accept optional slot**

In `src/server/cache/public-content.ts`, replace:

```typescript
export const getCachedActiveSponsorPlacements = cache(() =>
  unstable_cache(
    () => listActiveSponsorPlacements(),
    ["public-active-sponsor-placements", "v1"],
    {
      revalidate: 300,
      tags: [PUBLIC_CACHE_TAGS.sponsorPlacements],
    },
  )(),
);
```

With:

```typescript
export const getCachedActiveSponsorPlacements = cache(
  async (slot?: import("@prisma/client").SponsorSlot) =>
    unstable_cache(
      () => listActiveSponsorPlacements(slot),
      ["public-active-sponsor-placements", "v2", slot ?? "all"],
      {
        revalidate: 300,
        tags: [PUBLIC_CACHE_TAGS.sponsorPlacements],
      },
    )(),
);
```

Note the version bump to `"v2"` so stale cache entries from before the slot param don't collide.

- [ ] **Step 3: Update showcase-layout.tsx to pass "SIDEBAR" slot**

In `src/components/public/showcase-layout.tsx`, find:

```typescript
const sponsorPlacements = !isPrelaunch
  ? await getCachedActiveSponsorPlacements()
  : [];
```

Change to:

```typescript
const sponsorPlacements = !isPrelaunch
  ? await getCachedActiveSponsorPlacements("SIDEBAR")
  : [];
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/sponsor/return/route.ts src/server/cache/public-content.ts src/components/public/showcase-layout.tsx
git commit -m "feat: thread slot through return route, update cache to be slot-aware"
```

---

## Task 6: Update LaunchpadShowcase to fetch inline placements

**Files:**
- Modify: `src/components/public/launchpad-showcase.tsx`

`LaunchpadShowcase` has no `"use client"` directive, so it's a server component. Making it `async` is valid.

- [ ] **Step 1: Make LaunchpadShowcase async and fetch inline placements**

Replace the entire file:

```tsx
import { Fragment } from "react";
import Link from "next/link";

import { InlineProductAd } from "@/components/public/inline-product-ad";
import { InlineSponsorBanner } from "@/components/public/inline-sponsor-banner";
import { LaunchpadOpeningCountdown } from "@/components/public/launchpad-opening-countdown";
import { PublicDirectoryToolCard } from "@/components/public/public-directory-tool-card";
import { getCachedActiveSponsorPlacements } from "@/server/cache/public-content";
import type { PublicLaunchBoard } from "@/server/cache/public-content";
import type { LaunchBoardEntry } from "@/server/services/launch-service";

// Positions in the launchboard feed where inline ads get injected.
// Indexes are 0-based — `BANNER_AFTER_INDEX = 2` means the banner appears
// AFTER the 3rd launch row.
const BANNER_AFTER_INDEX = 2;
const PRODUCT_AD_AFTER_INDEXES = new Set([5, 8]);

const boardLabels: Record<PublicLaunchBoard, string> = {
  weekly: "This Week",
  monthly: "This Month",
  yearly: "This Year",
};

export async function LaunchpadShowcase({
  board,
  launches,
  emptyState = "default",
  launchpadGoLiveAt,
}: {
  board: PublicLaunchBoard;
  launches: LaunchBoardEntry[];
  emptyState?: "default" | "prelaunch-countdown";
  launchpadGoLiveAt?: string;
}) {
  const [bannerPlacements, productAdPlacements] = await Promise.all([
    getCachedActiveSponsorPlacements("INLINE_BANNER"),
    getCachedActiveSponsorPlacements("INLINE_PRODUCT"),
  ]);

  const productAdIndexes = [...PRODUCT_AD_AFTER_INDEXES];

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            Launch Pad &middot; {boardLabels[board]}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
            {boardLabels[board]}&apos;s launches
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card [&>article:last-child]:border-b-0 [&>div:last-child]:border-b-0">
        {launches.map((launch, index) => {
          const productAdSlotIndex = productAdIndexes.indexOf(index);
          return (
            <Fragment key={launch.id}>
              <PublicDirectoryToolCard
                toolId={launch.tool.id}
                name={launch.tool.name}
                tagline={launch.tool.tagline}
                logoUrl={launch.tool.logoMedia?.url}
                websiteUrl={launch.tool.websiteUrl}
                affiliateUrl={launch.tool.affiliateUrl}
                slug={launch.tool.slug}
                votes={launch.tool.upvoteCount}
                primaryCategory={launch.tool.toolCategories[0]?.category ?? null}
                rank={index + 1}
                imagePriority={index < 3}
                isPremiumLaunch={launch.launchType === "FEATURED"}
              />
              {index === BANNER_AFTER_INDEX ? (
                <InlineSponsorBanner placement={bannerPlacements[0] ?? null} />
              ) : null}
              {productAdSlotIndex >= 0 ? (
                <InlineProductAd
                  placement={productAdPlacements[productAdSlotIndex] ?? null}
                />
              ) : null}
            </Fragment>
          );
        })}

        {launches.length === 0 &&
        emptyState === "prelaunch-countdown" &&
        launchpadGoLiveAt ? (
          <LaunchpadOpeningCountdown
            board={board}
            launchpadGoLiveAt={launchpadGoLiveAt}
          />
        ) : null}

        {launches.length === 0 && emptyState === "default" ? (
          <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              No launches found for this period.
            </p>
            <Link
              href="/submit"
              className="mt-4 text-sm font-semibold text-foreground transition-all hover:opacity-70"
            >
              Submit a product →
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/public/launchpad-showcase.tsx
git commit -m "feat: make LaunchpadShowcase async to fetch inline sponsor placements"
```

---

## Task 7: Update InlineSponsorBanner with real placement support

**Files:**
- Modify: `src/components/public/inline-sponsor-banner.tsx`

The component stays `"use client"` because the house-ad branch still uses `SponsorAdvertiseModal`. When a real placement is passed, render a direct outbound link instead.

- [ ] **Step 1: Define the InlinePlacement type and update component**

Replace the entire file:

```tsx
"use client";

import Image from "next/image";

import { SponsorAdvertiseModal } from "@/components/public/sponsor-advertise-modal";
import { buildToolOutboundHref } from "@/lib/tool-outbound";

type InlinePlacement = {
  id: string;
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    affiliateUrl: string | null;
    logoMedia: { url: string } | null;
  };
};

const HouseAdContent = () => (
  <div className="relative flex items-center gap-3 md:grid md:grid-cols-[auto_1.5fr_auto] md:gap-4">
    <div className="hidden md:flex items-center justify-center w-16">
      <span className="text-xs font-bold text-muted-foreground tracking-wider transform -rotate-90 whitespace-nowrap opacity-60">
        SPONSORED
      </span>
    </div>
    <div className="min-w-0 flex-1 space-y-1 md:space-y-1.5 lg:space-y-2">
      <div className="relative">
        <h3 className="font-heading text-base md:text-xl lg:text-2xl xl:text-[26px] font-bold leading-[1.15] tracking-tight text-foreground break-words">
          Promote your product &amp;
          <br />
          Reach thousands of users
        </h3>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2.5 pt-1 md:pt-1.5 lg:pt-2">
        <div className="h-px w-6 md:w-7 bg-foreground" />
        <span className="text-[9px] md:text-[10px] text-muted-foreground tracking-wider uppercase whitespace-nowrap">
          Book this spot for 30 days
        </span>
      </div>
    </div>
    <div className="relative shrink-0">
      <div className="relative h-12 w-12 xs:h-14 xs:w-14 md:h-20 md:w-20 lg:h-24 lg:w-24">
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-muted/30">
          <Image
            src="/logos/logo-black.png"
            alt=""
            fill
            sizes="96px"
            className="object-contain dark:hidden"
            priority={false}
          />
          <Image
            src="/logos/logo-white.png"
            alt=""
            fill
            sizes="96px"
            className="object-contain hidden dark:block"
            priority={false}
          />
        </div>
      </div>
    </div>
  </div>
);

function RealBannerContent({ placement }: { placement: InlinePlacement }) {
  const href =
    buildToolOutboundHref({
      websiteUrl: placement.tool.websiteUrl,
      affiliateUrl: placement.tool.affiliateUrl,
      source: "sponsor_slot",
      toolSlug: placement.tool.slug,
    }) ?? placement.tool.websiteUrl;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer sponsored"
      data-shipboost-outbound-source="sponsor_slot"
      data-shipboost-outbound-context="inline_banner"
      data-shipboost-tool-id={placement.tool.id}
      data-shipboost-tool-slug={placement.tool.slug}
      className="relative flex w-full items-center gap-3 md:grid md:grid-cols-[auto_1.5fr_auto] md:gap-4"
    >
      <div className="hidden md:flex items-center justify-center w-16">
        <span className="text-xs font-bold text-muted-foreground tracking-wider transform -rotate-90 whitespace-nowrap opacity-60">
          SPONSORED
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-1 md:space-y-1.5 lg:space-y-2">
        <h3 className="font-heading text-base md:text-xl lg:text-2xl xl:text-[26px] font-bold leading-[1.15] tracking-tight text-foreground break-words">
          {placement.tool.name}
        </h3>
        <p className="text-sm font-normal text-muted-foreground line-clamp-2">
          {placement.tool.tagline}
        </p>
        <div className="flex items-center gap-1.5 md:gap-2.5 pt-1">
          <div className="h-px w-6 md:w-7 bg-foreground" />
          <span className="text-[9px] md:text-[10px] text-muted-foreground tracking-wider uppercase whitespace-nowrap">
            Visit site
          </span>
        </div>
      </div>
      <div className="relative shrink-0">
        <div className="relative h-12 w-12 xs:h-14 xs:w-14 md:h-20 md:w-20 lg:h-24 lg:w-24">
          {placement.tool.logoMedia ? (
            <Image
              src={placement.tool.logoMedia.url}
              alt={placement.tool.name}
              fill
              sizes="96px"
              className="rounded-xl object-contain"
              priority={false}
            />
          ) : (
            <div className="w-full h-full rounded-xl bg-muted/30" />
          )}
        </div>
      </div>
    </a>
  );
}

export function InlineSponsorBanner({
  placement,
}: {
  placement: InlinePlacement | null;
}) {
  return (
    <article className="relative cursor-pointer overflow-hidden border-b border-border bg-background group hover:bg-muted/50 transition-colors px-3 sm:px-4 md:px-6 py-7 sm:py-9 md:py-11">
      {/* Decorative layer 1: animated ADVERTISE marquee */}
      <div
        aria-hidden
        className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 left-0 right-0 overflow-hidden opacity-[0.04] dark:opacity-[0.14] pointer-events-none"
      >
        <div className="banner-marquee-track flex items-center whitespace-nowrap text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex items-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="flex items-center">
                  <span>{placement ? "SPONSORED" : "ADVERTISE"}</span>
                  <span className="mx-6">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Decorative layer 2: vertical SPONSORED column */}
      <div
        aria-hidden
        className="hidden md:block absolute -left-12 top-0 bottom-0 w-16 overflow-hidden opacity-[0.08] dark:opacity-[0.18] pointer-events-none"
      >
        <div className="flex flex-col items-center text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="contents">
              <span className="transform -rotate-90 whitespace-nowrap text-muted-foreground">
                SPONSORED
              </span>
              <div className="h-8" />
            </div>
          ))}
        </div>
      </div>

      {placement ? (
        <RealBannerContent placement={placement} />
      ) : (
        <SponsorAdvertiseModal
          triggerClassName="relative block w-full text-left"
          triggerContent={<HouseAdContent />}
        />
      )}
    </article>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/public/inline-sponsor-banner.tsx
git commit -m "feat: InlineSponsorBanner renders real placement data when available"
```

---

## Task 8: Update InlineProductAd with real placement support

**Files:**
- Modify: `src/components/public/inline-product-ad.tsx`

- [ ] **Step 1: Replace component with placement-aware version**

```tsx
"use client";

import { ArrowUpRight, ExternalLink, Megaphone } from "lucide-react";

import { LogoFallback } from "@/components/ui/logo-fallback";
import { SponsorAdvertiseModal } from "@/components/public/sponsor-advertise-modal";
import { buildToolOutboundHref } from "@/lib/tool-outbound";

type InlinePlacement = {
  id: string;
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    affiliateUrl: string | null;
    logoMedia: { url: string } | null;
  };
};

function RealProductAd({ placement }: { placement: InlinePlacement }) {
  const href =
    buildToolOutboundHref({
      websiteUrl: placement.tool.websiteUrl,
      affiliateUrl: placement.tool.affiliateUrl,
      source: "sponsor_slot",
      toolSlug: placement.tool.slug,
    }) ?? placement.tool.websiteUrl;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer sponsored"
      data-shipboost-outbound-source="sponsor_slot"
      data-shipboost-outbound-context="inline_product"
      data-shipboost-tool-id={placement.tool.id}
      data-shipboost-tool-slug={placement.tool.slug}
      className="group flex w-full items-center gap-3 md:gap-4 px-4 sm:px-5 py-4 text-left cursor-pointer transition-colors hover:bg-muted/50 min-w-0"
    >
      {/* SPONSORED pill in the rank slot */}
      <div className="shrink-0 flex w-7 items-center justify-center select-none">
        <span className="rotate-[-90deg] origin-center whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.16em] text-primary/70">
          Sponsored
        </span>
      </div>

      <LogoFallback
        name={placement.tool.name}
        src={placement.tool.logoMedia?.url}
        websiteUrl={placement.tool.websiteUrl}
        sizes="56px"
        className="h-14 w-14 shrink-0 rounded-lg border border-border/60"
        textClassName="text-sm"
      />

      <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 py-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-lg font-bold tracking-tight text-foreground">
            {placement.tool.name}
          </span>
        </div>
        <p className="line-clamp-1 text-sm font-normal leading-snug text-muted-foreground">
          {placement.tool.tagline}
        </p>
      </div>

      <div className="shrink-0 self-center inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold tracking-tight text-foreground transition-colors group-hover:border-foreground/30">
        Visit
        <ExternalLink size={11} />
      </div>
    </a>
  );
}

export function InlineProductAd({
  placement,
}: {
  placement: InlinePlacement | null;
}) {
  return (
    <article className="group relative border-b border-border/60 bg-background overflow-hidden">
      {placement ? (
        <RealProductAd placement={placement} />
      ) : (
        <SponsorAdvertiseModal
          triggerClassName="group flex w-full items-center gap-3 md:gap-4 px-4 sm:px-5 py-4 text-left cursor-pointer transition-colors hover:bg-muted/50 min-w-0"
          triggerContent={
            <>
              <div className="shrink-0 flex w-7 items-center justify-center select-none">
                <span className="rotate-[-90deg] origin-center whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.16em] text-primary/70">
                  Sponsored
                </span>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/70 bg-primary/5 text-primary">
                <Megaphone size={20} />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 py-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate text-lg font-bold tracking-tight text-foreground">
                    Your product here
                  </span>
                </div>
                <p className="line-clamp-1 text-sm font-normal leading-snug text-muted-foreground">
                  Get featured in the launchboard feed — native placement that
                  founders actually read.
                </p>
                <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] font-medium text-muted-foreground/70">
                  <span>Book this slot</span>
                  <span aria-hidden className="text-muted-foreground/40">
                    ·
                  </span>
                  <span>30 days</span>
                </div>
              </div>
              <div className="shrink-0 self-center inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold tracking-tight text-foreground transition-colors group-hover:border-foreground/30">
                Promote
                <ArrowUpRight size={11} />
              </div>
            </>
          }
        />
      )}
    </article>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```

Expected: no errors. Note: `LogoFallback` is already used in `sidebar-sponsor-placements.tsx`, so it exists.

- [ ] **Step 3: Commit**

```bash
git add src/components/public/inline-product-ad.tsx
git commit -m "feat: InlineProductAd renders real placement data when available"
```

---

## Task 9: Update SponsorAdvertiseModal — slot-locked, no tier picker

**Files:**
- Modify: `src/components/public/sponsor-advertise-modal.tsx`
- Modify: `src/components/public/sidebar-sponsor-placements.tsx`

Each surface now opens its own pre-locked modal. `SponsorAdvertiseModal` gains a required `slot: SponsorSlot` prop. The tier picker is removed entirely. The modal shows slot-specific copy (label, price, description) and filters tools to only those not already active in that slot. All three call sites pass their slot explicitly.

- [ ] **Step 1: Replace the entire sponsor-advertise-modal.tsx**

`SponsorAdvertiseModal` now requires a `slot: SponsorSlot` prop. No tier picker. The modal shows copy and price specific to that slot, filters tools to those not already active in that slot, and sends `{ toolId, slot }` to checkout. The `/?advertise=1` auto-open still works — the component that mounts with that URL param determines which slot is shown.

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Megaphone,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SponsorEligibilityResponse } from "@/app/api/sponsor/eligibility/route";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import type { SponsorSlot } from "@prisma/client";

const SLOT_LABELS: Record<SponsorSlot, string> = {
  SIDEBAR: "Sidebar",
  INLINE_BANNER: "Banner",
  INLINE_PRODUCT: "Product ad",
};

const SLOT_DESCRIPTIONS: Record<SponsorSlot, string> = {
  SIDEBAR:
    "Your product card cycles in the high-attention sidebar slot across all discovery pages — homepage, categories, tags, and launchboards — for 30 days.",
  INLINE_BANNER:
    "An animated inline banner injected in the launchboard feed. Prominent placement that stops the scroll.",
  INLINE_PRODUCT:
    "A native-style product row in the launchboard feed. Looks like an organic listing — founders actually read it.",
};

type SponsorAdvertiseModalProps = {
  slot: SponsorSlot;
  triggerClassName?: string;
  triggerContent: React.ReactNode;
};

type EligibilityState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; data: SponsorEligibilityResponse }
  | { kind: "error"; message: string };

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function SponsorAdvertiseModal({
  slot,
  triggerClassName,
  triggerContent,
}: SponsorAdvertiseModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useBodyScrollLock(isOpen);
  const [eligibility, setEligibility] = useState<EligibilityState>({
    kind: "idle",
  });
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const sponsorSuccess = searchParams?.get("sponsor") === "success";
  const sponsorError = searchParams?.get("sponsor") === "error";
  const placementStatus = searchParams?.get("placement_status");
  const placementSlot = searchParams?.get("placement_slot") as SponsorSlot | null;

  const successMessage = sponsorSuccess
    ? placementStatus === "ACTIVE"
      ? `Payment received. Your ${placementSlot ? SLOT_LABELS[placementSlot] : "sponsor"} placement is active.`
      : placementStatus === "PAID_WAITLISTED"
        ? "Payment received. Your placement is reserved and will start when a slot opens."
        : "Payment received. Your placement is being set up and will appear shortly."
    : null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    const shouldOpen =
      searchParams.get("advertise") === "1" ||
      searchParams.get("sponsor") === "success" ||
      searchParams.get("sponsor") === "error";
    if (shouldOpen) setIsOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeAndCleanUrl();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (eligibility.kind === "loading" || eligibility.kind === "loaded") return;
    setEligibility({ kind: "loading" });
    fetch("/api/sponsor/eligibility", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { data?: SponsorEligibilityResponse; error?: string }
          | null;
        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error ?? "Could not load eligibility.");
        }
        setEligibility({ kind: "loaded", data: payload.data });
        const first = payload.data.tools.find(
          (t) => !t.activeSlots.includes(slot),
        );
        if (first) setSelectedToolId(first.id);
      })
      .catch((error) =>
        setEligibility({ kind: "error", message: toErrorMessage(error) }),
      );
  }, [isOpen, eligibility.kind, slot]);

  function closeAndCleanUrl() {
    setIsOpen(false);
    if (!searchParams) return;
    const next = new URLSearchParams(searchParams.toString());
    let mutated = false;
    for (const key of [
      "advertise",
      "sponsor",
      "status",
      "placement_status",
      "placement_slot",
    ]) {
      if (next.has(key)) {
        next.delete(key);
        mutated = true;
      }
    }
    if (mutated) {
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  async function startCheckout() {
    if (eligibility.kind !== "loaded") return;
    if (!selectedToolId) return;
    setCheckoutError(null);
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/dodo/checkout/sponsor-placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: selectedToolId, slot }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: { checkoutUrl: string }; error?: string }
        | null;
      if (!response.ok || !payload?.data?.checkoutUrl) {
        throw new Error(payload?.error ?? "Could not open checkout.");
      }
      window.location.href = payload.data.checkoutUrl;
    } catch (error) {
      setCheckoutError(toErrorMessage(error));
      setIsCheckingOut(false);
    }
  }

  const selectedTool = useMemo(() => {
    if (eligibility.kind !== "loaded") return null;
    return (
      eligibility.data.tools.find((tool) => tool.id === selectedToolId) ?? null
    );
  }, [eligibility, selectedToolId]);

  // Per-slot data from the eligibility response
  const slotData = useMemo(() => {
    if (eligibility.kind !== "loaded") return null;
    return eligibility.data.slots.find((s) => s.slot === slot) ?? null;
  }, [eligibility, slot]);

  const modal =
    isOpen && isMounted
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sponsor-advertise-title"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
            onClick={closeAndCleanUrl}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/20"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close advertise details"
                onClick={closeAndCleanUrl}
                className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X size={14} />
              </button>

              <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
                {/* Header */}
                <div className="pr-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    {SLOT_LABELS[slot]} placement
                  </p>
                  <h3
                    id="sponsor-advertise-title"
                    className="mt-2 text-2xl font-bold tracking-tight text-foreground"
                  >
                    Advertise on ShipBoost
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                    {SLOT_DESCRIPTIONS[slot]}
                  </p>
                </div>

                {/* Success / error banners */}
                {successMessage ? (
                  <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-[13px] font-medium leading-snug text-emerald-700">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    {successMessage}
                  </div>
                ) : null}
                {sponsorError ? (
                  <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] font-medium leading-snug text-destructive">
                    We couldn&apos;t finish syncing your payment. If the charge
                    succeeded, it&apos;ll appear in your dashboard within a
                    minute.
                  </div>
                ) : null}

                {/* Metric chips */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/70 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                      <Users size={12} />
                      Reach
                    </div>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
                      Founders &amp; buyers
                    </p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {slot === "SIDEBAR"
                        ? "Every discovery page"
                        : "Launchboard feed"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                      <CalendarDays size={12} />
                      Pricing
                    </div>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
                      {slotData ? `$${slotData.priceUsd}` : "—"}
                    </p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      Flat · 30 days
                    </p>
                  </div>
                </div>

                {/* Inventory badge */}
                {slotData && !slotData.soldOut ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {slotData.inventoryCap - slotData.activeCount} of{" "}
                    {slotData.inventoryCap} slots open
                  </div>
                ) : null}

                {/* Action area */}
                <div className="mt-6">
                  <SlotActionArea
                    slot={slot}
                    slotData={slotData}
                    eligibility={eligibility}
                    selectedToolId={selectedToolId}
                    selectedTool={selectedTool}
                    setSelectedToolId={(id) => {
                      setSelectedToolId(id);
                      setDropdownOpen(false);
                    }}
                    dropdownOpen={dropdownOpen}
                    setDropdownOpen={setDropdownOpen}
                    checkoutError={checkoutError}
                    isCheckingOut={isCheckingOut}
                    onCheckout={startCheckout}
                    onCloseModal={closeAndCleanUrl}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName}
        aria-label={`Advertise on ShipBoost — ${SLOT_LABELS[slot]} placement`}
      >
        {triggerContent}
      </button>
      {modal}
    </>
  );
}

function SlotActionArea({
  slot,
  slotData,
  eligibility,
  selectedToolId,
  selectedTool,
  setSelectedToolId,
  dropdownOpen,
  setDropdownOpen,
  checkoutError,
  isCheckingOut,
  onCheckout,
  onCloseModal,
}: {
  slot: SponsorSlot;
  slotData: SponsorEligibilityResponse["slots"][number] | null;
  eligibility: EligibilityState;
  selectedToolId: string;
  selectedTool: SponsorEligibilityResponse["tools"][number] | null;
  setSelectedToolId: (id: string) => void;
  dropdownOpen: boolean;
  setDropdownOpen: (next: boolean) => void;
  checkoutError: string | null;
  isCheckingOut: boolean;
  onCheckout: () => void;
  onCloseModal: () => void;
}) {
  if (eligibility.kind === "idle" || eligibility.kind === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card py-4 text-sm font-medium text-muted-foreground">
        <Loader2 size={14} className="animate-spin" />
        Loading your tools…
      </div>
    );
  }

  if (eligibility.kind === "error") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm font-medium text-destructive">
        {eligibility.message}
      </div>
    );
  }

  const { data } = eligibility;

  if (!data.isSignedIn) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Sign in to sponsor your tool
            </p>
            <p className="mt-1 text-[12px] font-normal leading-relaxed text-muted-foreground">
              Sponsor placements are available for tools you own on ShipBoost.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/sign-in?redirect=/?advertise=1"
            onClick={onCloseModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold tracking-tight text-primary-foreground transition hover:opacity-90"
          >
            Sign in
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/submit"
            onClick={onCloseModal}
            className="inline-flex items-center rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold tracking-tight text-foreground transition hover:bg-muted"
          >
            Submit your tool
          </Link>
        </div>
      </div>
    );
  }

  if (slotData?.soldOut) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <p className="text-sm font-semibold text-foreground">
          {SLOT_LABELS[slot]} placements are sold out right now.
        </p>
        <p className="mt-1 text-[12px] font-normal leading-relaxed text-muted-foreground">
          Check back when a placement expires.
        </p>
      </div>
    );
  }

  // Tools that already have an active placement in this slot
  const toolsForSlot = data.tools.map((tool) => ({
    ...tool,
    alreadyActiveInSlot: tool.activeSlots.includes(slot),
  }));

  const eligibleTools = toolsForSlot.filter((t) => !t.alreadyActiveInSlot);

  if (eligibleTools.length === 0 && data.tools.length === 0) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <p className="text-sm font-semibold text-foreground">
          No eligible tools yet.
        </p>
        <p className="mt-1 text-[12px] font-normal leading-relaxed text-muted-foreground">
          Approved live or scheduled tools can buy a sponsor placement. If your
          tool is still waiting for review, finish that first.
        </p>
        <Link
          href="/submit"
          onClick={onCloseModal}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold tracking-tight text-primary-foreground transition hover:opacity-90"
        >
          Submit your tool
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  const isToolAlreadyInSlot = selectedTool?.activeSlots.includes(slot) ?? false;

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
        Pick the tool to sponsor
      </p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5 text-left transition-colors hover:border-foreground/30"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-foreground">
              {selectedTool?.name ?? "Choose a tool"}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
              {selectedTool?.tagline ?? "Pick the product you want to promote"}
            </span>
          </span>
          <ChevronDown
            size={15}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform",
              dropdownOpen && "rotate-180",
            )}
          />
        </button>

        {dropdownOpen ? (
          <div
            role="listbox"
            className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/10"
          >
            {toolsForSlot.map((tool) => {
              const selected = tool.id === selectedToolId;
              return (
                <button
                  key={tool.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setSelectedToolId(tool.id)}
                  disabled={tool.alreadyActiveInSlot}
                  className={cn(
                    "flex w-full items-start justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    !tool.alreadyActiveInSlot && "hover:bg-muted",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold tracking-tight text-foreground">
                      {tool.name}
                      {tool.alreadyActiveInSlot ? (
                        <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                          · already sponsored here
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] font-normal leading-snug text-muted-foreground">
                      {tool.tagline}
                    </span>
                  </span>
                  {selected ? (
                    <Check size={14} className="mt-0.5 shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {checkoutError ? (
        <p className="text-[12px] font-medium text-destructive">
          {checkoutError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onCheckout}
        disabled={isCheckingOut || !selectedToolId || isToolAlreadyInSlot}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold tracking-tight text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {isCheckingOut ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Opening checkout…
          </>
        ) : (
          <>
            <Megaphone size={14} />
            Get started (${slotData?.priceUsd ?? "—"} / 30 days)
          </>
        )}
      </button>
      <p className="text-center text-[11px] font-normal text-muted-foreground/80">
        Secure checkout via Dodo Payments.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Add `slot="SIDEBAR"` to all SponsorAdvertiseModal usages in sidebar-sponsor-placements.tsx**

There are two usages in `src/components/public/sidebar-sponsor-placements.tsx`. Find both `<SponsorAdvertiseModal` tags and add `slot="SIDEBAR"` to each:

```tsx
// EmptySponsorSlot — add slot prop:
<SponsorAdvertiseModal
  slot="SIDEBAR"
  triggerClassName="group block w-full text-left ..."
  triggerContent={...}
/>

// SidebarSponsorPlacements header — add slot prop:
<SponsorAdvertiseModal
  slot="SIDEBAR"
  triggerClassName="group inline-flex ..."
  triggerContent={...}
/>
```

- [ ] **Step 3: Add `slot="INLINE_BANNER"` to SponsorAdvertiseModal in inline-sponsor-banner.tsx**

In the house-ad branch of `InlineSponsorBanner`, the existing `<SponsorAdvertiseModal` call needs the slot prop:

```tsx
<SponsorAdvertiseModal
  slot="INLINE_BANNER"
  triggerClassName="relative block w-full text-left"
  triggerContent={<HouseAdContent />}
/>
```

- [ ] **Step 4: Add `slot="INLINE_PRODUCT"` to SponsorAdvertiseModal in inline-product-ad.tsx**

In the house-ad branch of `InlineProductAd`:

```tsx
<SponsorAdvertiseModal
  slot="INLINE_PRODUCT"
  triggerClassName="group flex w-full ..."
  triggerContent={...}
/>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 6: Run ESLint on all touched files**

```bash
npx eslint src/components/public/sponsor-advertise-modal.tsx src/components/public/sidebar-sponsor-placements.tsx src/components/public/inline-sponsor-banner.tsx src/components/public/inline-product-ad.tsx 2>&1 | head -40
```

Expected: no errors (warnings are okay).

- [ ] **Step 7: Commit**

```bash
git add src/components/public/sponsor-advertise-modal.tsx src/components/public/sidebar-sponsor-placements.tsx src/components/public/inline-sponsor-banner.tsx src/components/public/inline-product-ad.tsx
git commit -m "feat: slot-locked SponsorAdvertiseModal — each placement surface opens its own pre-locked modal"
```

---

## Task 10: Final type check, lint, and smoke test

- [ ] **Step 1: Full TypeScript compile**

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: zero errors.

- [ ] **Step 2: Run tests**

```bash
npm run test 2>&1 | tail -20
```

Expected: no new failures. If tests reference `SponsorEligibilityResponse.soldOut` or `hasActiveSponsor`, they need to be updated to the new shape (`slots[].soldOut` and `activeSlots[]` respectively).

If test failures appear in sponsor-related test files, update the mock responses to match the new `SponsorEligibilityResponse` shape:
- Old: `{ isSignedIn, soldOut, activeCount, tools: [{ hasActiveSponsor }] }`
- New: `{ isSignedIn, slots: [{ slot, soldOut, ... }], tools: [{ activeSlots: [] }] }`

- [ ] **Step 3: Start dev server and do manual smoke test**

```bash
npm run dev
```

Smoke test checklist:
1. Navigate to `http://localhost:3000/?advertise=1` — modal opens with 3 tier cards
2. Click "Banner" tier card — it highlights as selected
3. Pick a tool from the dropdown — only tools without an active banner placement are selectable
4. Click "Get started ($49 / 30 days)" — verify price matches selected tier
5. After Dodo checkout (or simulate return by visiting `/api/sponsor/return?sponsor_placement_id=EXISTING_SIDEBAR_ID&payment_id=fake`): `/?sponsor=success&placement_status=ACTIVE&placement_slot=SIDEBAR` shows "Your Sidebar placement is active."
6. Verify existing sidebar sponsor cards still render (check a page with an active SIDEBAR placement if any exist in dev DB).

- [ ] **Step 4: Final commit**

```bash
git add -p  # review any remaining unstaged changes
git commit -m "feat: complete multi-tier sponsor placement wiring"
```

---

## Env Vars to Add

Add these to your `.env.local` (dev) and Neon/production environment before deploying:

```
DODO_SPONSOR_PLACEMENT_PRODUCT_ID=<your existing sidebar product ID>
DODO_SPONSOR_BANNER_PRODUCT_ID=<new banner product ID from Dodo dashboard>
DODO_SPONSOR_PRODUCT_AD_PRODUCT_ID=<new product ad product ID from Dodo dashboard>
```

`DODO_SPONSOR_PLACEMENT_PRODUCT_ID` was already in `src/server/env.ts` but not in `.env.example` — it's now documented there.

---

## Decisions Made Not Specified in the Spec

1. **Slot forwarded through return URL via `placement_slot` query param** — `reconcileSponsorPlacementPayment` returns the full Prisma model (which includes `slot`). The return route now reads `reconciled.slot` and adds it to the redirect URL. The modal reads `placement_slot` from search params and resolves it to a label for the success message.

2. **`listActiveSponsorPlacements(slot?)` signature** — takes `slot` as first param, `now` as second. Without a `slot`, no `take` limit is applied (the sidebar still works because it passes `"SIDEBAR"` which caps at `inventoryCap: 3`). Existing callers that previously called with no args now use `getCachedActiveSponsorPlacements("SIDEBAR")`.

3. **Cache key bumped to `"v2"`** — `getCachedActiveSponsorPlacements` now includes the slot in the cache key. Version bump prevents stale cache collisions with old `"v1"` entries that didn't have a slot dimension.

4. **`LogoFallback` used in `InlineProductAd` real-placement branch** — matches the pattern in `sidebar-sponsor-placements.tsx`. Requires no new dependency.

5. **`SponsorSlot` imported from `@prisma/client` in the modal** — Prisma generates this from the schema; no re-declaration needed. Client components can import Prisma enums since they're plain string unions.

6. **No tier picker — slot prop is required** — each surface (sidebar "Advertise here", `InlineSponsorBanner` house ad, `InlineProductAd` house ad) passes its own `slot` to `SponsorAdvertiseModal`. The modal shows copy, price, inventory, and tool filtering scoped to that slot only. The old single-modal tier-picker design was dropped in favor of three independent modals.
