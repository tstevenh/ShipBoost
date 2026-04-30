# Sponsor Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a $59 one-time, 30-day, left-sidebar sponsor placement product for existing approved ShipBoost tools.

**Architecture:** Add a `SponsorPlacement` table linked to `Tool`, then expose a service layer that owns eligibility, inventory, payment activation, expiry, renewal reminders, and admin disabling. Public sidebar rendering reads cached active placements, checkout uses a new Dodo product id, and webhook routing separates sponsor payments from premium launch payments using checkout metadata.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, PostgreSQL, Dodo Payments, Resend transactional email, Vitest, React Testing Library.

---

## File Structure

- Modify `prisma/schema.prisma`: add `SponsorPlacementStatus`, `SponsorPlacement`, and `Tool.sponsorPlacements`.
- Create `src/server/validators/sponsor-placement.ts`: request validation for sponsor checkout and admin disable actions.
- Modify `src/server/env.ts`: add `DODO_SPONSOR_PLACEMENT_PRODUCT_ID`.
- Create `src/server/services/sponsor-placement-service.ts`: eligibility, public listing, checkout creation, payment activation, disabling, expiry, and reminders.
- Create `src/server/services/sponsor-placement-service.test.ts`: unit tests for the service.
- Create `src/app/api/dodo/checkout/sponsor-placement/route.ts`: authenticated founder checkout route.
- Modify `src/app/api/dodo/webhooks/route.ts`: route sponsor payment success by metadata.
- Modify `src/server/cache/public-content.ts`: cache active sponsor placements and revalidate them.
- Modify `src/components/public/showcase-layout.tsx`: render three left-sidebar sponsor slots and remove right-sidebar sponsor placeholders.
- Create `src/components/public/sidebar-sponsor-placements.tsx`: sponsor card and empty slot UI.
- Create `src/app/advertise/page.tsx`: public buyer page.
- Create `src/components/public/advertise-sponsor-form.tsx`: client checkout launcher for eligible tools.
- Create `src/app/api/admin/sponsor-placements/route.ts`: admin list endpoint.
- Create `src/app/api/admin/sponsor-placements/[placementId]/disable/route.ts`: admin disable endpoint.
- Create `src/components/admin/sponsor-placement-panel.tsx`: admin placement table.
- Modify `src/components/admin/admin-console.tsx`: add Sponsors nav item and fetch state.
- Modify `src/components/admin/admin-console-shared.ts`: add sponsor placement types.
- Modify `src/server/email/transactional.ts`: add sponsor renewal reminder email.
- Create `src/app/api/cron/sponsor-placements/route.ts`: expiry and reminder cron.

---

### Task 1: Database, Env, and Validators

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/server/env.ts`
- Create: `src/server/validators/sponsor-placement.ts`

- [ ] **Step 1: Update Prisma schema**

Add the enum near the other business enums:

```prisma
enum SponsorPlacementStatus {
  PENDING_PAYMENT
  ACTIVE
  EXPIRED
  DISABLED
  PAID_WAITLISTED
}
```

Add this relation to `model Tool`:

```prisma
  sponsorPlacements SponsorPlacement[]
```

Add the model after `ListingClaim`:

```prisma
model SponsorPlacement {
  id                    String                 @id @default(cuid())
  toolId                String
  tool                  Tool                   @relation(fields: [toolId], references: [id], onDelete: Cascade)
  status                SponsorPlacementStatus @default(PENDING_PAYMENT)
  startsAt              DateTime?
  endsAt                DateTime?
  paidAt                DateTime?
  disabledAt            DateTime?
  checkoutSessionId     String?                @unique
  paymentId             String?
  renewalReminderSentAt DateTime?
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt

  @@index([status, startsAt, endsAt])
  @@index([toolId, status])
}
```

- [ ] **Step 2: Add sponsor product env var**

In `src/server/env.ts`, add to `envSchema`:

```ts
DODO_SPONSOR_PLACEMENT_PRODUCT_ID: optionalEnvString,
```

Add to `getEnv()` parse input:

```ts
DODO_SPONSOR_PLACEMENT_PRODUCT_ID:
  process.env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID,
```

- [ ] **Step 3: Add validators**

Create `src/server/validators/sponsor-placement.ts`:

```ts
import { z } from "zod";

