# Dodo Premium Launch Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Polar with Dodo for premium launch checkout, keep the pricing page fast with cached live Dodo pricing, and defer the database rename to a later release.

**Architecture:** Add a Dodo integration boundary under `src/server`, rewrite the existing premium launch payment service around Dodo checkout sessions, verified webhooks, and payment reconciliation, then rewire the App Router routes and founder UI to the new Dodo paths. Preserve the current Prisma schema for one release by storing Dodo session and payment identifiers in the existing `polarCheckoutId` and `polarOrderId` columns while all active code and copy switch to `premium launch`.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Prisma, Dodo Payments SDK, `standardwebhooks`, existing ShipBoost auth/cache/http utilities

---

## File Structure

### Create
- `src/server/dodo.ts`
  - Dodo SDK client, mode mapping, and dashboard return URL builder
- `src/server/dodo.test.ts`
  - unit coverage for Dodo env mapping and return URL construction
- `src/server/services/dodo-product-service.ts`
  - cached Dodo product lookup and pricing-page formatting helpers
- `src/server/services/dodo-product-service.test.ts`
  - unit tests for price formatting and fallback behavior
- `src/app/api/dodo/checkout/premium-launch/route.ts`
  - authenticated premium launch checkout endpoint
- `src/app/api/dodo/webhooks/route.ts`
  - verified Dodo webhook handler for payment and refund events

### Modify
- `package.json`
  - add Dodo dependencies and remove Polar dependencies by the end of the plan
- `package-lock.json`
  - lockfile updates from dependency swap
- `.env.example`
  - Dodo env examples
- `.env.production.example`
  - production Dodo env examples
- `src/server/env.ts`
  - Dodo env schema and removal of Polar env fields
- `src/lib/premium-launch.ts`
  - remove provider-migration outage messaging and enable premium launch
- `src/server/services/submission-payment-service.ts`
  - Dodo checkout creation, payment reconciliation, refund handling, and premium-launch naming cleanup
- `src/server/services/submission-payment-service.test.ts`
  - Dodo-focused checkout, payment, refund, and reschedule tests
- `src/server/services/submission-service.ts`
  - export the renamed premium-launch payment functions
- `src/server/services/submission-service-shared.ts`
  - rename payment payload types and keep enum-boundary comments clear
- `src/server/services/submission-draft-service.ts`
  - premium-launch copy cleanup for checkout-required messaging
- `src/server/email/transactional.ts`
  - rename featured-launch email copy to premium-launch copy
- `src/server/validators/submission.ts`
  - rename `featuredLaunchRescheduleSchema` to `premiumLaunchRescheduleSchema`
- `src/app/api/submissions/[submissionId]/reschedule/route.ts`
  - import the premium-named reschedule function and schema
- `src/app/dashboard/page.tsx`
  - reconcile from Dodo return params
- `src/components/founder/submit-product-form.tsx`
  - use the new Dodo checkout route
- `src/components/founder/founder-dashboard.tsx`
  - use the new Dodo checkout route
- `src/app/pricing/page.tsx`
  - render cached live Dodo price and keep compare-at copy static
- `src/server/services/founding-offer-service.test.ts`
  - keep founder-spot counting expectations explicit after the migration
- `docs/deploy-digitalocean-app-platform.md`
  - replace Polar env and webhook references with Dodo
- `docs/performance-baseline.md`
  - replace stale Polar route references if they are still documented

### Delete
- `src/server/polar.ts`
- `src/app/api/polar/checkout/featured-launch/route.ts`
- `src/app/api/polar/webhooks/route.ts`

### Test
- `src/server/dodo.test.ts`
- `src/server/services/submission-payment-service.test.ts`
- `src/server/services/dodo-product-service.test.ts`
- `src/server/services/founding-offer-service.test.ts`

---

## Task 1: Add Dodo Dependencies, Env Schema, and Provider Scaffolding

**Files:**
- Create: `src/server/dodo.ts`
- Create: `src/server/dodo.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/server/env.ts`
- Modify: `.env.example`
- Modify: `.env.production.example`
- Modify: `src/lib/premium-launch.ts`

- [ ] **Step 1: Write the failing Dodo helper test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getEnvMock, DodoPaymentsMock } = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  DodoPaymentsMock: vi.fn(),
}));

vi.mock("@/server/env", () => ({
  getEnv: getEnvMock,
}));

vi.mock("dodopayments", () => ({
  default: DodoPaymentsMock,
}));

