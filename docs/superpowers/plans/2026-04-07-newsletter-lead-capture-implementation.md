# Newsletter Lead Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a DB-first newsletter lead capture backend for the “800+ startup directories list” offer, sync leads into Resend, and send the lead magnet email immediately after signup.

**Architecture:** Add a dedicated `Lead` model as the source of truth, then layer a focused lead-capture service on top that handles normalization, idempotent upsert behavior, Resend contact sync, and lead magnet delivery. Keep route handlers thin and reusable, then wire a single homepage form to the new endpoint.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Resend, Zod, Vitest

---

## File Structure

### New files
- `prisma/migrations/<timestamp>_add_leads/migration.sql`
  - migration for the `Lead` model and `LeadStatus` enum
- `src/server/validators/lead.ts`
  - request validation for public lead capture
- `src/server/services/lead-service.ts`
  - DB-first capture flow, idempotent upsert, Resend sync orchestration
- `src/server/services/lead-service.test.ts`
  - service tests for create/update behavior and failure handling
- `src/app/api/leads/route.ts`
  - public endpoint for lead capture
- `src/components/public/home-lead-magnet-form.tsx`
  - first homepage form for the directories offer

### Modified files
- `prisma/schema.prisma`
  - add `LeadStatus` enum and `Lead` model
- `src/server/env.ts`
  - add `LEAD_MAGNET_STARTUP_DIRECTORIES_URL`
- `src/server/email/transactional.ts`
  - add lead magnet delivery email helper
- `src/app/page.tsx`
  - render the homepage lead magnet form

### Existing files to reference
- `src/server/email/transactional.ts`
  - current Resend email helper patterns
- `src/server/services/submission-service-shared.ts`
  - current safe-email wrapper pattern
- `src/app/api/listing-claims/route.ts`
  - thin route handler pattern

---

### Task 1: Add the lead schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_leads/migration.sql`

- [ ] **Step 1: Add the enum and model to Prisma**

Update `prisma/schema.prisma`:

```prisma
enum LeadStatus {
  ACTIVE
  UNSUBSCRIBED
}

model Lead {
  id                String     @id @default(cuid())
  email             String     @unique
  status            LeadStatus @default(ACTIVE)
  source            String
  leadMagnet        String
  consentedAt       DateTime
  firstSubscribedAt DateTime
  lastSubmittedAt   DateTime
  resendContactId   String?
  name              String?
  utmSource         String?
  utmMedium         String?
  utmCampaign       String?
  utmContent        String?
  utmTerm           String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@index([status])
  @@index([source])
  @@index([leadMagnet])
}
```

- [ ] **Step 2: Add the SQL migration file**

Create `prisma/migrations/<timestamp>_add_leads/migration.sql`:

```sql
CREATE TYPE "LeadStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED');

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT NOT NULL,
    "leadMagnet" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "firstSubscribedAt" TIMESTAMP(3) NOT NULL,
    "lastSubmittedAt" TIMESTAMP(3) NOT NULL,
    "resendContactId" TEXT,
    "name" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_source_idx" ON "Lead"("source");
CREATE INDEX "Lead_leadMagnet_idx" ON "Lead"("leadMagnet");
```

- [ ] **Step 3: Generate Prisma client**

Run: `npm run prisma:generate`
Expected: PASS with Prisma Client generated successfully

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add lead capture schema"
```

### Task 2: Add validation and environment support

**Files:**
- Create: `src/server/validators/lead.ts`
- Modify: `src/server/env.ts`

- [ ] **Step 1: Add the lead capture validator**

Create `src/server/validators/lead.ts`:

```ts
import { z } from "zod";

const optionalTrackingField = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const leadCaptureSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  source: z.string().trim().min(1).max(100),
  leadMagnet: z.string().trim().min(1).max(100),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  utmSource: optionalTrackingField,
  utmMedium: optionalTrackingField,
  utmCampaign: optionalTrackingField,
  utmContent: optionalTrackingField,
  utmTerm: optionalTrackingField,
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
```

- [ ] **Step 2: Add lead magnet URL env support**

Update `src/server/env.ts`:

```ts
  LEAD_MAGNET_STARTUP_DIRECTORIES_URL: optionalEnvString,
