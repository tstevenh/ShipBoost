# Prelaunch Launchpad & Pricing Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a founder-first April prelaunch experience that queues launches behind a May 1, 2026 UTC go-live date, renames Featured Launch to Premium Launch in the UI, tightens pricing/offer copy, adds robust text-based logo fallbacks, and shortens taglines so public metadata stays disciplined.

**Architecture:** Keep the current lightweight ISR/static public architecture. Add a small amount of configuration for launchpad go-live and founding offer limits, update scheduling logic so free launches use weekly capacity while premium launches choose a week without being blocked by the free cap, and restrict all copy/branding changes to UI surfaces instead of changing internal enum names.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, Vitest, Tailwind CSS, Next image/cache APIs.

---

## File Structure

### Backend / scheduling / visibility

- Modify: `src/server/env.ts`
  - Add validated env values for launchpad go-live and founding offer thresholds.
- Modify: `.env.example`
  - Document the new env values.
- Modify: `src/server/services/time.ts`
  - Add UTC-safe helpers for start-of-week and launchpad floor dates.
- Modify: `src/server/services/launch-scheduling.ts`
  - Replace daily free-slot logic with weekly-cap logic anchored to a UTC launchpad go-live floor.
- Modify: `src/server/services/submission-review-service.ts`
  - Schedule free launches into weekly slots starting at or after the go-live date.
- Modify: `src/server/services/submission-payment-service.ts`
  - Enforce premium launch dates at or after the go-live date while allowing premium launches to bypass the free-slot cap.
- Modify: `src/server/services/public-tool-visibility.ts`
  - Keep queued launches non-public before the official go-live date.
- Test: `src/server/services/submission-review-service.test.ts`
- Test: `src/server/services/submission-payment-service.test.ts`
- Test: `src/server/services/public-tool-visibility.test.ts`
- Add: `src/server/services/launch-scheduling.test.ts`

### Public UI / pricing / prelaunch

- Modify: `src/app/page.tsx`
  - Make prelaunch mode founder-first and set weekly messaging on home.
- Modify: `src/components/public/prelaunch-surface.tsx`
  - Rewrite positioning, CTA hierarchy, and launch messaging around May 1, 2026 UTC.
- Modify: `src/components/public/home-lead-magnet-form.tsx`
  - Demote it to a secondary CTA.
- Modify: `src/components/ui/hero-minimalism.tsx`
  - Make the hero explicitly speak to the launch date and reserved launch weeks.
- Modify: `src/app/pricing/page.tsx`
  - Rename Featured Launch to Premium Launch, add founding-price presentation, update DFY CTA.
- Modify: `src/components/founder/submit-product-form.tsx`
  - Rename featured UI copy to premium, switch free launch messaging to weekly launchpad, and reflect `$19 -> $9` founding offer.
- Modify: `src/app/dashboard/page.tsx`
  - Update any “featured launch” success copy shown after checkout.
- Modify: `src/components/founder/founder-dashboard.tsx`
  - Update founder-facing labels from featured to premium where visible.

### Logo fallback / tagline / metadata

- Add: `src/components/ui/logo-fallback.tsx`
  - Shared initials-based fallback with deterministic two-letter output.
- Modify: `src/components/public/public-directory-tool-card.tsx`
- Modify: `src/components/ToolCard.tsx`
- Modify: `src/components/public/public-tool-card.tsx`
- Modify: `src/components/public/launch-board.tsx`
  - Swap ad hoc fallback spans for the shared fallback component and attach image error fallback where needed.
- Modify: `src/server/validators/submission.ts`
  - Lower tagline max length from `140` to `60`.
- Modify: `src/app/tools/[slug]/page.tsx`
  - Trim/fallback meta title generation so it never produces bloated titles from long taglines.

---

### Task 1: Add launchpad go-live config and weekly free-slot scheduling

**Files:**
- Modify: `src/server/env.ts`
- Modify: `.env.example`
- Modify: `src/server/services/time.ts`
- Modify: `src/server/services/launch-scheduling.ts`
- Test: `src/server/services/launch-scheduling.test.ts`

- [ ] **Step 1: Write the failing scheduling tests**