describe("dodo", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("maps test mode and appends submission context to the dashboard return url", async () => {
    getEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: "https://shipboost.io",
      DODO_PAYMENTS_API_KEY: "dodo_test_key",
      DODO_PAYMENTS_MODE: "test",
      DODO_PAYMENTS_RETURN_URL: undefined,
    });

    const { getDodoClient, getDodoDashboardReturnUrl } = await import("@/server/dodo");

    getDodoClient();

    expect(DodoPaymentsMock).toHaveBeenCalledWith({
      bearerToken: "dodo_test_key",
      environment: "test_mode",
    });
    expect(getDodoDashboardReturnUrl("submission_1")).toBe(
      "https://shipboost.io/dashboard?checkout=success&submission_id=submission_1",
    );
  });
});
```

- [ ] **Step 2: Run the new test to confirm the Dodo module does not exist yet**

Run: `npm run test -- src/server/dodo.test.ts`
Expected: FAIL with a module resolution error for `@/server/dodo` or missing Dodo env fields.

- [ ] **Step 3: Install the Dodo dependencies and add Dodo env fields**

```bash
npm install dodopayments standardwebhooks
```

```ts
// src/server/env.ts
DODO_PAYMENTS_API_KEY: optionalEnvString,
DODO_PAYMENTS_WEBHOOK_SECRET: optionalEnvString,
DODO_PAYMENTS_MODE: z.enum(["test", "live"]).default("test"),
DODO_PREMIUM_LAUNCH_PRODUCT_ID: optionalEnvString,
DODO_PAYMENTS_RETURN_URL: optionalEnvString,
```

```ts
// src/server/env.ts parse block
DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY,
DODO_PAYMENTS_WEBHOOK_SECRET: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
DODO_PAYMENTS_MODE: process.env.DODO_PAYMENTS_MODE,
DODO_PREMIUM_LAUNCH_PRODUCT_ID: process.env.DODO_PREMIUM_LAUNCH_PRODUCT_ID,
DODO_PAYMENTS_RETURN_URL: process.env.DODO_PAYMENTS_RETURN_URL,
```

```bash
# .env.example
DODO_PAYMENTS_API_KEY=""
DODO_PAYMENTS_WEBHOOK_SECRET=""
DODO_PAYMENTS_MODE="test"
DODO_PREMIUM_LAUNCH_PRODUCT_ID=""
DODO_PAYMENTS_RETURN_URL="http://localhost:3000/dashboard"

# .env.production.example
DODO_PAYMENTS_API_KEY=""
DODO_PAYMENTS_WEBHOOK_SECRET=""
DODO_PAYMENTS_MODE="live"
DODO_PREMIUM_LAUNCH_PRODUCT_ID=""
DODO_PAYMENTS_RETURN_URL="https://shipboost.io/dashboard"
```

- [ ] **Step 4: Implement the Dodo server module**

```ts
import DodoPayments from "dodopayments";

import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";

export function getDodoEnvironment() {
  return getEnv().DODO_PAYMENTS_MODE === "test" ? "test_mode" : "live_mode";
}

export function getDodoClient() {
  const env = getEnv();

  if (!env.DODO_PAYMENTS_API_KEY) {
    throw new AppError(500, "Dodo Payments API key is not configured.");
  }

  return new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: getDodoEnvironment(),
  });
}

export function getDodoDashboardReturnUrl(submissionId: string) {
  const env = getEnv();
  const url = new URL(
    env.DODO_PAYMENTS_RETURN_URL ?? `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
  );

  url.searchParams.set("checkout", "success");
  url.searchParams.set("submission_id", submissionId);

  return url.toString();
}
```

- [ ] **Step 5: Enable premium launch again and remove the provider-switch outage copy**

```ts
export const premiumLaunchAvailable = true;

export const premiumLaunchUnavailableMessage =
  "Premium Launch is temporarily unavailable. Please try again shortly.";
```

- [ ] **Step 6: Re-run the Dodo helper test**

Run: `npm run test -- src/server/dodo.test.ts`
Expected: PASS with `1 passed`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/server/env.ts .env.example .env.production.example src/server/dodo.ts src/server/dodo.test.ts src/lib/premium-launch.ts
git commit -m "feat: add Dodo payment scaffolding"
```

## Task 2: Rewrite the Premium Launch Payment Service Around Dodo

**Files:**
- Modify: `src/server/services/submission-payment-service.ts`
- Modify: `src/server/services/submission-payment-service.test.ts`
- Modify: `src/server/services/submission-service.ts`
- Modify: `src/server/services/submission-service-shared.ts`

- [ ] **Step 1: Replace the Polar-focused tests with Dodo checkout, payment, and refund tests**

```ts
const {
  prismaMock,
  getSubmissionByIdMock,
  getSubmissionByIdForFounderMock,
  getDodoClientMock,
  getDodoDashboardReturnUrlMock,
  sendPremiumLaunchPaidEmailMessageMock,
  sendProductEmailSafelyMock,
} = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    submission: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  getSubmissionByIdMock: vi.fn(),
  getSubmissionByIdForFounderMock: vi.fn(),
  getDodoClientMock: vi.fn(),
  getDodoDashboardReturnUrlMock: vi.fn(),
  sendPremiumLaunchPaidEmailMessageMock: vi.fn(),
  sendProductEmailSafelyMock: vi.fn(),
}));

