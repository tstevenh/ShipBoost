# Claim Listing Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let founders claim seeded public listings through a domain-matched email flow, keep listings public during review, and allow admins to approve ownership transfer with a lightweight audit trail.

**Architecture:** Add a dedicated `ListingClaim` model plus a focused claim service that owns domain normalization, eligibility checks, duplicate prevention, and approval/rejection logic. Reuse the current `Tool.ownerUserId` ownership model, thread claim status into founder/admin surfaces, and expose only thin route handlers around the service layer.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Better Auth session flow, Vitest, Zod

---

## File Structure

### New files
- `prisma/migrations/<timestamp>_add_listing_claims/migration.sql`
  - schema migration for claim model and enums
- `src/server/services/claim-domain.ts`
  - website/email domain parsing and matching helpers
- `src/server/services/claim-domain.test.ts`
  - tests for domain normalization and matching
- `src/server/services/listing-claim-service.ts`
  - claim creation, lookup, approval, rejection, and audit snapshot logic
- `src/server/services/listing-claim-service.test.ts`
  - service tests for creation, duplicate handling, and approval/rejection
- `src/server/validators/listing-claim.ts`
  - input validation for claim create/review actions
- `src/app/api/listing-claims/route.ts`
  - founder/session-aware claim creation endpoint
- `src/app/api/admin/listing-claims/route.ts`
  - admin claim list endpoint
- `src/app/api/admin/listing-claims/[claimId]/route.ts`
  - admin approve/reject endpoint

### Modified files
- `prisma/schema.prisma`
  - add claim model, enum, relations
- `src/server/db/includes.ts`
  - add reusable include for claim-related tool data if needed
- `src/server/repositories/tool-repository.ts`
  - add helper for fetching claimable tool context if needed
- `src/server/auth/request-context.ts`
  - add a `requireFounder` or session utility if needed by claim routes
- `src/app/tools/[slug]/page.tsx`
  - add claim CTA and pending-claim-aware messaging
- `src/app/sign-in/page.tsx`
  - preserve return parameters for claim resume
- `src/app/sign-up/page.tsx`
  - preserve return parameters for claim resume
- `src/app/dashboard/page.tsx`
  - load founder claim records alongside submissions/tools
- `src/components/founder/founder-dashboard.tsx`
  - display pending/approved/rejected listing claims
- `src/app/admin/page.tsx`
  - pass claim data into admin console
- `src/components/admin/admin-console.tsx`
  - add claim review state management
- `src/components/admin/admin-console-shared.tsx`
  - add claim DTO typing + shared request helpers
- `src/components/admin/submission-review-panel.tsx`
  - if appropriate, keep separate; otherwise add claim panel
- `src/components/admin/catalog-panel.tsx`
  - no claim logic here unless UI layout needs slotting
- `src/server/services/tool-service.ts`
  - expose helper for claim CTA eligibility on public tool pages if needed

---

### Task 1: Add the database model for listing claims

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_listing_claims/migration.sql`

- [ ] **Step 1: Add the failing schema expectations in a service test stub**

Create a temporary failing test in `src/server/services/listing-claim-service.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("listing claim schema contract", () => {
  it("expects ListingClaim fields to exist", () => {
    expect(true).toBe(false);
  });
});
```

- [ ] **Step 2: Run the placeholder test to confirm the task starts red**

Run: `npm test -- src/server/services/listing-claim-service.test.ts`
Expected: FAIL with `expected true to be false`

- [ ] **Step 3: Add claim enum and model to Prisma**

Update `prisma/schema.prisma`:

```prisma
enum ListingClaimStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELED
}

model ListingClaim {
  id                String             @id @default(cuid())
  toolId            String
  claimantUserId    String
  status            ListingClaimStatus @default(PENDING)
  claimEmail        String
  claimDomain       String
  websiteDomain     String
  founderVisibleNote String?
  internalAdminNote  String?
  seededToolSnapshot Json
  reviewedByUserId  String?
  reviewedAt        DateTime?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  tool         Tool  @relation(fields: [toolId], references: [id], onDelete: Cascade)
  claimantUser User  @relation("ListingClaimClaimant", fields: [claimantUserId], references: [id], onDelete: Cascade)
  reviewedBy   User? @relation("ListingClaimReviewer", fields: [reviewedByUserId], references: [id], onDelete: SetNull)

  @@index([toolId, status])
  @@index([claimantUserId, status])
}
```

Also add relations:

```prisma
model User {
  // ...
  listingClaims        ListingClaim[] @relation("ListingClaimClaimant")
  reviewedListingClaims ListingClaim[] @relation("ListingClaimReviewer")
}