```ts
import { describe, expect, it, vi } from "vitest";

import {
  LAUNCHPAD_GO_LIVE_AT_UTC,
  scheduleNextFreeLaunchDate,
} from "@/server/services/launch-scheduling";

describe("launch-scheduling", () => {
  it("never schedules a free launch before the go-live floor", async () => {
    const db = {
      launch: {
        count: vi.fn().mockResolvedValue(0),
      },
    };

    const result = await scheduleNextFreeLaunchDate(db as never, {
      weeklySlots: 10,
      fromDate: new Date("2026-04-14T12:00:00.000Z"),
      goLiveAt: new Date("2026-05-01T00:00:00.000Z"),
    });

    expect(result.toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("moves to the next week once the current week is full", async () => {
    const db = {
      launch: {
        count: vi
          .fn()
          .mockResolvedValueOnce(10)
          .mockResolvedValueOnce(3),
      },
    };

    const result = await scheduleNextFreeLaunchDate(db as never, {
      weeklySlots: 10,
      fromDate: new Date("2026-05-01T00:00:00.000Z"),
      goLiveAt: new Date("2026-05-01T00:00:00.000Z"),
    });

    expect(result.toISOString()).toBe("2026-05-08T00:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/server/services/launch-scheduling.test.ts`
Expected: FAIL because the new test file and weekly scheduling options do not exist yet.

- [ ] **Step 3: Add env and UTC helpers**

```ts
// src/server/env.ts
  LAUNCHPAD_GO_LIVE_AT: z.string().trim().datetime().default("2026-05-01T00:00:00Z"),
  FREE_LAUNCH_SLOTS_PER_WEEK: z.coerce.number().int().positive().default(10),
  FOUNDING_PREMIUM_LAUNCH_LIMIT: z.coerce.number().int().positive().default(100),
```

```ts
// src/server/services/time.ts
export function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addUtcDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * 24 * 60 * 60 * 1000);
}

export function startOfUtcWeek(date: Date) {
  const day = date.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  return addUtcDays(startOfUtcDay(date), -offset);
}
```

- [ ] **Step 4: Implement weekly scheduling**

```ts
// src/server/services/launch-scheduling.ts
export const DEFAULT_FREE_LAUNCH_SLOTS_PER_WEEK = 10;
export const LAUNCHPAD_GO_LIVE_AT_UTC = new Date(getEnv().LAUNCHPAD_GO_LIVE_AT);

export async function scheduleNextFreeLaunchDate(
  db: LaunchSchedulingClient = prisma,
  options?: {
    weeklySlots?: number;
    fromDate?: Date;
    goLiveAt?: Date;
  },
) {
  const weeklySlots = options?.weeklySlots ?? DEFAULT_FREE_LAUNCH_SLOTS_PER_WEEK;
  const goLiveAt = options?.goLiveAt ?? LAUNCHPAD_GO_LIVE_AT_UTC;
  let cursor = startOfUtcDay(
    new Date(Math.max((options?.fromDate ?? new Date()).getTime(), goLiveAt.getTime())),
  );

  for (let weekOffset = 0; weekOffset < 104; weekOffset += 1) {
    const weekStart = weekOffset === 0 ? cursor : addUtcDays(startOfUtcWeek(cursor), weekOffset * 7);
    const weekEnd = addUtcDays(weekStart, 7);
    const scheduledCount = await db.launch.count({
      where: {
        launchType: "FREE",
        status: { in: ["APPROVED", "LIVE"] },
        launchDate: { gte: weekStart, lt: weekEnd },
      },
    });

    if (scheduledCount < weeklySlots) {
      return weekStart;
    }
  }

  throw new Error("Unable to find a free launch week within the next two years.");
}
```

- [ ] **Step 5: Run tests and commit**

Run:
- `npm run test -- src/server/services/launch-scheduling.test.ts`
- `npx tsc --noEmit`

Expected: PASS

```bash
git add .env.example src/server/env.ts src/server/services/time.ts src/server/services/launch-scheduling.ts src/server/services/launch-scheduling.test.ts
git commit -m "feat: add launchpad go-live config and weekly free launch scheduling"
```

### Task 2: Align approval/payment flows with May 1 UTC and weekly launch rules

**Files:**
- Modify: `src/server/services/submission-review-service.ts`
- Modify: `src/server/services/submission-payment-service.ts`
- Modify: `src/server/services/public-tool-visibility.ts`
- Test: `src/server/services/submission-review-service.test.ts`
- Test: `src/server/services/submission-payment-service.test.ts`
- Test: `src/server/services/public-tool-visibility.test.ts`

- [ ] **Step 1: Write the failing behavior tests**