vi.mock("@/server/dodo", () => ({
  getDodoClient: getDodoClientMock,
  getDodoDashboardReturnUrl: getDodoDashboardReturnUrlMock,
}));

vi.mock("@/server/email/transactional", () => ({
  sendPremiumLaunchPaidEmailMessage: sendPremiumLaunchPaidEmailMessageMock,
}));

import {
  createPremiumLaunchCheckout,
  handlePremiumLaunchPaymentSucceeded,
  handlePremiumLaunchRefundSucceeded,
  reconcilePremiumLaunchPayment,
  reschedulePremiumLaunch,
} from "@/server/services/submission-payment-service";

it("creates a Dodo checkout session and stores the checkout session id", async () => {
  getSubmissionByIdForFounderMock.mockResolvedValueOnce({
    id: "submission_1",
    toolId: "tool_1",
    submissionType: "FEATURED_LAUNCH",
    preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
    paymentStatus: "PENDING",
    reviewStatus: "DRAFT",
  });

  getDodoDashboardReturnUrlMock.mockReturnValue(
    "https://shipboost.io/dashboard?checkout=success&submission_id=submission_1",
  );

  const createMock = vi.fn().mockResolvedValue({
    session_id: "cs_test_1",
    checkout_url: "https://checkout.dodopayments.com/session/cs_test_1",
  });

  getDodoClientMock.mockReturnValue({
    checkoutSessions: {
      create: createMock,
    },
  });

  const result = await createPremiumLaunchCheckout("submission_1", {
    id: "founder_1",
    email: "founder@acme.com",
    name: "Founder",
  });

  expect(createMock).toHaveBeenCalledWith({
    product_cart: [{ product_id: "prod_premium_1", quantity: 1 }],
    customer: {
      email: "founder@acme.com",
      name: "Founder",
    },
    return_url:
      "https://shipboost.io/dashboard?checkout=success&submission_id=submission_1",
    metadata: {
      shipboostSubmissionId: "submission_1",
      shipboostToolId: "tool_1",
      shipboostSubmissionType: "FEATURED_LAUNCH",
      shipboostPreferredLaunchDate: "2026-05-08T00:00:00.000Z",
    },
  });
  expect(result).toEqual({
    checkoutUrl: "https://checkout.dodopayments.com/session/cs_test_1",
    checkoutId: "cs_test_1",
  });
});

it("reconciles a successful Dodo payment from dashboard return parameters", async () => {
  prismaMock.submission.findUnique.mockResolvedValueOnce({
    id: "submission_1",
    submissionType: "FEATURED_LAUNCH",
    paymentStatus: "PENDING",
    polarOrderId: null,
  });

  getDodoClientMock.mockReturnValue({
    payments: {
      retrieve: vi.fn().mockResolvedValue({
        payment_id: "pay_test_1",
        status: "succeeded",
        metadata: {
          shipboostSubmissionId: "submission_1",
        },
      }),
    },
  });

  await reconcilePremiumLaunchPayment({
    submissionId: "submission_1",
    paymentId: "pay_test_1",
  });

  expect(getDodoClientMock).toHaveBeenCalled();
});

it("marks the submission refunded from a Dodo refund event", async () => {
  await handlePremiumLaunchRefundSucceeded({
    paymentId: "pay_test_1",
  });

  expect(prismaMock.submission.updateMany).toHaveBeenCalledWith({
    where: { polarOrderId: "pay_test_1" },
    data: { paymentStatus: "REFUNDED" },
  });
});
```

- [ ] **Step 2: Run the service tests to confirm the old Polar function names no longer match**

Run: `npm run test -- src/server/services/submission-payment-service.test.ts`
Expected: FAIL with missing `@/server/dodo` mocks or missing premium-named exports.

- [ ] **Step 3: Rewrite the payment service to use Dodo checkout sessions and payment ids**

```ts
import { getDodoClient, getDodoDashboardReturnUrl } from "@/server/dodo";

type PremiumLaunchPaymentLike = {
  paymentId: string;
  metadata: Record<string, unknown>;
};

function readSubmissionIdFromPaymentMetadata(metadata: Record<string, unknown>) {
  const value = metadata.shipboostSubmissionId;

  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  return null;
}