import { cuidSchema } from "@/server/validators/shared";

export const sponsorPlacementCheckoutSchema = z.object({
  toolId: cuidSchema,
});

export const sponsorPlacementDisableSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type SponsorPlacementCheckoutInput = z.infer<
  typeof sponsorPlacementCheckoutSchema
>;
```

- [ ] **Step 4: Generate Prisma migration**

Run:

```bash
npm run db:migrate:dev -- --name add-sponsor-placements
```

Expected: Prisma creates a new migration and regenerates the client.

- [ ] **Step 5: Verify schema compiles**

Run:

```bash
npx tsc --noEmit
```

Expected: may fail because services are not implemented yet if Prisma client types are referenced nowhere. Any failure at this stage should be unrelated to the new schema syntax.

---

### Task 2: Sponsor Placement Service

**Files:**
- Create: `src/server/services/sponsor-placement-service.ts`
- Create: `src/server/services/sponsor-placement-service.test.ts`

- [ ] **Step 1: Write service tests first**

Create `src/server/services/sponsor-placement-service.test.ts` with these core cases:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, dodoMock } = vi.hoisted(() => ({
  prismaMock: {
    tool: { findFirst: vi.fn() },
    sponsorPlacement: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  dodoMock: {
    checkoutSessions: { create: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));
vi.mock("@/server/dodo", () => ({
  getDodoClient: () => dodoMock,
}));
vi.mock("@/server/env", () => ({
  getEnv: () => ({
    DODO_SPONSOR_PLACEMENT_PRODUCT_ID: "product_sponsor",
    NEXT_PUBLIC_APP_URL: "https://shipboost.io",
  }),
}));

import {
  createSponsorPlacementCheckout,
  handleSponsorPlacementPaymentSucceeded,
  listActiveSponsorPlacements,
} from "@/server/services/sponsor-placement-service";

describe("sponsor-placement-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects checkout when the founder does not own the tool", async () => {
    prismaMock.tool.findFirst.mockResolvedValue(null);

    await expect(
      createSponsorPlacementCheckout("tool_1", {
        id: "user_1",
        email: "founder@example.com",
        name: "Founder",
      }),
    ).rejects.toThrow("Tool is not eligible for sponsor placement.");
  });

  it("rejects checkout when all three sponsor slots are active", async () => {
    prismaMock.tool.findFirst.mockResolvedValue({ id: "tool_1", name: "Tool" });
    prismaMock.sponsorPlacement.count.mockResolvedValue(3);

    await expect(
      createSponsorPlacementCheckout("tool_1", {
        id: "user_1",
        email: "founder@example.com",
        name: "Founder",
      }),
    ).rejects.toThrow("Sponsor placements are sold out.");
  });

  it("creates a pending placement and Dodo checkout", async () => {
    prismaMock.tool.findFirst.mockResolvedValue({ id: "tool_1", name: "Tool" });
    prismaMock.sponsorPlacement.count.mockResolvedValue(0);
    prismaMock.sponsorPlacement.create.mockResolvedValue({ id: "placement_1" });
    dodoMock.checkoutSessions.create.mockResolvedValue({
      session_id: "checkout_1",
      checkout_url: "https://checkout.example",
    });
    prismaMock.sponsorPlacement.update.mockResolvedValue({ id: "placement_1" });

    await expect(
      createSponsorPlacementCheckout("tool_1", {
        id: "user_1",
        email: "founder@example.com",
        name: "Founder",
      }),
    ).resolves.toEqual({
      checkoutUrl: "https://checkout.example",
      checkoutId: "checkout_1",
    });
  });

  it("activates a paid placement for 30 days when inventory is available", async () => {
    const now = new Date("2026-04-29T00:00:00.000Z");
    vi.setSystemTime(now);
    prismaMock.sponsorPlacement.findUnique.mockResolvedValue({
      id: "placement_1",
      toolId: "tool_1",
      status: "PENDING_PAYMENT",
    });
    prismaMock.sponsorPlacement.count.mockResolvedValue(2);
    prismaMock.sponsorPlacement.update.mockResolvedValue({
      id: "placement_1",
      status: "ACTIVE",
    });

    await handleSponsorPlacementPaymentSucceeded({
      paymentId: "payment_1",
      checkoutSessionId: "checkout_1",
      metadata: { shipboostSponsorPlacementId: "placement_1" },
    });

    expect(prismaMock.sponsorPlacement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "placement_1" },
        data: expect.objectContaining({
          status: "ACTIVE",
          paidAt: now,
          startsAt: now,
          endsAt: new Date("2026-05-29T00:00:00.000Z"),
        }),
      }),
    );
  });

  it("lists only active unexpired public placements", async () => {
    prismaMock.sponsorPlacement.findMany.mockResolvedValue([]);

    await listActiveSponsorPlacements();

    expect(prismaMock.sponsorPlacement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ACTIVE",
          disabledAt: null,
          startsAt: { lte: expect.any(Date) },
          endsAt: { gt: expect.any(Date) },
        }),
        take: 3,
      }),
    );
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test -- src/server/services/sponsor-placement-service.test.ts
```