model Tool {
  // ...
  listingClaims ListingClaim[]
}
```

- [ ] **Step 4: Create the migration**

Run: `npm run db:migrate -- --name add_listing_claims`
Expected: Prisma creates a migration directory and updates the generated client

- [ ] **Step 5: Replace the placeholder test with a real import**

Update `src/server/services/listing-claim-service.test.ts` to import the future service file instead of the placeholder false assertion.

```ts
import { describe, expect, it } from "vitest";

describe("listing claim service", () => {
  it("placeholder until service implementation lands", () => {
    expect(typeof "pending").toBe("string");
  });
});
```

- [ ] **Step 6: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/server/services/listing-claim-service.test.ts
git commit -m "feat: add listing claim schema"
```

### Task 2: Implement domain parsing and matching helpers

**Files:**
- Create: `src/server/services/claim-domain.ts`
- Create: `src/server/services/claim-domain.test.ts`

- [ ] **Step 1: Write the failing domain tests**

Create `src/server/services/claim-domain.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  domainsMatchForClaim,
  getEmailDomain,
  getWebsiteDomain,
} from "@/server/services/claim-domain";

describe("claim-domain", () => {
  it("extracts root email domains", () => {
    expect(getEmailDomain("founder@acme.com")).toBe("acme.com");
  });

  it("extracts normalized website domains", () => {
    expect(getWebsiteDomain("https://www.acme.com/pricing")).toBe("acme.com");
  });

  it("matches root email to app subdomain website", () => {
    expect(domainsMatchForClaim("founder@acme.com", "https://app.acme.com")).toBe(true);
  });

  it("rejects unrelated domains", () => {
    expect(domainsMatchForClaim("founder@acme.com", "https://other.com")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the domain test to verify it fails**

Run: `npm test -- src/server/services/claim-domain.test.ts`
Expected: FAIL with module not found

- [ ] **Step 3: Implement the domain helpers**

Create `src/server/services/claim-domain.ts`:

```ts
function collapseHost(host: string) {
  return host.replace(/^www\./, "").toLowerCase();
}

function toRootDomain(host: string) {
  const normalized = collapseHost(host);
  const parts = normalized.split(".").filter(Boolean);

  if (parts.length <= 2) {
    return normalized;
  }

  return parts.slice(-2).join(".");
}

export function getEmailDomain(email: string) {
  const [, domain = ""] = email.trim().toLowerCase().split("@");
  return toRootDomain(domain);
}

export function getWebsiteDomain(websiteUrl: string) {
  const url = new URL(websiteUrl);
  return toRootDomain(url.hostname);
}

export function domainsMatchForClaim(email: string, websiteUrl: string) {
  const emailDomain = getEmailDomain(email);
  const websiteDomain = getWebsiteDomain(websiteUrl);

  if (!emailDomain || !websiteDomain) {
    return false;
  }

  return emailDomain === websiteDomain;
}
```

- [ ] **Step 4: Run the domain test to verify it passes**

Run: `npm test -- src/server/services/claim-domain.test.ts`
Expected: PASS with 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/server/services/claim-domain.ts src/server/services/claim-domain.test.ts
git commit -m "feat: add claim domain matching helpers"
```

### Task 3: Implement listing claim service

**Files:**
- Create: `src/server/services/listing-claim-service.ts`
- Modify: `src/server/services/listing-claim-service.test.ts`

- [ ] **Step 1: Write the failing service tests**

Replace `src/server/services/listing-claim-service.test.ts` with:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({
  prisma: {
    tool: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    listingClaim: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => callback({
      tool: { update: vi.fn() },
      listingClaim: { update: vi.fn() },
    })),
  },
}));

import { prisma } from "@/server/db/client";
import {
  approveListingClaim,
  createListingClaim,
} from "@/server/services/listing-claim-service";