async function applyPremiumLaunchPaymentSucceeded(input: {
  paymentId: string;
  submissionId?: string | null;
  metadata: Record<string, unknown>;
}) {
  const resolvedSubmissionId =
    input.submissionId ?? readSubmissionIdFromPaymentMetadata(input.metadata);

  if (!resolvedSubmissionId) {
    console.warn("[shipboost dodo] payment.succeeded missing shipboostSubmissionId", {
      paymentId: input.paymentId,
    });
    return null;
  }

  const updatedSubmissionId = await prisma.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: resolvedSubmissionId },
      include: {
        tool: {
          include: {
            launches: true,
          },
        },
      },
    });

    if (!submission || submission.submissionType !== "FEATURED_LAUNCH") {
      return null;
    }

    if (submission.paymentStatus === "PAID" && submission.polarOrderId === input.paymentId) {
      return submission.id;
    }

    const preferredLaunchDate = submission.preferredLaunchDate
      ? assertValidPremiumLaunchWeekStart(submission.preferredLaunchDate)
      : getLaunchpadGoLiveAtUtc();

    await tx.submission.update({
      where: { id: submission.id },
      data: {
        paymentStatus: "PAID",
        polarOrderId: input.paymentId,
        paidAt: new Date(),
        reviewStatus: "APPROVED",
      },
    });

    await tx.tool.update({
      where: { id: submission.toolId },
      data: {
        moderationStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        currentLaunchType: "FEATURED",
      },
    });

    return submission.id;
  });

  return updatedSubmissionId ? getSubmissionById(prisma, updatedSubmissionId) : null;
}
```

```ts
export async function createPremiumLaunchCheckout(
  submissionId: string,
  founder: { id: string; email: string; name?: string | null },
) {
  const submission = await getSubmissionByIdForFounder(prisma, submissionId, founder.id);

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  if (submission.submissionType !== "FEATURED_LAUNCH") {
    throw new AppError(400, "Only premium launch submissions can be paid.");
  }

  if (!submission.preferredLaunchDate) {
    throw new AppError(400, "Premium launch week is missing.");
  }

  if (submission.paymentStatus === "PAID") {
    throw new AppError(409, "This premium launch has already been paid.");
  }

  const env = getEnv();

  if (!env.DODO_PREMIUM_LAUNCH_PRODUCT_ID) {
    throw new AppError(500, "Dodo premium launch product is not configured.");
  }

  const preferredLaunchWeek = assertValidPremiumLaunchWeekStart(submission.preferredLaunchDate);
  const dodo = getDodoClient();
  const checkout = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: env.DODO_PREMIUM_LAUNCH_PRODUCT_ID, quantity: 1 }],
    customer: {
      email: founder.email,
      name: founder.name ?? undefined,
    },
    return_url: getDodoDashboardReturnUrl(submission.id),
    metadata: {
      shipboostSubmissionId: submission.id,
      shipboostToolId: submission.toolId,
      shipboostSubmissionType: submission.submissionType,
      shipboostPreferredLaunchDate: preferredLaunchWeek.toISOString(),
    },
  });

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      polarCheckoutId: checkout.session_id,
      paymentStatus: "PENDING",
    },
  });

  return {
    checkoutUrl: checkout.checkout_url,
    checkoutId: checkout.session_id,
  };
}
```

```ts
export async function handlePremiumLaunchPaymentSucceeded(input: {
  paymentId: string;
  metadata: Record<string, unknown>;
}) {
  await applyPremiumLaunchPaymentSucceeded({
    paymentId: input.paymentId,
    metadata: input.metadata,
  });
}

export async function handlePremiumLaunchRefundSucceeded(input: { paymentId: string }) {
  if (!input.paymentId) {
    return;
  }

  await prisma.submission.updateMany({
    where: { polarOrderId: input.paymentId },
    data: { paymentStatus: "REFUNDED" },
  });
}