Expected: FAIL because `sponsor-placement-service.ts` does not exist.

- [ ] **Step 3: Implement service**

Create `src/server/services/sponsor-placement-service.ts`:

```ts
import { addDays } from "date-fns";

import { getDodoClient, getDodoDashboardReturnUrl } from "@/server/dodo";
import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";

const SPONSOR_SLOT_LIMIT = 3;
const SPONSOR_PLACEMENT_DAYS = 30;

type FounderLike = {
  id: string;
  email: string;
  name?: string | null;
};

function getActivePlacementWhere(now = new Date()) {
  return {
    status: "ACTIVE" as const,
    disabledAt: null,
    startsAt: { lte: now },
    endsAt: { gt: now },
  };
}

export async function countActiveSponsorPlacements(now = new Date()) {
  return prisma.sponsorPlacement.count({
    where: getActivePlacementWhere(now),
  });
}

export async function listFounderSponsorEligibleTools(founderId: string) {
  return prisma.tool.findMany({
    where: {
      ownerUserId: founderId,
      ...getPubliclyVisibleToolWhere(),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      websiteUrl: true,
      logoMedia: { select: { url: true } },
      sponsorPlacements: {
        where: getActivePlacementWhere(),
        select: { id: true, endsAt: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function listActiveSponsorPlacements(now = new Date()) {
  return prisma.sponsorPlacement.findMany({
    where: {
      ...getActivePlacementWhere(now),
      tool: getPubliclyVisibleToolWhere(now),
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

export async function createSponsorPlacementCheckout(
  toolId: string,
  founder: FounderLike,
) {
  const tool = await prisma.tool.findFirst({
    where: {
      id: toolId,
      ownerUserId: founder.id,
      ...getPubliclyVisibleToolWhere(),
      sponsorPlacements: {
        none: getActivePlacementWhere(),
      },
    },
    select: { id: true, name: true },
  });

  if (!tool) {
    throw new AppError(400, "Tool is not eligible for sponsor placement.");
  }

  if ((await countActiveSponsorPlacements()) >= SPONSOR_SLOT_LIMIT) {
    throw new AppError(409, "Sponsor placements are sold out.");
  }

  const env = getEnv();

  if (!env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID) {
    throw new AppError(500, "Dodo sponsor placement product is not configured.");
  }

  const placement = await prisma.sponsorPlacement.create({
    data: {
      toolId: tool.id,
      status: "PENDING_PAYMENT",
    },
    select: { id: true },
  });

  const checkout = await getDodoClient().checkoutSessions.create({
    product_cart: [
      {
        product_id: env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID,
        quantity: 1,
      },
    ],
    customer: {
      email: founder.email,
      name: founder.name ?? undefined,
    },
    return_url: `${getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/advertise?checkout=success`,
    metadata: {
      shipboostProduct: "sponsor_placement",
      shipboostToolId: tool.id,
      shipboostSponsorPlacementId: placement.id,
    },
  });

  if (!checkout.checkout_url) {
    throw new AppError(500, "Dodo checkout url is missing from the session response.");
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

export async function handleSponsorPlacementPaymentSucceeded(input: {
  paymentId: string;
  checkoutSessionId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const placementId =
    typeof input.metadata?.shipboostSponsorPlacementId === "string"
      ? input.metadata.shipboostSponsorPlacementId
      : null;

  const placement = await prisma.sponsorPlacement.findUnique({
    where: placementId
      ? { id: placementId }
      : { checkoutSessionId: input.checkoutSessionId ?? "" },
    select: { id: true, status: true },
  });

  if (!placement) {
    return null;
  }

  const now = new Date();

  if ((await countActiveSponsorPlacements(now)) >= SPONSOR_SLOT_LIMIT) {
    return prisma.sponsorPlacement.update({
      where: { id: placement.id },
      data: {
        status: "PAID_WAITLISTED",
        paidAt: now,
        paymentId: input.paymentId,
      },
    });
  }

  return prisma.sponsorPlacement.update({
    where: { id: placement.id },
    data: {
      status: "ACTIVE",
      paidAt: now,
      startsAt: now,
      endsAt: addDays(now, SPONSOR_PLACEMENT_DAYS),
      paymentId: input.paymentId,
      checkoutSessionId: input.checkoutSessionId ?? undefined,
    },
  });
}
```

- [ ] **Step 4: Run service tests**

Run:

```bash
npm run test -- src/server/services/sponsor-placement-service.test.ts
```

Expected: PASS.

---

### Task 3: Checkout Route and Dodo Webhook Routing

**Files:**
- Create: `src/app/api/dodo/checkout/sponsor-placement/route.ts`
- Modify: `src/app/api/dodo/webhooks/route.ts`
- Test: `src/app/api/dodo/webhooks/route.test.ts` if webhook route tests exist; otherwise extend `src/server/services/sponsor-placement-service.test.ts`

- [ ] **Step 1: Add checkout route**

Create `src/app/api/dodo/checkout/sponsor-placement/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { createSponsorPlacementCheckout } from "@/server/services/sponsor-placement-service";
import { sponsorPlacementCheckoutSchema } from "@/server/validators/sponsor-placement";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = sponsorPlacementCheckoutSchema.parse(await request.json());

    const checkout = await createSponsorPlacementCheckout(body.toolId, {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    return ok(checkout);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Route sponsor payment in webhook**

In `src/app/api/dodo/webhooks/route.ts`, import:

```ts
import { handleSponsorPlacementPaymentSucceeded } from "@/server/services/sponsor-placement-service";
```

Replace the `payment.succeeded` block with:

```ts
if (payload.type === "payment.succeeded" && payload.data.payment_id) {
  if (payload.data.metadata?.shipboostProduct === "sponsor_placement") {
    await handleSponsorPlacementPaymentSucceeded({
      paymentId: payload.data.payment_id,
      checkoutSessionId: payload.data.checkout_session_id ?? null,
      metadata: payload.data.metadata ?? {},
    });
  } else {
    await handlePremiumLaunchPaymentSucceeded({
      paymentId: payload.data.payment_id,
      checkoutSessionId: payload.data.checkout_session_id ?? null,
      metadata: payload.data.metadata ?? {},
    });
  }

  revalidateAllPublicContent();
}
```

- [ ] **Step 3: Verify webhook routing**

Run:

```bash
npm run test -- src/server/services/submission-payment-service.test.ts src/server/services/sponsor-placement-service.test.ts
```

Expected: PASS. Premium launch payment tests still cover the default route; sponsor service tests cover activation.

---

### Task 4: Public Cache and Sidebar Rendering

**Files:**
- Modify: `src/server/cache/public-content.ts`
- Modify: `src/components/public/showcase-layout.tsx`
- Create: `src/components/public/sidebar-sponsor-placements.tsx`

- [ ] **Step 1: Add public sponsor cache**

In `src/server/cache/public-content.ts`, import:

```ts
import { listActiveSponsorPlacements } from "@/server/services/sponsor-placement-service";
```

Add cache tag:

```ts
sponsorPlacements: "public:sponsor-placements",
```

Add revalidation helper:

```ts
export function revalidatePublicSponsorPlacements() {
  revalidateTag(PUBLIC_CACHE_TAGS.sponsorPlacements, "max");
  revalidatePath("/");
  revalidatePath("/launches/[board]", "page");
  revalidatePath("/categories/[slug]", "page");
  revalidatePath("/tags/[slug]", "page");
}
```

Add cached function:

```ts
export const getCachedActiveSponsorPlacements = cache(() =>
  unstable_cache(
    () => listActiveSponsorPlacements(),
    ["public-sponsor-placements", "v1"],
    {
      revalidate: PUBLIC_HOME_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.sponsorPlacements],
    },
  )(),
);
```

- [ ] **Step 2: Add sponsor sidebar component**

Create `src/components/public/sidebar-sponsor-placements.tsx`:

```tsx
import Link from "next/link";
import { Megaphone } from "lucide-react";