```

and include it in `getEnv()`:

```ts
      LEAD_MAGNET_STARTUP_DIRECTORIES_URL:
        process.env.LEAD_MAGNET_STARTUP_DIRECTORIES_URL,
```

- [ ] **Step 3: Run lint**

Run: `npm run lint -- src/server/validators/lead.ts src/server/env.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/server/validators/lead.ts src/server/env.ts
git commit -m "feat: add lead capture validation"
```

### Task 3: Add the lead magnet delivery email helper

**Files:**
- Modify: `src/server/email/transactional.ts`

- [ ] **Step 1: Add the delivery email helper**

Append this helper to `src/server/email/transactional.ts`:

```ts
export async function sendStartupDirectoriesLeadMagnetEmail(input: {
  to: string;
  name?: string | null;
  directoriesUrl: string;
}) {
  const subject = "Your 800+ startup directories list is ready";
  const preview = "Use this list to submit your startup to more directories.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Here’s your startup directories list"),
      paragraph(
        `${greeting}here is the 800+ startup directories list you requested from Shipboost.`,
      ),
      paragraph(
        "Use it to find relevant places to submit your startup and build steady distribution over time.",
      ),
      ctaButton(input.directoriesUrl, "Open the directories list"),
      paragraph(
        "You’ll also get occasional growth and distribution emails from Shipboost. You can unsubscribe any time.",
      ),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      "Here is your 800+ startup directories list:",
      input.directoriesUrl,
      "",
      "You’ll also get occasional growth and distribution emails from Shipboost. You can unsubscribe any time.",
    ].join("\n"),
  });
}
```

- [ ] **Step 2: Run lint**

Run: `npm run lint -- src/server/email/transactional.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/server/email/transactional.ts
git commit -m "feat: add lead magnet delivery email"
```

### Task 4: Implement and test the lead service

**Files:**
- Create: `src/server/services/lead-service.ts`
- Create: `src/server/services/lead-service.test.ts`

- [ ] **Step 1: Write the failing service tests**

Create `src/server/services/lead-service.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, resendMock, emailMock, envMock } = vi.hoisted(() => ({
  prismaMock: {
    lead: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  resendMock: {
    contacts: {
      create: vi.fn(),
    },
  },
  emailMock: {
    sendStartupDirectoriesLeadMagnetEmail: vi.fn(),
  },
  envMock: {
    RESEND_API_KEY: "re_test",
    LEAD_MAGNET_STARTUP_DIRECTORIES_URL:
      "https://example.com/startup-directories",
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => resendMock),
}));

vi.mock("@/server/email/transactional", () => emailMock);

vi.mock("@/server/env", () => ({
  getEnv: () => envMock,
}));

import { captureLead } from "@/server/services/lead-service";

describe("captureLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new active lead", async () => {
    prismaMock.lead.findUnique.mockResolvedValueOnce(null);
    prismaMock.lead.create.mockResolvedValueOnce({
      id: "lead_1",
      email: "founder@example.com",
      status: "ACTIVE",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      consentedAt: new Date(),
      firstSubscribedAt: new Date(),
      lastSubmittedAt: new Date(),
      resendContactId: null,
      name: null,
      utmSource: "twitter",
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await captureLead({
      email: "Founder@Example.com",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      utmSource: "twitter",
    });

    expect(prismaMock.lead.create).toHaveBeenCalled();
    expect(result.created).toBe(true);
    expect(result.lead.email).toBe("founder@example.com");
  });

  it("updates an existing lead instead of duplicating it", async () => {
    prismaMock.lead.findUnique.mockResolvedValueOnce({
      id: "lead_1",
      email: "founder@example.com",
      status: "ACTIVE",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      consentedAt: new Date("2026-04-01T00:00:00.000Z"),
      firstSubscribedAt: new Date("2026-04-01T00:00:00.000Z"),
      lastSubmittedAt: new Date("2026-04-01T00:00:00.000Z"),
      resendContactId: "contact_1",
      name: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.lead.update.mockResolvedValueOnce({
      id: "lead_1",
      email: "founder@example.com",
      status: "ACTIVE",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      consentedAt: new Date("2026-04-01T00:00:00.000Z"),
      firstSubscribedAt: new Date("2026-04-01T00:00:00.000Z"),
      lastSubmittedAt: new Date(),
      resendContactId: "contact_1",
      name: null,
      utmSource: "twitter",
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await captureLead({
      email: "founder@example.com",
      source: "homepage_directory_list",
      leadMagnet: "startup-directories-800",
      utmSource: "twitter",
    });

    expect(prismaMock.lead.update).toHaveBeenCalled();
    expect(result.created).toBe(false);
  });
});
```

- [ ] **Step 2: Run the lead service test to confirm it fails**

Run: `npm test -- src/server/services/lead-service.test.ts`
Expected: FAIL with module not found for `lead-service`

- [ ] **Step 3: Implement the lead service**

Create `src/server/services/lead-service.ts`:

```ts
import { Resend } from "resend";

import { sendStartupDirectoriesLeadMagnetEmail } from "@/server/email/transactional";
import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";
import { type LeadCaptureInput } from "@/server/validators/lead";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getResendClient() {
  const env = getEnv();

  if (!env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(env.RESEND_API_KEY);
}

async function syncLeadToResend(lead: {
  id: string;
  email: string;
  name: string | null;
  source: string;
  leadMagnet: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
}) {
  const resend = getResendClient();

  if (!resend) {
    return null;
  }

  const [firstName, ...rest] = (lead.name ?? "").trim().split(/\s+/).filter(Boolean);
  const lastName = rest.length > 0 ? rest.join(" ") : undefined;
  const response = await resend.contacts.create({
    email: lead.email,
    firstName: firstName || undefined,
    lastName,
    unsubscribed: false,
    properties: {
      source: lead.source,
      lead_magnet: lead.leadMagnet,
      utm_source: lead.utmSource ?? "",
      utm_medium: lead.utmMedium ?? "",
      utm_campaign: lead.utmCampaign ?? "",
      utm_content: lead.utmContent ?? "",
      utm_term: lead.utmTerm ?? "",
    },
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.id ?? null;
}

async function deliverLeadMagnet(lead: { email: string; name: string | null }) {
  const env = getEnv();

  if (!env.LEAD_MAGNET_STARTUP_DIRECTORIES_URL) {
    return;
  }

  await sendStartupDirectoriesLeadMagnetEmail({
    to: lead.email,
    name: lead.name,
    directoriesUrl: env.LEAD_MAGNET_STARTUP_DIRECTORIES_URL,
  });
}

export async function captureLead(input: LeadCaptureInput) {
  const email = normalizeEmail(input.email);
  const now = new Date();

  const existing = await prisma.lead.findUnique({
    where: { email },
  });

  const lead = existing
    ? await prisma.lead.update({
        where: { email },
        data: {
          lastSubmittedAt: now,
          source: existing.source || input.source,
          leadMagnet: existing.leadMagnet || input.leadMagnet,
          name: existing.name || input.name,
          utmSource: existing.utmSource || input.utmSource,
          utmMedium: existing.utmMedium || input.utmMedium,
          utmCampaign: existing.utmCampaign || input.utmCampaign,
          utmContent: existing.utmContent || input.utmContent,
          utmTerm: existing.utmTerm || input.utmTerm,
        },
      })
    : await prisma.lead.create({
        data: {
          email,
          source: input.source,
          leadMagnet: input.leadMagnet,
          consentedAt: now,
          firstSubscribedAt: now,
          lastSubmittedAt: now,
          name: input.name,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          utmContent: input.utmContent,
          utmTerm: input.utmTerm,
        },
      });

  try {
    const resendContactId = await syncLeadToResend(lead);

    if (resendContactId && resendContactId !== lead.resendContactId) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { resendContactId },
      });
      lead.resendContactId = resendContactId;
    }
  } catch (error) {
    console.error("[shipboost lead:resend-sync-error]", error);
  }

  try {
    await deliverLeadMagnet(lead);
  } catch (error) {
    console.error("[shipboost lead:delivery-error]", error);
  }

  return {
    created: !existing,
    lead,
  };
}
```

- [ ] **Step 4: Run the service tests**

Run: `npm test -- src/server/services/lead-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/services/lead-service.ts src/server/services/lead-service.test.ts
git commit -m "feat: add lead capture service"
```

### Task 5: Add the public lead capture route

**Files:**
- Create: `src/app/api/leads/route.ts`

- [ ] **Step 1: Add the route handler**

Create `src/app/api/leads/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { getEnv } from "@/server/env";
import { created, errorResponse, ok } from "@/server/http/response";
import { captureLead } from "@/server/services/lead-service";
import { leadCaptureSchema } from "@/server/validators/lead";

export async function POST(request: NextRequest) {
  try {
    getEnv();
    const body = leadCaptureSchema.parse(await request.json());
    const result = await captureLead(body);

    const payload = {
      id: result.lead.id,
      email: result.lead.email,
      status: result.lead.status,
    };

    return result.created ? created(payload) : ok(payload);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Run lint and typecheck**

Run: `npm run lint -- src/app/api/leads/route.ts`
Expected: PASS

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/api/leads/route.ts
git commit -m "feat: add public lead capture route"
```

### Task 6: Add the homepage lead magnet form

**Files:**
- Create: `src/components/public/home-lead-magnet-form.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add the form component**

Create `src/components/public/home-lead-magnet-form.tsx`:

```tsx
"use client";

import { useState } from "react";

const source = "homepage_directory_list";
const leadMagnet = "startup-directories-800";

export function HomeLeadMagnetForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source,
          leadMagnet,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to join the list right now.");
      }

      setSuccessMessage(
        "Check your inbox. Shipboost is sending the startup directories list now.",
      );
      setEmail("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to join the list right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-black/10 bg-[#fff9ef] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
      <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
        Free founder resource
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-black">
        Get the 800+ startup directories list
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-black/66">
        Join the Shipboost newsletter and get the directory list founders use to
        find more submission opportunities without paying for another tool.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@startup.com"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Get the list"}
        </button>
      </form>

      <p className="mt-4 text-sm leading-6 text-black/58">
        Get the 800+ startup directories list plus occasional startup growth emails.
        Unsubscribe anytime.
      </p>

      {successMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 2: Render the form on the homepage**

Update `src/app/page.tsx`:

```tsx
import { HomeLeadMagnetForm } from "@/components/public/home-lead-magnet-form";
```

and render it after the search modal block:

```tsx
          <HomeLeadMagnetForm />

          <div className="grid gap-4 sm:grid-cols-3">
```

- [ ] **Step 3: Run lint and typecheck**

Run: `npm run lint -- src/components/public/home-lead-magnet-form.tsx src/app/page.tsx`
Expected: PASS

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/public/home-lead-magnet-form.tsx src/app/page.tsx
git commit -m "feat: add homepage lead magnet capture form"
```

### Task 7: Final verification

**Files:**
- Verify all files from Tasks 1-6

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm test -- src/server/services/lead-service.test.ts
```

Expected: PASS

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS

- [ ] **Step 3: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS

- [ ] **Step 4: Apply the migration**

Run:

```bash
node scripts/run-with-env.mjs prisma migrate deploy
```

Expected: PASS with the new lead migration applied to the target database

- [ ] **Step 5: Manually verify homepage capture**

Run the app and verify:

1. Open `/`
2. Submit a new email through the lead magnet form
3. Confirm network call hits `POST /api/leads`
4. Confirm success message appears
5. Confirm lead exists in the DB
6. Confirm lead magnet email is sent when Resend and `LEAD_MAGNET_STARTUP_DIRECTORIES_URL` are configured

- [ ] **Step 6: Commit**

```bash
git add prisma src
git commit -m "feat: add newsletter lead capture flow"
```