export async function reconcilePremiumLaunchPayment(input: {
  submissionId: string;
  paymentId: string;
}) {
  const submission = await prisma.submission.findUnique({
    where: { id: input.submissionId },
    select: {
      id: true,
      submissionType: true,
      paymentStatus: true,
      polarOrderId: true,
    },
  });

  if (!submission || submission.submissionType !== "FEATURED_LAUNCH") {
    return null;
  }

  if (submission.paymentStatus === "PAID") {
    return getSubmissionById(prisma, submission.id);
  }

  const dodo = getDodoClient();
  const payment = await dodo.payments.retrieve(input.paymentId);

  if (payment.status !== "succeeded") {
    return getSubmissionById(prisma, submission.id);
  }

  if (
    payment.metadata?.shipboostSubmissionId &&
    payment.metadata.shipboostSubmissionId !== submission.id
  ) {
    throw new AppError(409, "This payment does not belong to the current submission.");
  }

  return applyPremiumLaunchPaymentSucceeded({
    paymentId: payment.payment_id,
    submissionId: submission.id,
    metadata: payment.metadata ?? {},
  });
}
```

- [ ] **Step 4: Rename the active reschedule function and exports to premium-launch names**

```ts
export async function reschedulePremiumLaunch(
  submissionId: string,
  input: PremiumLaunchRescheduleInput,
  founder: AuthenticatedFounder,
) {
  const submission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );

  if (!submission || submission.submissionType !== "FEATURED_LAUNCH") {
    throw new AppError(400, "Only premium launches can be rescheduled.");
  }

  if (submission.paymentStatus !== "PAID") {
    throw new AppError(400, "Pay for the premium launch before rescheduling it.");
  }

  const existingPremiumLaunch = submission.tool.launches.find(
    (launch) => launch.launchType === "FEATURED",
  );

  if (!existingPremiumLaunch) {
    throw new AppError(400, "Premium launch is not scheduled yet.");
  }

  const nextLaunchDate = assertValidPremiumLaunchWeekStart(
    input.preferredLaunchDate,
  );

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submission.id },
      data: { preferredLaunchDate: nextLaunchDate },
    });

    await tx.launch.update({
      where: { id: existingPremiumLaunch.id },
      data: {
        launchDate: nextLaunchDate,
        startAt: nextLaunchDate,
        status: "APPROVED",
      },
    });
  });

  const updatedSubmission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );

  if (!updatedSubmission) {
    throw new AppError(500, "Launch rescheduled but could not be reloaded.");
  }

  return updatedSubmission;
}

export {
  createPremiumLaunchCheckout,
  handlePremiumLaunchPaymentSucceeded,
  handlePremiumLaunchRefundSucceeded,
  reconcilePremiumLaunchPayment,
  reschedulePremiumLaunch,
} from "@/server/services/submission-payment-service";
```

- [ ] **Step 5: Re-run the payment-service test suite**

Run: `npm run test -- src/server/services/submission-payment-service.test.ts`
Expected: PASS with the Dodo checkout, payment, and refund tests green.

- [ ] **Step 6: Commit**

```bash
git add src/server/services/submission-payment-service.ts src/server/services/submission-payment-service.test.ts src/server/services/submission-service.ts src/server/services/submission-service-shared.ts
git commit -m "feat: migrate premium launch payment service to Dodo"
```

## Task 3: Wire the Dodo Routes and Dashboard Return Flow

**Files:**
- Create: `src/app/api/dodo/checkout/premium-launch/route.ts`
- Create: `src/app/api/dodo/webhooks/route.ts`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/api/submissions/[submissionId]/reschedule/route.ts`
- Modify: `src/server/validators/submission.ts`

- [ ] **Step 1: Rename the reschedule schema and function wiring to premium-launch terminology**

```ts
// src/server/validators/submission.ts
export const premiumLaunchRescheduleSchema = z.object({
  preferredLaunchDate: z.coerce.date(),
});

export type PremiumLaunchRescheduleInput = z.infer<
  typeof premiumLaunchRescheduleSchema
>;
```

```ts
// src/app/api/submissions/[submissionId]/reschedule/route.ts
import { reschedulePremiumLaunch } from "@/server/services/submission-service";
import { premiumLaunchRescheduleSchema } from "@/server/validators/submission";

function serializeSubmission(
  submission: Awaited<ReturnType<typeof reschedulePremiumLaunch>>,
) {
  return {
    ...submission,
    createdAt: submission.createdAt.toISOString(),
    preferredLaunchDate: submission.preferredLaunchDate?.toISOString() ?? null,
    paidAt: submission.paidAt?.toISOString() ?? null,
    tool: {
      ...submission.tool,
      launches: submission.tool.launches.map((launch) => ({
        ...launch,
        launchDate: launch.launchDate.toISOString(),
      })),
    },
  };
}
```

- [ ] **Step 2: Add the new Dodo checkout route**

```ts
import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { errorResponse, ok } from "@/server/http/response";
import { premiumLaunchAvailable, premiumLaunchUnavailableMessage } from "@/lib/premium-launch";
import { createPremiumLaunchCheckout } from "@/server/services/submission-service";
import { featuredLaunchCheckoutSchema } from "@/server/validators/submission";

export async function POST(request: NextRequest) {
  try {
    getEnv();

    if (!premiumLaunchAvailable) {
      throw new AppError(503, premiumLaunchUnavailableMessage);
    }

    const session = await requireSession(request);
    const body = featuredLaunchCheckoutSchema.parse(await request.json());

    const checkout = await createPremiumLaunchCheckout(body.submissionId, {
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

- [ ] **Step 3: Add the verified Dodo webhook route**

```ts
import { headers } from "next/headers";
import { Webhook } from "standardwebhooks";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import {
  handlePremiumLaunchPaymentSucceeded,
  handlePremiumLaunchRefundSucceeded,
} from "@/server/services/submission-service";