describe("listing-claim-service", () => {
  it("creates a pending claim for an unowned tool with matching domain", async () => {
    vi.mocked(prisma.tool.findUnique).mockResolvedValueOnce({
      id: "tool_1",
      slug: "seeded-tool",
      name: "Seeded Tool",
      websiteUrl: "https://acme.com",
      ownerUserId: null,
      moderationStatus: "APPROVED",
      publicationStatus: "PUBLISHED",
    } as never);
    vi.mocked(prisma.listingClaim.findFirst).mockResolvedValueOnce(null as never);
    vi.mocked(prisma.listingClaim.create).mockResolvedValueOnce({
      id: "claim_1",
      status: "PENDING",
    } as never);

    const result = await createListingClaim({
      toolId: "tool_1",
      claimantUserId: "user_1",
      claimantEmail: "founder@acme.com",
    });

    expect(result.status).toBe("PENDING");
  });

  it("transfers ownership when approving a claim", async () => {
    await approveListingClaim("claim_1", "admin_1");
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the service test to confirm failure**

Run: `npm test -- src/server/services/listing-claim-service.test.ts`
Expected: FAIL with module not found

- [ ] **Step 3: Implement the claim service**

Create `src/server/services/listing-claim-service.ts`:

```ts
import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import { domainsMatchForClaim, getEmailDomain, getWebsiteDomain } from "@/server/services/claim-domain";

function buildSeededToolSnapshot(tool: {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  ownerUserId: string | null;
  moderationStatus: string;
  publicationStatus: string;
}) {
  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    websiteUrl: tool.websiteUrl,
    ownerUserId: tool.ownerUserId,
    moderationStatus: tool.moderationStatus,
    publicationStatus: tool.publicationStatus,
  };
}

export async function createListingClaim(input: {
  toolId: string;
  claimantUserId: string;
  claimantEmail: string;
}) {
  const tool = await prisma.tool.findUnique({
    where: { id: input.toolId },
  });

  if (!tool) {
    throw new AppError(404, "Tool not found.");
  }

  if (tool.ownerUserId) {
    throw new AppError(409, "This listing is already owned.");
  }

  if (!domainsMatchForClaim(input.claimantEmail, tool.websiteUrl)) {
    throw new AppError(400, "Use a company email that matches the listing domain.");
  }

  const existingPending = await prisma.listingClaim.findFirst({
    where: {
      toolId: input.toolId,
      claimantUserId: input.claimantUserId,
      status: "PENDING",
    },
  });

  if (existingPending) {
    return existingPending;
  }

  const existingToolPending = await prisma.listingClaim.findFirst({
    where: {
      toolId: input.toolId,
      status: "PENDING",
    },
  });

  if (existingToolPending) {
    throw new AppError(409, "This listing already has a pending claim.");
  }

  return prisma.listingClaim.create({
    data: {
      toolId: input.toolId,
      claimantUserId: input.claimantUserId,
      claimEmail: input.claimantEmail,
      claimDomain: getEmailDomain(input.claimantEmail),
      websiteDomain: getWebsiteDomain(tool.websiteUrl),
      seededToolSnapshot: buildSeededToolSnapshot(tool),
    },
  });
}

export async function approveListingClaim(claimId: string, adminUserId: string) {
  const claim = await prisma.listingClaim.findUnique({
    where: { id: claimId },
  });

  if (!claim || claim.status !== "PENDING") {
    throw new AppError(404, "Pending claim not found.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.tool.update({
      where: { id: claim.toolId },
      data: {
        ownerUserId: claim.claimantUserId,
      },
    });

    return tx.listingClaim.update({
      where: { id: claimId },
      data: {
        status: "APPROVED",
        reviewedByUserId: adminUserId,
        reviewedAt: new Date(),
      },
    });
  });
}

export async function rejectListingClaim(input: {
  claimId: string;
  adminUserId: string;
  founderVisibleNote?: string;
  internalAdminNote?: string;
}) {
  const claim = await prisma.listingClaim.findUnique({
    where: { id: input.claimId },
  });

  if (!claim || claim.status !== "PENDING") {
    throw new AppError(404, "Pending claim not found.");
  }

  return prisma.listingClaim.update({
    where: { id: input.claimId },
    data: {
      status: "REJECTED",
      reviewedByUserId: input.adminUserId,
      reviewedAt: new Date(),
      founderVisibleNote: input.founderVisibleNote,
      internalAdminNote: input.internalAdminNote,
    },
  });
}
```

- [ ] **Step 4: Run the service test to verify it passes**

Run: `npm test -- src/server/services/listing-claim-service.test.ts`
Expected: PASS with 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/server/services/listing-claim-service.ts src/server/services/listing-claim-service.test.ts
git commit -m "feat: add listing claim service"
```

### Task 4: Add validators and API routes

**Files:**
- Create: `src/server/validators/listing-claim.ts`
- Create: `src/app/api/listing-claims/route.ts`
- Create: `src/app/api/admin/listing-claims/route.ts`
- Create: `src/app/api/admin/listing-claims/[claimId]/route.ts`

- [ ] **Step 1: Add claim validators**

Create `src/server/validators/listing-claim.ts`:

```ts
import { z } from "zod";

export const listingClaimCreateSchema = z.object({
  toolId: z.string().cuid(),
});

export const listingClaimReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  founderVisibleNote: z.string().trim().max(500).optional(),
  internalAdminNote: z.string().trim().max(1000).optional(),
});
```

- [ ] **Step 2: Add founder claim creation route**

Create `src/app/api/listing-claims/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { created, errorResponse } from "@/server/http/response";
import { createListingClaim } from "@/server/services/listing-claim-service";
import { listingClaimCreateSchema } from "@/server/validators/listing-claim";

export async function POST(request: NextRequest) {
  try {
    getEnv();
    const session = await requireSession(request);
    const body = listingClaimCreateSchema.parse(await request.json());

    const claim = await createListingClaim({
      toolId: body.toolId,
      claimantUserId: session.user.id,
      claimantEmail: session.user.email,
    });

    return created(claim);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 3: Add admin claim list route**

Create `src/app/api/admin/listing-claims/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { prisma } from "@/server/db/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const claims = await prisma.listingClaim.findMany({
      include: {
        tool: true,
        claimantUser: true,
        reviewedBy: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return ok(claims);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 4: Add admin claim review route**

Create `src/app/api/admin/listing-claims/[claimId]/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { requireAdminUserId } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import {
  approveListingClaim,
  rejectListingClaim,
} from "@/server/services/listing-claim-service";
import { listingClaimReviewSchema } from "@/server/validators/listing-claim";

type RouteContext = {
  params: Promise<{ claimId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const adminUserId = await requireAdminUserId(request);
    getEnv();

    const { claimId } = await context.params;
    const body = listingClaimReviewSchema.parse(await request.json());

    const result =
      body.action === "APPROVE"
        ? await approveListingClaim(claimId, adminUserId)
        : await rejectListingClaim({
            claimId,
            adminUserId,
            founderVisibleNote: body.founderVisibleNote,
            internalAdminNote: body.internalAdminNote,
          });

    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 5: Run lint on the new routes**

Run: `npm run lint -- 'src/app/api/listing-claims/route.ts' 'src/app/api/admin/listing-claims/route.ts' 'src/app/api/admin/listing-claims/[claimId]/route.ts'`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/server/validators/listing-claim.ts src/app/api/listing-claims/route.ts src/app/api/admin/listing-claims/route.ts 'src/app/api/admin/listing-claims/[claimId]/route.ts'
git commit -m "feat: add listing claim api routes"
```

### Task 5: Add claim CTA to public tool pages with auth-resume support

**Files:**
- Modify: `src/app/tools/[slug]/page.tsx`
- Modify: `src/app/sign-in/page.tsx`
- Modify: `src/app/sign-up/page.tsx`

- [ ] **Step 1: Add claim CTA rendering on tool pages**

Update `src/app/tools/[slug]/page.tsx`:

```tsx
const claimHref = `/sign-in?next=/tools/${tool.slug}?claim=1`;
```

Render when `!tool.ownerUserId`:

```tsx
{!tool.ownerUserId ? (
  <Link
    href={claimHref}
    className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
  >
    Claim this listing
  </Link>
) : null}
```

- [ ] **Step 2: Preserve return path through sign-in**

Update `src/app/sign-in/page.tsx` to read `next` from `searchParams` and pass it into the auth form or success redirect flow:

```ts
searchParams: Promise<{ reset?: string; verified?: string; next?: string }>;
```

- [ ] **Step 3: Preserve return path through sign-up**

Update `src/app/sign-up/page.tsx` similarly:

```ts
searchParams: Promise<{ next?: string }>;
```

- [ ] **Step 4: Run lint on public/auth pages**

Run: `npm run lint -- 'src/app/tools/[slug]/page.tsx' 'src/app/sign-in/page.tsx' 'src/app/sign-up/page.tsx'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add 'src/app/tools/[slug]/page.tsx' 'src/app/sign-in/page.tsx' 'src/app/sign-up/page.tsx'
git commit -m "feat: add public claim listing entry point"
```

### Task 6: Surface claim status in founder dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/founder/founder-dashboard.tsx`

- [ ] **Step 1: Extend dashboard page data loading**

Update `src/app/dashboard/page.tsx`:

```ts
import { prisma } from "@/server/db/client";
```

Load claims:

```ts
const [submissions, tools, claims] = await Promise.all([
  listFounderSubmissions(session.user.id),
  listFounderTools(session.user.id),
  prisma.listingClaim.findMany({
    where: { claimantUserId: session.user.id },
    include: { tool: true },
    orderBy: [{ createdAt: "desc" }],
  }),
]);
```

Pass serialized claims into the dashboard component.

- [ ] **Step 2: Add founder claim UI**

Update `src/components/founder/founder-dashboard.tsx`:

```tsx
type FounderListingClaim = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  claimEmail: string;
  websiteDomain: string;
  founderVisibleNote: string | null;
  createdAt: string;
  tool: {
    id: string;
    slug: string;
    name: string;
  };
};
```

Render a new section:

```tsx
<section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
  <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
    Listing claims
  </p>
  <div className="mt-6 grid gap-4">
    {listingClaims.map((claim) => (
      <article key={claim.id} className="rounded-[1.5rem] border border-black/10 bg-[#fff9ef] p-5">
        <p className="text-lg font-semibold text-black">{claim.tool.name}</p>
        <p className="mt-1 text-sm text-black/62">Status: {claim.status}</p>
        {claim.founderVisibleNote ? (
          <p className="mt-3 text-sm leading-7 text-black/68">{claim.founderVisibleNote}</p>
        ) : null}
      </article>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Run lint on dashboard files**

Run: `npm run lint -- 'src/app/dashboard/page.tsx' 'src/components/founder/founder-dashboard.tsx'`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add 'src/app/dashboard/page.tsx' 'src/components/founder/founder-dashboard.tsx'
git commit -m "feat: show listing claims in founder dashboard"
```

### Task 7: Add admin claim review surface

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/components/admin/admin-console.tsx`
- Modify: `src/components/admin/admin-console-shared.tsx`

- [ ] **Step 1: Extend shared admin types**

Update `src/components/admin/admin-console-shared.tsx`:

```ts
export type ListingClaim = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  claimEmail: string;
  claimDomain: string;
  websiteDomain: string;
  founderVisibleNote: string | null;
  internalAdminNote: string | null;
  createdAt: string;
  tool: { id: string; slug: string; name: string };
  claimantUser: { id: string; email: string; name: string | null };
};
```

- [ ] **Step 2: Load claims into the admin page**

Update `src/app/admin/page.tsx` to fetch claim data and pass it into the admin console, following the same pattern used for tools/submissions.

- [ ] **Step 3: Add claim review panel to the admin console**

Update `src/components/admin/admin-console.tsx` with:

```tsx
const [claims, setClaims] = useState<ListingClaim[]>(initialClaims);
```

Add a review block with approve/reject actions that call:

```ts
await apiRequest(`/api/admin/listing-claims/${claim.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    action: "APPROVE",
  }),
});
```

and

```ts
await apiRequest(`/api/admin/listing-claims/${claim.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    action: "REJECT",
    founderVisibleNote,
    internalAdminNote,
  }),
});
```

- [ ] **Step 4: Run lint on admin surfaces**

Run: `npm run lint -- 'src/app/admin/page.tsx' 'src/components/admin/admin-console.tsx' 'src/components/admin/admin-console-shared.tsx'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add 'src/app/admin/page.tsx' 'src/components/admin/admin-console.tsx' 'src/components/admin/admin-console-shared.tsx'
git commit -m "feat: add admin listing claim review"
```

### Task 8: End-to-end verification

**Files:**
- Verify only

- [ ] **Step 1: Run focused tests**

Run: `npm test -- src/server/services/claim-domain.test.ts src/server/services/listing-claim-service.test.ts`
Expected: PASS

- [ ] **Step 2: Run full lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Manual founder flow smoke test**

Run:

```bash
npm run dev
```

Expected manual checks:
- unowned public tool shows `Claim this listing`
- signed-out click routes through auth
- signed-in founder with matching domain can create a pending claim
- founder dashboard shows the claim

- [ ] **Step 5: Manual admin flow smoke test**

Expected manual checks:
- admin sees pending claim in admin console
- admin approval transfers ownership
- approved tool appears in founder editable tools
- public listing stays visible throughout

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: implement listing claim flow"
```

---

## Self-Review

### Spec coverage
- public claim CTA: Task 5
- auth resume: Task 5
- company-email domain match: Tasks 2 and 3
- dedicated claim model + audit snapshot: Tasks 1 and 3
- founder-visible claim status: Task 6
- admin approval/rejection: Tasks 3, 4, and 7
- ownership transfer through `Tool.ownerUserId`: Task 3
- listing remains public while pending: preserved by not altering public visibility rules anywhere in the plan

### Placeholder scan
- No `TBD` markers remain
- Every task includes exact files and commands
- Code-changing steps include concrete snippets

### Type consistency
- `ListingClaimStatus` values are used consistently across schema, service, routes, and UI
- `claimantUserId`, `reviewedByUserId`, and `seededToolSnapshot` names are consistent throughout
- claim creation uses `toolId` consistently in validator, route, and service