```ts
it("schedules approved free launches into the next weekly slot", async () => {
  scheduleNextFreeLaunchDateMock.mockResolvedValueOnce(
    new Date("2026-05-01T00:00:00.000Z"),
  );

  await reviewSubmission("submission_1", {
    action: "APPROVE",
    publishTool: true,
    goLiveNow: true,
  }, "admin_1");

  expect(scheduleNextFreeLaunchDateMock).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      weeklySlots: 10,
      fromDate: expect.any(Date),
    }),
  );
});

it("rejects premium launch dates before the launchpad go-live date", async () => {
  await expect(
    rescheduleFeaturedLaunch("submission_1", {
      preferredLaunchDate: new Date("2026-04-28T00:00:00.000Z"),
    }, founder),
  ).rejects.toThrow("Choose May 1, 2026 UTC or later.");
});
```

- [ ] **Step 2: Run targeted tests**

Run:
- `npm run test -- src/server/services/submission-review-service.test.ts`
- `npm run test -- src/server/services/submission-payment-service.test.ts`
- `npm run test -- src/server/services/public-tool-visibility.test.ts`

Expected: FAIL on the new weekly/go-live assertions.

- [ ] **Step 3: Update review and payment services**

```ts
// src/server/services/submission-review-service.ts
const launchDate = isFreeLaunch
  ? await scheduleNextFreeLaunchDate(tx, {
      weeklySlots: getEnv().FREE_LAUNCH_SLOTS_PER_WEEK,
      fromDate: new Date(),
    })
  : preferredLaunchDate < new Date(getEnv().LAUNCHPAD_GO_LIVE_AT)
    ? new Date(getEnv().LAUNCHPAD_GO_LIVE_AT)
    : preferredLaunchDate;
```

```ts
// src/server/services/submission-payment-service.ts
const goLiveFloor = new Date(getEnv().LAUNCHPAD_GO_LIVE_AT);
const launchDate = submission.preferredLaunchDate
  ? startOfUtcDay(submission.preferredLaunchDate)
  : goLiveFloor;

if (launchDate < goLiveFloor) {
  throw new AppError(400, "Choose May 1, 2026 UTC or later.");
}
```

- [ ] **Step 4: Keep queued launches non-public until the date is due**

```ts
// src/server/services/public-tool-visibility.test.ts
it("does not treat future approved launches as public", () => {
  expect(
    isLaunchPubliclyVisible({
      status: "APPROVED",
      launchDate: new Date("2026-05-08T00:00:00.000Z"),
    }, new Date("2026-05-01T00:00:00.000Z")),
  ).toBe(false);
});
```

No production logic change is needed here beyond preserving the current `launchDate <= now` rule; the test locks that behavior down so prelaunch queues stay hidden.

- [ ] **Step 5: Run tests and commit**

Run:
- `npm run test -- src/server/services/submission-review-service.test.ts`
- `npm run test -- src/server/services/submission-payment-service.test.ts`
- `npm run test -- src/server/services/public-tool-visibility.test.ts`
- `npx tsc --noEmit`

Expected: PASS

```bash
git add src/server/services/submission-review-service.ts src/server/services/submission-payment-service.ts src/server/services/public-tool-visibility.ts src/server/services/submission-review-service.test.ts src/server/services/submission-payment-service.test.ts src/server/services/public-tool-visibility.test.ts
git commit -m "feat: queue launches behind may go-live and weekly capacity"
```

### Task 3: Refresh pricing and founder plan copy without renaming internal enums

**Files:**
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/components/founder/submit-product-form.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/founder/founder-dashboard.tsx`

- [ ] **Step 1: Write the copy constants first**

```ts
const foundingPremiumPrice = {
  original: "$19",
  discounted: "$9",
  label: "Founding price for the first 100 Premium Launches",
};

const doneForYouTier = {
  name: "Done-for-you Submission",
  price: "From $99",
  ctaLabel: "Get DFY help",
  ctaHref: "https://www.aidirectori.es/?via=ShipBoost",
};
```

- [ ] **Step 2: Update the pricing page UI**

```tsx
// src/app/pricing/page.tsx
{
  name: "Premium Launch",
  price: "$9",
  originalPrice: "$19",
  description:
    "Pick your launch week, get premium placement in the opening cohort, and skip the badge requirement.",
  eyebrow: "Founding offer",
  foundingSpotsLabel: "First 100 Premium Launches",
  ctaLabel: "Reserve premium launch",
  ctaHref: "/submit",
  points: [
    "Choose your launch week",
    "Premium placement in the weekly launchpad",
    "No backlink required",
    "Priority ordering over free launches",
  ],
}
```

```tsx
// pricing price display
<div className="mt-4 flex items-end gap-3">
  <span className="text-lg font-black text-muted-foreground line-through">
    $19
  </span>
  <span className="text-5xl font-black tracking-tighter text-foreground">
    $9
  </span>