export async function POST(request: Request) {
  const env = getEnv();
  const rawBody = await request.text();
  const headersList = await headers();
  const verifier = new Webhook(env.DODO_PAYMENTS_WEBHOOK_SECRET ?? "dodo_webhook_secret_missing");

  try {
    verifier.verify(rawBody, {
      "webhook-id": headersList.get("webhook-id") ?? "",
      "webhook-signature": headersList.get("webhook-signature") ?? "",
      "webhook-timestamp": headersList.get("webhook-timestamp") ?? "",
    });
  } catch (error) {
    console.error("[shipboost dodo] invalid webhook signature", error);
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    type: string;
    data: {
      payment_id?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    };
  };

  if (payload.type === "payment.succeeded" && payload.data.payment_id) {
    await handlePremiumLaunchPaymentSucceeded({
      paymentId: payload.data.payment_id,
      metadata: payload.data.metadata ?? {},
    });
    revalidateAllPublicContent();
  }

  if (
    (payload.type === "refund.created" || payload.type === "refund.succeeded") &&
    payload.data.payment_id &&
    (!payload.data.status || payload.data.status === "succeeded")
  ) {
    await handlePremiumLaunchRefundSucceeded({
      paymentId: payload.data.payment_id,
    });
    revalidateAllPublicContent();
  }

  return new Response("OK", { status: 200 });
}
```

- [ ] **Step 4: Update the dashboard reconciliation to use Dodo return params**

```ts
type DashboardPageProps = {
  searchParams?: Promise<{
    checkout?: string;
    submission_id?: string;
    payment_id?: string;
    status?: string;
  }>;
};

const reconciledCheckoutSubmission =
  resolvedSearchParams?.checkout === "success" &&
  resolvedSearchParams.submission_id &&
  resolvedSearchParams.payment_id
    ? await reconcilePremiumLaunchPayment({
        submissionId: resolvedSearchParams.submission_id,
        paymentId: resolvedSearchParams.payment_id,
      })
    : null;
```

- [ ] **Step 5: Run the payment-service tests again after route wiring**

Run: `npm run test -- src/server/services/submission-payment-service.test.ts src/server/dodo.test.ts`
Expected: PASS with the service and provider scaffolding tests green.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/dodo/checkout/premium-launch/route.ts src/app/api/dodo/webhooks/route.ts src/app/dashboard/page.tsx src/app/api/submissions/[submissionId]/reschedule/route.ts src/server/validators/submission.ts
git commit -m "feat: add Dodo routes and dashboard reconciliation"
```

## Task 4: Update Founder UI, Error Messages, and Emails to Premium Launch Naming

**Files:**
- Modify: `src/components/founder/submit-product-form.tsx`
- Modify: `src/components/founder/founder-dashboard.tsx`
- Modify: `src/server/services/submission-draft-service.ts`
- Modify: `src/server/email/transactional.ts`

- [ ] **Step 1: Point the founder submit flow at the new Dodo checkout route**

```ts
const response = await fetch("/api/dodo/checkout/premium-launch", {
  method: "POST",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({ submissionId: savedDraft.id }),
});
```

- [ ] **Step 2: Point the founder dashboard retry flow at the new Dodo checkout route**

```ts
const result = await apiRequest<{ checkoutUrl: string }>(
  "/api/dodo/checkout/premium-launch",
  {
    method: "POST",
    body: JSON.stringify({ submissionId }),
  },
);
```

- [ ] **Step 3: Replace the remaining featured-launch copy in draft validation and transactional email content**

```ts
// src/server/services/submission-draft-service.ts
if (submission.submissionType === "FEATURED_LAUNCH") {
  throw new AppError(400, "Premium launches must go through checkout.");
}
```

```ts
// src/server/email/transactional.ts
paragraph(
  "Next step: submit your SaaS, request a premium launch, or start with a clean affiliate-ready listing.",
),
```