import { LogoFallback } from "@/components/ui/logo-fallback";

type SponsorPlacement = {
  id: string;
  tool: {
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
    toolCategories: Array<{
      category: { name: string; slug: string };
    }>;
  };
};

function EmptySponsorSlot() {
  return (
    <Link
      href="/advertise"
      className="group block w-full max-w-[250px] rounded-xl border border-dashed border-border bg-card/70 p-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Megaphone size={15} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black tracking-[0.18em] text-muted-foreground">
            SPONSOR SLOT
          </p>
          <p className="mt-1 text-xs font-black text-foreground">$59 for 30 days</p>
        </div>
      </div>
    </Link>
  );
}

function SponsorCard({ placement }: { placement: SponsorPlacement }) {
  const primaryCategory = placement.tool.toolCategories[0]?.category ?? null;

  return (
    <Link
      href={`/tools/${placement.tool.slug}`}
      className="group block w-full max-w-[250px] rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-black/5"
    >
      <div className="flex items-start gap-3">
        <LogoFallback
          name={placement.tool.name}
          src={placement.tool.logoMedia?.url}
          websiteUrl={placement.tool.websiteUrl}
          sizes="40px"
          className="h-10 w-10 rounded-lg border border-border"
          textClassName="text-xs"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black tracking-[0.18em] text-muted-foreground">
            SPONSORED
          </p>
          <h3 className="mt-1 line-clamp-1 text-xs font-black text-foreground">
            {placement.tool.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed text-muted-foreground">
            {placement.tool.tagline}
          </p>
          {primaryCategory ? (
            <p className="mt-2 truncate text-[9px] font-black tracking-widest text-muted-foreground/50">
              {primaryCategory.name}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function SidebarSponsorPlacements({
  placements,
}: {
  placements: SponsorPlacement[];
}) {
  const slots = Array.from({ length: 3 }, (_, index) => placements[index] ?? null);

  return (
    <>
      {slots.map((placement, index) =>
        placement ? (
          <SponsorCard key={placement.id} placement={placement} />
        ) : (
          <EmptySponsorSlot key={`empty-sponsor-${index}`} />
        ),
      )}
    </>
  );
}
```

- [ ] **Step 3: Wire left sidebar only**

In `src/components/public/showcase-layout.tsx`:

```tsx
import { SidebarSponsorPlacements } from "@/components/public/sidebar-sponsor-placements";
import { getCachedActiveSponsorPlacements } from "@/server/cache/public-content";
```

Load placements inside `ShowcaseLayout`:

```tsx
const sponsorPlacements = !isPrelaunch
  ? await getCachedActiveSponsorPlacements()
  : [];
```

Replace the three left `SponsorSlot` calls with:

```tsx
<SidebarSponsorPlacements placements={sponsorPlacements} />
```

Remove the three right sidebar `SponsorSlot` calls. Delete `SponsorSlot()` if unused.

- [ ] **Step 4: Verify sidebar build**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

---

### Task 5: Advertise Page and Founder Checkout UI

**Files:**
- Create: `src/app/advertise/page.tsx`
- Create: `src/components/public/advertise-sponsor-form.tsx`

- [ ] **Step 1: Create advertise client form**

Create `src/components/public/advertise-sponsor-form.tsx`:

```tsx
"use client";

import { useState } from "react";

import { apiRequest, toErrorMessage } from "@/components/admin/admin-console-shared";
import { Button } from "@/components/ui/button";

type EligibleTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  sponsorPlacements: Array<{ id: string; endsAt: string | Date | null }>;
};

export function AdvertiseSponsorForm({
  tools,
  soldOut,
}: {
  tools: EligibleTool[];
  soldOut: boolean;
}) {
  const [selectedToolId, setSelectedToolId] = useState(tools[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    if (!selectedToolId || soldOut) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await apiRequest<{ checkoutUrl: string }>(
        "/api/dodo/checkout/sponsor-placement",
        {
          method: "POST",
          body: JSON.stringify({ toolId: selectedToolId }),
        },
      );
      window.location.href = response.checkoutUrl;
    } catch (checkoutError) {
      setError(toErrorMessage(checkoutError));
      setLoading(false);
    }
  }

  if (soldOut) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm font-semibold text-muted-foreground">
        Sponsor placements are sold out right now. Check back when a slot opens.
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm font-semibold text-muted-foreground">
        You need an approved public ShipBoost tool before buying a sponsor placement.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <label className="block text-xs font-black tracking-widest text-muted-foreground">
        Select tool
      </label>
      <select
        value={selectedToolId}
        onChange={(event) => setSelectedToolId(event.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
      >
        {tools.map((tool) => (
          <option key={tool.id} value={tool.id}>
            {tool.name}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
      <Button type="button" onClick={startCheckout} disabled={loading || !selectedToolId}>
        {loading ? "Opening checkout..." : "Buy 30-day placement for $59"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create advertise page**

Create `src/app/advertise/page.tsx`:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdvertiseSponsorForm } from "@/components/public/advertise-sponsor-form";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/server/auth/session";
import {
  countActiveSponsorPlacements,
  listFounderSponsorEligibleTools,
} from "@/server/services/sponsor-placement-service";

export const metadata = {
  title: "Advertise on ShipBoost | Sponsor Placement",
  description:
    "Sponsor your approved ShipBoost tool in the left sidebar for 30 days.",
};

export default async function AdvertisePage() {
  const session = await getServerSession();
  const activeCount = await countActiveSponsorPlacements();
  const soldOut = activeCount >= 3;
  const tools = session
    ? await listFounderSponsorEligibleTools(session.user.id)
    : [];

  return (
    <main className="min-h-screen bg-muted/20 px-6 py-24">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-4">
          <p className="text-xs font-black tracking-[0.24em] text-primary">
            SPONSOR PLACEMENT
          </p>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Sponsor your tool on ShipBoost
          </h1>
          <p className="max-w-2xl text-base font-medium leading-relaxed text-muted-foreground">
            Get one of three left-sidebar sponsor placements for 30 days. Available for approved public ShipBoost tools.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {["$59 one-time", "30 days", "3 total slots"].map((item) => (
            <div key={item} className="rounded-xl border border-border bg-card p-4 text-sm font-black">
              {item}
            </div>
          ))}
        </div>

        {session ? (
          <AdvertiseSponsorForm tools={tools} soldOut={soldOut} />
        ) : (
          <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-5">
            <Button asChild>
              <Link href="/sign-in">Sign in to sponsor a tool</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/submit">Submit your tool</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify page build**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

---

### Task 6: Admin Sponsor Placement Panel

**Files:**
- Create: `src/app/api/admin/sponsor-placements/route.ts`
- Create: `src/app/api/admin/sponsor-placements/[placementId]/disable/route.ts`
- Create: `src/components/admin/sponsor-placement-panel.tsx`
- Modify: `src/components/admin/admin-console.tsx`
- Modify: `src/components/admin/admin-console-shared.ts`
- Modify: `src/server/services/sponsor-placement-service.ts`

- [ ] **Step 1: Add admin service functions**

Append to `src/server/services/sponsor-placement-service.ts`:

```ts
export async function listAdminSponsorPlacements() {
  return prisma.sponsorPlacement.findMany({
    select: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
      paidAt: true,
      disabledAt: true,
      checkoutSessionId: true,
      paymentId: true,
      tool: {
        select: {
          id: true,
          slug: true,
          name: true,
          owner: { select: { email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function disableSponsorPlacement(placementId: string) {
  return prisma.sponsorPlacement.update({
    where: { id: placementId },
    data: {
      status: "DISABLED",
      disabledAt: new Date(),
    },
  });
}
```

- [ ] **Step 2: Add admin API routes**

Create `src/app/api/admin/sponsor-placements/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { requireRole } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { listAdminSponsorPlacements } from "@/server/services/sponsor-placement-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    return ok(await listAdminSponsorPlacements());
  } catch (error) {
    return errorResponse(error);
  }
}
```

Create `src/app/api/admin/sponsor-placements/[placementId]/disable/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { revalidatePublicSponsorPlacements } from "@/server/cache/public-content";
import { requireRole } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { disableSponsorPlacement } from "@/server/services/sponsor-placement-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placementId: string }> },
) {
  try {
    await requireRole(request, "ADMIN");
    const { placementId } = await params;
    const placement = await disableSponsorPlacement(placementId);
    revalidatePublicSponsorPlacements();
    return ok(placement);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 3: Add admin UI types and panel**

In `src/components/admin/admin-console-shared.ts`, add:

```ts
export type SponsorPlacement = {
  id: string;
  status: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED" | "DISABLED" | "PAID_WAITLISTED";
  startsAt: string | null;
  endsAt: string | null;
  paidAt: string | null;
  disabledAt: string | null;
  checkoutSessionId: string | null;
  paymentId: string | null;
  tool: {
    id: string;
    slug: string;
    name: string;
    owner: { email: string } | null;
  };
};
```

Create `src/components/admin/sponsor-placement-panel.tsx`:

```tsx
"use client";

import type { SponsorPlacement } from "@/components/admin/admin-console-shared";

export function SponsorPlacementPanel({
  placements,
  onDisable,
  isActionPending,
}: {
  placements: SponsorPlacement[];
  onDisable: (placementId: string) => void;
  isActionPending: (action: string) => boolean;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight">Sponsor placements</h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Manage paid left-sidebar placements.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Tool</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ends</th>
              <th className="px-3 py-2">Checkout</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((placement) => (
              <tr key={placement.id} className="border-t border-border">
                <td className="px-3 py-3 font-black">{placement.tool.name}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {placement.tool.owner?.email ?? "No owner"}
                </td>
                <td className="px-3 py-3 font-black">{placement.status}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {placement.endsAt ? new Date(placement.endsAt).toLocaleDateString() : "-"}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {placement.checkoutSessionId ?? "-"}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    disabled={placement.status === "DISABLED" || isActionPending(`sponsor-disable:${placement.id}`)}
                    onClick={() => onDisable(placement.id)}
                    className="rounded-lg border border-border px-3 py-1 font-black text-destructive disabled:opacity-40"
                  >
                    Disable
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Wire admin console**

In `src/components/admin/admin-console.tsx`, add `"sponsors"` to `AdminNavSection`, import `Megaphone`, import panel and type, fetch `/api/admin/sponsor-placements` in the same boot flow as tools, and render:

```tsx
{activeNav === "sponsors" && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <SponsorPlacementPanel
      placements={sponsorPlacements}
      onDisable={handleSponsorPlacementDisable}
      isActionPending={isActionPending}
    />
  </div>
)}
```

Add handler:

```ts
async function handleSponsorPlacementDisable(placementId: string) {
  const action = `sponsor-disable:${placementId}`;
  setPendingAction(action);
  try {
    await apiRequest(`/api/admin/sponsor-placements/${placementId}/disable`, {
      method: "POST",
    });
    setSponsorPlacements((current) =>
      current.map((placement) =>
        placement.id === placementId
          ? { ...placement, status: "DISABLED", disabledAt: new Date().toISOString() }
          : placement,
      ),
    );
  } finally {
    setPendingAction(null);
  }
}
```

- [ ] **Step 5: Verify admin types**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

---

### Task 7: Renewal Reminder and Expiry Cron

**Files:**
- Modify: `src/server/email/transactional.ts`
- Modify: `src/server/services/sponsor-placement-service.ts`
- Create: `src/app/api/cron/sponsor-placements/route.ts`
- Test: `src/server/services/sponsor-placement-service.test.ts`

- [ ] **Step 1: Add email sender**

In `src/server/email/transactional.ts`, add:

```ts
export async function sendSponsorPlacementRenewalReminderEmailMessage(input: {
  to: string;
  toolName: string;
  endsAt: string;
  advertiseUrl: string;
}) {
  const subject = `${input.toolName} sponsor placement ends soon`;
  const preview = `Renew your ShipBoost sponsor placement before it ends on ${input.endsAt}.`;
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      eyebrow("Sponsor placement"),
      h1("Your sponsor placement ends soon"),
      paragraph(
        `<strong>${escapeHtml(input.toolName)}</strong> is sponsored on ShipBoost until <strong>${escapeHtml(input.endsAt)}</strong>.`,
      ),
      paragraph("Renew with another one-time 30-day placement if you want to keep the sidebar spot."),
      ctaButton(input.advertiseUrl, "Renew placement"),
      linkParagraph(input.advertiseUrl),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: `${preview}\n\nRenew: ${input.advertiseUrl}`,
  });
}
```

- [ ] **Step 2: Add cron service function**

Append to `src/server/services/sponsor-placement-service.ts`:

```ts
import { sendSponsorPlacementRenewalReminderEmailMessage } from "@/server/email/transactional";

export async function processSponsorPlacementLifecycle(now = new Date()) {
  const expired = await prisma.sponsorPlacement.updateMany({
    where: {
      status: "ACTIVE",
      endsAt: { lte: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

  const reminderThreshold = addDays(now, 7);
  const placements = await prisma.sponsorPlacement.findMany({
    where: {
      status: "ACTIVE",
      renewalReminderSentAt: null,
      endsAt: {
        gt: now,
        lte: reminderThreshold,
      },
    },
    select: {
      id: true,
      endsAt: true,
      tool: {
        select: {
          name: true,
          owner: { select: { email: true } },
        },
      },
    },
  });

  let remindersSent = 0;
  const advertiseUrl = `${getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/advertise`;

  for (const placement of placements) {
    if (!placement.endsAt || !placement.tool.owner?.email) {
      continue;
    }

    await sendSponsorPlacementRenewalReminderEmailMessage({
      to: placement.tool.owner.email,
      toolName: placement.tool.name,
      endsAt: placement.endsAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      advertiseUrl,
    });

    await prisma.sponsorPlacement.update({
      where: { id: placement.id },
      data: { renewalReminderSentAt: now },
    });

    remindersSent += 1;
  }

  return {
    expiredCount: expired.count,
    remindersSent,
  };
}
```

- [ ] **Step 3: Add cron route**

Create `src/app/api/cron/sponsor-placements/route.ts`:

```ts
import { revalidatePublicSponsorPlacements } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { processSponsorPlacementLifecycle } from "@/server/services/sponsor-placement-service";

export async function GET(request: Request) {
  const env = getEnv();
  const authHeader = request.headers.get("authorization");

  if (env.CRON_SECRET && authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processSponsorPlacementLifecycle();
  revalidatePublicSponsorPlacements();

  return Response.json(result);
}
```

- [ ] **Step 4: Add lifecycle tests**

Add tests to `src/server/services/sponsor-placement-service.test.ts` for:

```ts
it("marks ended active sponsor placements as expired", async () => {
  prismaMock.sponsorPlacement.updateMany.mockResolvedValue({ count: 2 });
  prismaMock.sponsorPlacement.findMany.mockResolvedValue([]);

  const { processSponsorPlacementLifecycle } = await import(
    "@/server/services/sponsor-placement-service"
  );

  await expect(
    processSponsorPlacementLifecycle(new Date("2026-04-29T00:00:00.000Z")),
  ).resolves.toEqual({ expiredCount: 2, remindersSent: 0 });
});
```

- [ ] **Step 5: Verify lifecycle**

Run:

```bash
npm run test -- src/server/services/sponsor-placement-service.test.ts
```

Expected: PASS.

---

### Task 8: Final Verification

**Files:**
- All sponsor placement files

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm run test -- src/server/services/sponsor-placement-service.test.ts src/server/services/submission-payment-service.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Manual browser check**

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/advertise
http://localhost:3000/
http://localhost:3000/admin
```

Expected:

- `/advertise` shows the sponsor offer.
- Public home left sidebar shows three sponsor slots.
- Right sidebar does not show sponsor slots.
- Admin has a Sponsors tab.

---

## Self-Review

- Spec coverage: database, checkout, public sidebar, left-only placement, admin disable, renewal reminder, expiry, and Dodo routing are each covered.
- Placeholder scan: no `TBD`, `TODO`, or undefined deferred tasks remain.
- Type consistency: `SponsorPlacementStatus`, `DODO_SPONSOR_PLACEMENT_PRODUCT_ID`, `shipboostProduct=sponsor_placement`, and route paths are consistent across tasks.