</div>
<p className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary">
  Founding price for the first 100 premium launches
</p>
```

- [ ] **Step 3: Update submit/dashboard labels only**

```tsx
// src/components/founder/submit-product-form.tsx
<h3 className="text-2xl font-black mb-2">Premium Launch</h3>
<span className="text-sm font-black line-through text-muted-foreground">$19</span>
<span className="text-4xl font-black">$9</span>
<p className="text-[10px] font-black uppercase tracking-widest text-primary">
  Founding price for the first 100 premium launches
</p>
```

```ts
// keep internal values unchanged
submissionType: "FEATURED_LAUNCH"
```

- [ ] **Step 4: Wire the DFY external CTA**

```tsx
<Link
  href="https://www.aidirectori.es/?via=ShipBoost"
  target="_blank"
  rel="noreferrer"
  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-6 py-4 text-sm font-black text-background"
>
  Get DFY help
  <ArrowRight size={16} />
</Link>
```

- [ ] **Step 5: Verify and commit**

Run:
- `npx tsc --noEmit`
- `npm run build`

Expected: PASS

```bash
git add src/app/pricing/page.tsx src/components/founder/submit-product-form.tsx src/app/dashboard/page.tsx src/components/founder/founder-dashboard.tsx
git commit -m "feat: rename premium launch UI and refresh pricing offers"
```

### Task 4: Make the April homepage founder-first for the May 1 UTC launch

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/public/prelaunch-surface.tsx`
- Modify: `src/components/public/home-lead-magnet-form.tsx`
- Modify: `src/components/ui/hero-minimalism.tsx`

- [ ] **Step 1: Rewrite hero copy to state the launch date and goal**

```tsx
// src/components/ui/hero-minimalism.tsx
<div className="hero-kicker">Launching May 1, 2026 UTC</div>
<h1 className="hero-title">Reserve your launch week.<br />Join the opening cohort.</h1>
<p className="hero-subtitle">
  ShipBoost is opening with a curated weekly launchpad for serious SaaS founders.
  Submit in April to line up your May launch.
</p>
```

- [ ] **Step 2: Make submit the primary CTA in prelaunch mode**

```tsx
// src/components/public/prelaunch-surface.tsx
<Link href="/submit" className="...">
  Reserve your launch week
</Link>
<Link href="/pricing" className="...">
  See launch plans
</Link>
```

Use supporting copy:

```tsx
<p className="text-xl font-medium leading-relaxed text-muted-foreground/80 max-w-2xl">
  ShipBoost opens on May 1, 2026 UTC. We are now curating the first weekly launch cohorts.
  Submit now to secure a free or premium launch week before the public opening.
</p>
```

- [ ] **Step 3: Demote the lead magnet**

```tsx
// src/components/public/home-lead-magnet-form.tsx
<p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 uppercase mb-4">
  Secondary resource
</p>
<h2 className="text-3xl font-black tracking-tight text-foreground mb-6 lowercase">
  Get the 800+ startup directories list.
</h2>
```

Place this block below the founder CTA section instead of at the top of the prelaunch page.

- [ ] **Step 4: Update home page launchpad framing**

```tsx
// src/app/page.tsx
const currentPeriod = "weekly";
```

```tsx
const periodLabels = {
  weekly: "Opening Cohort",
  monthly: "This Month",
  yearly: "This Year",
};
```

If `isPrelaunch`, do not render launch-board language that implies live daily activity.

- [ ] **Step 5: Verify and commit**

Run:
- `npx tsc --noEmit`
- `npm run build`
- `curl -sS http://127.0.0.1:3000/ | rg "Launching May 1, 2026 UTC|Reserve your launch week"`

Expected: PASS and both strings present.

```bash
git add src/app/page.tsx src/components/public/prelaunch-surface.tsx src/components/public/home-lead-magnet-form.tsx src/components/ui/hero-minimalism.tsx
git commit -m "feat: reposition prelaunch home around may opening cohort"
```

### Task 5: Add robust text-based logo fallbacks and tighten tagline limits

**Files:**
- Add: `src/components/ui/logo-fallback.tsx`
- Modify: `src/components/public/public-directory-tool-card.tsx`
- Modify: `src/components/ToolCard.tsx`
- Modify: `src/components/public/public-tool-card.tsx`
- Modify: `src/components/public/launch-board.tsx`
- Modify: `src/server/validators/submission.ts`
- Modify: `src/app/tools/[slug]/page.tsx`