```ts
export async function sendPremiumLaunchPaidEmailMessage(input: {
  to: string;
  name?: string | null;
  dashboardUrl: string;
  toolName: string;
  launchDate: string;
}) {
  const subject = `${input.toolName} premium launch is reserved`;
  const preview = "Payment received and your premium launch slot is confirmed.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Premium launch reserved"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}payment was received for <strong>${escapeHtml(
          input.toolName,
        )}</strong>.`,
      ),
      paragraph(
        `Your premium launch is scheduled for <strong>${escapeHtml(
          input.launchDate,
        )}</strong>.`,
      ),
      ctaButton(input.dashboardUrl, "Open dashboard"),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      `Payment was received for ${input.toolName}.`,
      `Premium launch date: ${input.launchDate}`,
      `Dashboard: ${input.dashboardUrl}`,
    ].join("\n"),
  });
}
```

- [ ] **Step 4: Run lint after the route-path and copy updates**

Run: `npm run lint`
Expected: PASS with no stale imports or deleted-route references.

- [ ] **Step 5: Commit**

```bash
git add src/components/founder/submit-product-form.tsx src/components/founder/founder-dashboard.tsx src/server/services/submission-draft-service.ts src/server/email/transactional.ts
git commit -m "refactor: rename featured launch app copy to premium launch"
```

## Task 5: Add Cached Dodo Pricing to the Pricing Page

**Files:**
- Create: `src/server/services/dodo-product-service.ts`
- Create: `src/server/services/dodo-product-service.test.ts`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/server/services/founding-offer-service.test.ts`

- [ ] **Step 1: Write the failing Dodo product pricing test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDodoClientMock } = vi.hoisted(() => ({
  getDodoClientMock: vi.fn(),
}));

vi.mock("@/server/dodo", () => ({
  getDodoClient: getDodoClientMock,
}));

vi.mock("@/server/env", () => ({
  getEnv: () => ({
    DODO_PREMIUM_LAUNCH_PRODUCT_ID: "prod_premium_1",
  }),
}));

import { getPremiumLaunchPriceCard } from "@/server/services/dodo-product-service";

describe("dodo-product-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("formats the live Dodo premium-launch price", async () => {
    getDodoClientMock.mockReturnValue({
      products: {
        retrieve: vi.fn().mockResolvedValue({
          price: 900,
          currency: "USD",
        }),
      },
    });

    await expect(getPremiumLaunchPriceCard()).resolves.toEqual({
      currentPrice: "$9",
      currentPriceCents: 900,
      compareAtPrice: "$19",
    });
  });

  it("falls back to the default current price when Dodo is unavailable", async () => {
    getDodoClientMock.mockReturnValue({
      products: {
        retrieve: vi.fn().mockRejectedValue(new Error("Dodo unavailable")),
      },
    });

    await expect(getPremiumLaunchPriceCard()).resolves.toEqual({
      currentPrice: "$9",
      currentPriceCents: 900,
      compareAtPrice: "$19",
    });
  });
});
```

- [ ] **Step 2: Run the new pricing test to confirm the service is missing**

Run: `npm run test -- src/server/services/dodo-product-service.test.ts`
Expected: FAIL with a module resolution error for `@/server/services/dodo-product-service`.

- [ ] **Step 3: Implement the cached Dodo pricing service**

```ts
import { unstable_cache } from "next/cache";

import { getDodoClient } from "@/server/dodo";
import { getEnv } from "@/server/env";

const FALLBACK_CURRENT_PRICE_CENTS = 900;
const FALLBACK_COMPARE_AT_PRICE = "$19";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function loadPremiumLaunchPriceCard() {
  const env = getEnv();

  if (!env.DODO_PREMIUM_LAUNCH_PRODUCT_ID) {
    return {
      currentPrice: formatUsd(FALLBACK_CURRENT_PRICE_CENTS),
      currentPriceCents: FALLBACK_CURRENT_PRICE_CENTS,
      compareAtPrice: FALLBACK_COMPARE_AT_PRICE,
    };
  }

  try {
    const dodo = getDodoClient();
    const product = await dodo.products.retrieve(env.DODO_PREMIUM_LAUNCH_PRODUCT_ID);
    const priceInCents =
      typeof product.price === "number" && product.price > 0
        ? product.price
        : FALLBACK_CURRENT_PRICE_CENTS;

    return {
      currentPrice: formatUsd(priceInCents),
      currentPriceCents: priceInCents,
      compareAtPrice: FALLBACK_COMPARE_AT_PRICE,
    };
  } catch (error) {
    console.error("[shipboost dodo] failed to load premium launch price", error);

    return {
      currentPrice: formatUsd(FALLBACK_CURRENT_PRICE_CENTS),
      currentPriceCents: FALLBACK_CURRENT_PRICE_CENTS,
      compareAtPrice: FALLBACK_COMPARE_AT_PRICE,
    };
  }
}

export const getCachedPremiumLaunchPriceCard = unstable_cache(
  loadPremiumLaunchPriceCard,
  ["dodo-premium-launch-price", "v1"],
  { revalidate: 900 },
);

export async function getPremiumLaunchPriceCard() {
  return getCachedPremiumLaunchPriceCard();
}
```

- [ ] **Step 4: Update the pricing page to use the cached Dodo price**

```ts
import { getPremiumLaunchPriceCard } from "@/server/services/dodo-product-service";

export const revalidate = 900;

export default async function PricingPage() {
  const env = getEnv();
  const isPrelaunch = env.NEXT_PUBLIC_PRELAUNCH_MODE === "true";
  const foundingSpotsLeft = await getRemainingFoundingPremiumLaunchSpots();
  const foundingPremiumPrice = await getPremiumLaunchPriceCard();

  const pricingTiers = [
    {
      name: "Premium Launch",
      price: foundingPremiumPrice.currentPrice,
      originalPrice: foundingPremiumPrice.compareAtPrice,
      description:
        "Choose your launch week, skip badge verification, and get priority placement in the weekly launchpad.",
      eyebrow: "Founding offer",
      foundingSpotsLabel: "First 100 Premium Launches",
      ctaLabel: premiumLaunchAvailable ? "Reserve premium launch" : "Temporarily unavailable",
      ctaHref: premiumLaunchAvailable ? "/submit" : undefined,
      availabilityNote: premiumLaunchAvailable ? undefined : premiumLaunchUnavailableMessage,
      highlight: true,
      icon: Star,
      points: [
        "Choose your launch week",
        "Premium placement in the weekly launchpad",
        "No badge required",
        "Priority ordering over free launches",
      ],
    },
  ] as const;
```

- [ ] **Step 5: Keep the founder-spot count expectations explicit**

```ts
it("returns the remaining founding premium launch spots", async () => {
  prismaMock.submission.count.mockResolvedValueOnce(34);

  await expect(getRemainingFoundingPremiumLaunchSpots()).resolves.toBe(66);
  expect(prismaMock.submission.count).toHaveBeenCalledWith({
    where: {
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
    },
  });
});
```

- [ ] **Step 6: Run the pricing and founder-offer tests**

Run: `npm run test -- src/server/services/dodo-product-service.test.ts src/server/services/founding-offer-service.test.ts`
Expected: PASS with both test files green.

- [ ] **Step 7: Commit**

```bash
git add src/server/services/dodo-product-service.ts src/server/services/dodo-product-service.test.ts src/app/pricing/page.tsx src/server/services/founding-offer-service.test.ts
git commit -m "feat: add cached Dodo pricing for premium launch"
```

## Task 6: Remove Polar, Update Docs, and Run Full Verification

**Files:**
- Delete: `src/server/polar.ts`
- Delete: `src/app/api/polar/checkout/featured-launch/route.ts`
- Delete: `src/app/api/polar/webhooks/route.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/deploy-digitalocean-app-platform.md`
- Modify: `docs/performance-baseline.md`

- [ ] **Step 1: Remove the dead Polar dependencies and files**

```bash
npm uninstall @polar-sh/sdk @polar-sh/nextjs
git rm src/server/polar.ts
git rm src/app/api/polar/checkout/featured-launch/route.ts
git rm src/app/api/polar/webhooks/route.ts
```

- [ ] **Step 2: Update the operational docs to Dodo terminology**

```md
### Dodo premium launch payments

- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_WEBHOOK_SECRET`
- `DODO_PAYMENTS_MODE`
- `DODO_PREMIUM_LAUNCH_PRODUCT_ID`
- webhook endpoint: `/api/dodo/webhooks`
- checkout endpoint: `/api/dodo/checkout/premium-launch`
```

- [ ] **Step 3: Verify no active app code still references Polar except the temporary Prisma field names**

Run: `rg -n "polar" src .env.example .env.production.example package.json docs/deploy-digitalocean-app-platform.md docs/performance-baseline.md`
Expected: only the temporary Prisma field names in service code or tests remain, plus any historical references outside active runtime docs that are intentionally preserved.

- [ ] **Step 4: Run the full migration verification suite**

Run: `npm run test`
Expected: PASS across the Vitest suite.

Run: `npm run lint`
Expected: PASS with no stale import, route, or naming errors.

Run: `npx tsc --noEmit`
Expected: PASS with the Dodo route, payment, and pricing types resolved cleanly.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json docs/deploy-digitalocean-app-platform.md docs/performance-baseline.md
git add -u src/server/polar.ts src/app/api/polar
git commit -m "chore: remove Polar payment integration"
```

## Self-Review Checklist

- [ ] The plan keeps the database stable in release 1 and does not rename Prisma columns or enum values.
- [ ] The plan introduces Dodo checkout, payment reconciliation, refund handling, and cached product pricing.
- [ ] Every route/path change is reflected in both server code and founder UI entry points.
- [ ] The founder-spot countdown remains based on `submissionType === "FEATURED_LAUNCH"` and `paymentStatus === "PAID"`.
- [ ] The pricing page fetch stays server-side and cached; there is no client-side Dodo request.
- [ ] Polar is fully removed from active runtime code by the end of the plan.