- [ ] **Step 1: Add the shared initials helper**

```tsx
// src/components/ui/logo-fallback.tsx
export function getLogoFallbackText(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "SB";
}

export function LogoFallback({ name, className }: { name: string; className?: string }) {
  return <span className={className}>{getLogoFallbackText(name)}</span>;
}
```

- [ ] **Step 2: Apply it to card surfaces**

```tsx
// src/components/public/public-directory-tool-card.tsx
const [logoFailed, setLogoFailed] = useState(false);

{logoUrl && !logoFailed ? (
  <Image
    src={logoUrl}
    alt={`${name} logo`}
    fill
    sizes="48px"
    className="object-cover"
    onError={() => setLogoFailed(true)}
  />
) : (
  <LogoFallback name={name} className="text-lg font-bold text-muted-foreground/50" />
)}
```

Mirror the same pattern in `ToolCard`, `PublicToolCard`, and `LaunchBoard`.

- [ ] **Step 3: Lower the stored tagline cap**

```ts
// src/server/validators/submission.ts
tagline: z.string().trim().min(10).max(60),
```

- [ ] **Step 4: Defensively trim meta title generation**

```ts
// src/app/tools/[slug]/page.tsx
function trimForMetaTagline(tagline: string | null | undefined) {
  if (!tagline) return "";
  return tagline.trim().slice(0, 60).trim();
}
```

Then use:

```ts
return `Discover ${tool.name} on ShipBoost - ${trimForMetaTagline(tool.tagline)}`;
```

- [ ] **Step 5: Verify and commit**

Run:
- `npx tsc --noEmit`
- `npm run build`

Expected: PASS

```bash
git add src/components/ui/logo-fallback.tsx src/components/public/public-directory-tool-card.tsx src/components/ToolCard.tsx src/components/public/public-tool-card.tsx src/components/public/launch-board.tsx src/server/validators/submission.ts src/app/tools/[slug]/page.tsx
git commit -m "feat: add logo fallbacks and shorten public taglines"
```

### Task 6: Add a server-rendered founding-spots counter without client polling

**Files:**
- Modify: `src/app/pricing/page.tsx`
- Optionally add: `src/server/services/founding-offer-service.ts`
- Test: `src/server/services/founding-offer-service.test.ts`

- [ ] **Step 1: Add a tiny query helper**

```ts
// src/server/services/founding-offer-service.ts
import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";

export async function getRemainingFoundingPremiumLaunchSpots() {
  const limit = getEnv().FOUNDING_PREMIUM_LAUNCH_LIMIT;
  const used = await prisma.submission.count({
    where: {
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
    },
  });
  return Math.max(limit - used, 0);
}
```

- [ ] **Step 2: Add the pricing-page display**

```tsx
// src/app/pricing/page.tsx
const foundingSpotsLeft = await getRemainingFoundingPremiumLaunchSpots();
```

```tsx
<p className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary">
  {foundingSpotsLeft} of 100 founding spots left
</p>
```

- [ ] **Step 3: Do not add client polling**

Keep this server-rendered and rely on the page’s existing revalidation:

```ts
export const revalidate = 300;
```

- [ ] **Step 4: Verify the rendering**

Run:
- `npx tsc --noEmit`
- `curl -sS http://127.0.0.1:3000/pricing | rg "founding spots left"`

Expected: PASS and a static server-rendered count is present.

- [ ] **Step 5: Commit**

```bash
git add src/app/pricing/page.tsx src/server/services/founding-offer-service.ts src/server/services/founding-offer-service.test.ts
git commit -m "feat: add founding premium launch spot counter"
```

---

## Self-Review Checklist

- Spec coverage:
  - May 1, 2026 UTC launchpad floor: covered in Tasks 1-2.
  - Weekly launchpad with `8-10` free slots: covered in Tasks 1-2.
  - Premium Launch rename and `$19 -> $9` founding copy: covered in Task 3.
  - DFY CTA to `https://www.aidirectori.es/?via=ShipBoost`: covered in Task 3.
  - Founder-first prelaunch homepage: covered in Task 4.
  - Text-based logo fallback: covered in Task 5.
  - Tagline limit reduction and meta-title safety: covered in Task 5.
  - Lightweight founding-spots counter: covered in Task 6.
- Placeholder scan:
  - No `TODO`/`TBD` markers remain.
- Type consistency:
  - Internal enum names remain `FEATURED_LAUNCH`/`FEATURED`; UI copy changes to “Premium Launch” only.

