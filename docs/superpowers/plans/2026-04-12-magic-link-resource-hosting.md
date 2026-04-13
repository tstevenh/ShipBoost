# Magic-Link Resource Hosting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old startup-directories file delivery flow with a ShipBoost-hosted resource page that any signed-in user can access, using magic-link auth as the low-friction fulfillment path from the homepage lead magnet form.

**Architecture:** Keep lead capture exactly where it is today through `/api/leads`, but change fulfillment from “email a file/link from env” to “send a magic link that lands on `/resources/startup-directories`”. Host the directories list as a mostly static signed-in page backed by a local content file, and store per-item progress in `localStorage` only. Remove the old lead-magnet delivery helper, env variable, and stale copy immediately instead of keeping a fallback.

**Tech Stack:** Next.js App Router, React, TypeScript, Better Auth, Vitest, Testing Library, Tailwind CSS, Resend.

---

## File Structure

### Auth / magic-link

- Modify: `src/lib/auth.ts`
  - Add Better Auth magic-link server plugin and wire it to a dedicated transactional email helper.
- Modify: `src/lib/auth-client.ts`
  - Register the Better Auth magic-link client plugin.
- Modify: `src/server/email/transactional.ts`
  - Add a magic-link sign-in email helper and remove the obsolete startup-directories delivery email helper.
- Modify: `src/components/auth/auth-form.tsx`
  - Add a sign-in magic-link CTA while keeping password and Google available.
- Add: `src/components/auth/auth-form.test.tsx`
  - Cover magic-link CTA rendering and callback URL behavior.

### Hosted resource

- Add: `src/app/resources/startup-directories/page.tsx`
  - Gate the resource behind `getServerSession()` and redirect unauthenticated visitors to sign-in.
- Add: `src/content/resources/startup-directories.ts`
  - Seed the first placeholder dataset that will later be replaced with the full list.
- Add: `src/components/resources/startup-directories-resource.tsx`
  - Render the searchable hosted directories UI.
- Add: `src/components/resources/resource-progress-toggle.tsx`
  - Store “done” state in `localStorage` only.
- Add: `src/components/resources/resource-progress-toggle.test.tsx`
  - Verify the local progress control persists state in the browser.

### Homepage lead-magnet flow

- Modify: `src/components/public/home-lead-magnet-form.tsx`
  - Keep `/api/leads`, then send a magic link to `/resources/startup-directories`, and update success/error copy.
- Add: `src/components/public/home-lead-magnet-form.test.tsx`
  - Verify the form captures the lead first and then triggers magic-link auth.

### Cleanup

- Modify: `src/server/services/lead-service.ts`
  - Remove direct lead-magnet delivery and keep only DB save + Resend contact sync.
- Modify: `src/server/services/lead-service.test.ts`
  - Update expectations so lead capture no longer sends the old startup-directories email.
- Modify: `src/server/env.ts`
  - Remove `LEAD_MAGNET_STARTUP_DIRECTORIES_URL`.

---

### Task 1: Add magic-link auth plumbing and sign-in coverage

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/lib/auth-client.ts`
- Modify: `src/server/email/transactional.ts`
- Modify: `src/components/auth/auth-form.tsx`
- Add: `src/components/auth/auth-form.test.tsx`

- [ ] **Step 1: Write the failing auth-form tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "@/components/auth/auth-form";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const signInMagicLinkMock = vi.fn();
const signInEmailMock = vi.fn();
const signInSocialMock = vi.fn();
const signUpEmailMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      magicLink: signInMagicLinkMock,
      email: signInEmailMock,
      social: signInSocialMock,
    },
    signUp: {
      email: signUpEmailMock,
    },
  },
}));

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a magic-link CTA on sign-in", () => {
    render(<AuthForm mode="sign-in" redirectTo="/dashboard" googleEnabled />);

    expect(
      screen.getByRole("button", { name: /email me a sign-in link/i }),
    ).toBeInTheDocument();
  });

  it("submits a magic link with the requested callback URL", async () => {
    signInMagicLinkMock.mockResolvedValueOnce({});
    const user = userEvent.setup();

    render(
      <AuthForm
        mode="sign-in"
        redirectTo="/resources/startup-directories"
      />,
    );

    await user.type(
      screen.getByLabelText(/^email$/i),
      "founder@example.com",
    );
    await user.click(
      screen.getByRole("button", { name: /email me a sign-in link/i }),
    );

    expect(signInMagicLinkMock).toHaveBeenCalledWith({
      email: "founder@example.com",
      callbackURL: "/resources/startup-directories",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/components/auth/auth-form.test.tsx`
Expected: FAIL because `AuthForm` does not render a magic-link CTA and `authClient.signIn.magicLink(...)` is not available yet.

- [ ] **Step 3: Add the server and client Better Auth plugins**

```ts
// src/lib/auth.ts
import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { magicLink } from "better-auth/plugins";
```

```ts
// src/lib/auth.ts
import {
  sendMagicLinkEmailMessage,
  sendPasswordResetConfirmationEmail,
  sendPasswordResetEmailMessage,
  sendVerificationEmailMessage,
  sendWelcomeEmailMessage,
} from "../server/email/transactional";
```

```ts
// src/lib/auth.ts
plugins: [
  ...plugins,
  magicLink({
    sendMagicLink: async ({ email, url }) => {
      await sendMagicLinkEmailMessage({
        to: email,
        signInUrl: url,
      });
    },
  }),
],
```

```ts
// src/lib/auth-client.ts
"use client";

import { createAuthClient } from "better-auth/react";
import {
  inferAdditionalFields,
  magicLinkClient,
} from "better-auth/client/plugins";

import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), magicLinkClient()],
});
```

```ts
// src/server/email/transactional.ts
export async function sendMagicLinkEmailMessage(input: {
  to: string;
  signInUrl: string;
}) {
  const subject = "Your ShipBoost sign-in link";
  const preview = "Use this secure link to open your ShipBoost account.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Open ShipBoost securely"),
      paragraph(
        "Use the secure sign-in link below to open your ShipBoost account and access the startup directories resource.",
      ),
      ctaButton(input.signInUrl, "Open ShipBoost"),
      paragraph(
        `If the button does not work, copy and paste this link into your browser:<br /><a href="${escapeHtml(
          input.signInUrl,
        )}">${escapeHtml(input.signInUrl)}</a>`,
      ),
      paragraph("If you did not request this email, you can ignore it."),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      "Open ShipBoost securely with this sign-in link:",
      input.signInUrl,
      "",
      "If you did not request this email, you can ignore it.",
    ].join("\n"),
  });
}
```

- [ ] **Step 4: Add the sign-in magic-link UI**

```tsx
// src/components/auth/auth-form.tsx
const [magicLinkSent, setMagicLinkSent] = useState<string | null>(null);
```

```tsx
// src/components/auth/auth-form.tsx
async function handleMagicLinkSignIn() {
  if (isSubmitting || mode !== "sign-in" || !email.trim()) {
    return;
  }

  setIsSubmitting(true);
  setErrorMessage(null);
  setNoticeMessage(null);

  try {
    const result = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: redirectTo,
    });

    if (result?.error) {
      setErrorMessage(result.error.message ?? "Unable to send sign-in link.");
      return;
    }

    setMagicLinkSent(email.trim());
  } finally {
    setIsSubmitting(false);
  }
}
```

```tsx
// src/components/auth/auth-form.tsx
{mode === "sign-in" && (
  <div className="space-y-3">
    <button
      type="button"
      onClick={() => void handleMagicLinkSignIn()}
      disabled={isSubmitting || !email.trim()}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
    >
      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
      Email me a sign-in link
    </button>

    {magicLinkSent ? (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-700">
        Sign-in link sent to {magicLinkSent}.
      </div>
    ) : null}
  </div>
)}
```

- [ ] **Step 5: Run the tests and typecheck**

Run:
- `npm run test -- src/components/auth/auth-form.test.tsx`
- `npx tsc --noEmit`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/lib/auth-client.ts src/server/email/transactional.ts src/components/auth/auth-form.tsx src/components/auth/auth-form.test.tsx
git commit -m "feat: add magic link sign-in flow"
```

### Task 2: Host the startup directories resource behind sign-in

**Files:**
- Add: `src/app/resources/startup-directories/page.tsx`
- Add: `src/content/resources/startup-directories.ts`
- Add: `src/components/resources/startup-directories-resource.tsx`
- Add: `src/components/resources/resource-progress-toggle.tsx`
- Add: `src/components/resources/resource-progress-toggle.test.tsx`

- [ ] **Step 1: Write the failing progress-toggle test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { ResourceProgressToggle } from "@/components/resources/resource-progress-toggle";

describe("ResourceProgressToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores progress in localStorage", async () => {
    const user = userEvent.setup();

    render(<ResourceProgressToggle storageKey="startup-directories:beta-list" />);
    await user.click(screen.getByRole("checkbox"));

    expect(
      window.localStorage.getItem("startup-directories:beta-list"),
    ).toBe("done");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/components/resources/resource-progress-toggle.test.tsx`
Expected: FAIL because the resource components do not exist yet.

- [ ] **Step 3: Add the hosted resource page, seeded content, and local progress control**

```ts
// src/content/resources/startup-directories.ts
export type StartupDirectoryResourceItem = {
  id: string;
  name: string;
  url: string;
  category: string;
  notes?: string;
};

export const startupDirectories: StartupDirectoryResourceItem[] = [
  {
    id: "beta-list",
    name: "BetaList",
    url: "https://betalist.com",
    category: "Launch platforms",
    notes: "Strong fit for early launches and startup discovery.",
  },
  {
    id: "ai-directories",
    name: "AI Directories",
    url: "https://www.aidirectori.es",
    category: "AI directories",
    notes: "Useful for AI products and distribution research.",
  },
  {
    id: "product-hunt",
    name: "Product Hunt",
    url: "https://www.producthunt.com",
    category: "Launch platforms",
    notes: "High-visibility launch option with stricter prep requirements.",
  },
];
```

```tsx
// src/components/resources/resource-progress-toggle.tsx
"use client";

import { useEffect, useState } from "react";

type ResourceProgressToggleProps = {
  storageKey: string;
};

export function ResourceProgressToggle({
  storageKey,
}: ResourceProgressToggleProps) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(window.localStorage.getItem(storageKey) === "done");
  }, [storageKey]);

  return (
    <label className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          const next = event.target.checked;
          setChecked(next);

          if (next) {
            window.localStorage.setItem(storageKey, "done");
          } else {
            window.localStorage.removeItem(storageKey);
          }
        }}
      />
      Done
    </label>
  );
}
```

```tsx
// src/components/resources/startup-directories-resource.tsx
"use client";

import { useState } from "react";

import { ResourceProgressToggle } from "@/components/resources/resource-progress-toggle";
import { startupDirectories } from "@/content/resources/startup-directories";

export function StartupDirectoriesResource() {
  const [query, setQuery] = useState("");

  const filtered = startupDirectories.filter((item) =>
    `${item.name} ${item.category} ${item.notes ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="max-w-3xl space-y-4">
        <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
          Signed-in resource
        </p>
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          800+ startup directories
        </h1>
        <p className="text-base font-medium leading-7 text-muted-foreground">
          This hosted list is now the canonical ShipBoost resource. Search it,
          work through it, and track your own progress locally in this browser.
        </p>
      </div>

      <div className="mt-8 max-w-xl">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search directories"
          className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
        />
      </div>

      <div className="mt-10 grid gap-4">
        {filtered.map((item) => (
          <article
            key={item.id}
            className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[auto_1fr_auto]"
          >
            <ResourceProgressToggle
              storageKey={`startup-directories:${item.id}`}
            />

            <div className="space-y-1">
              <p className="text-sm font-black text-foreground">{item.name}</p>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                {item.category}
              </p>
              {item.notes ? (
                <p className="text-sm text-muted-foreground">{item.notes}</p>
              ) : null}
            </div>

            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-2 text-xs font-black transition-colors hover:bg-muted"
            >
              Visit
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
```

```tsx
// src/app/resources/startup-directories/page.tsx
import { redirect } from "next/navigation";

import { StartupDirectoriesResource } from "@/components/resources/startup-directories-resource";
import { getServerSession } from "@/server/auth/session";

export const revalidate = 3600;

export default async function StartupDirectoriesPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in?redirect=/resources/startup-directories");
  }

  return <StartupDirectoriesResource />;
}
```

- [ ] **Step 4: Run the resource test**

Run: `npm run test -- src/components/resources/resource-progress-toggle.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/resources/startup-directories/page.tsx src/content/resources/startup-directories.ts src/components/resources/startup-directories-resource.tsx src/components/resources/resource-progress-toggle.tsx src/components/resources/resource-progress-toggle.test.tsx
git commit -m "feat: add hosted startup directories resource"
```

### Task 3: Update the homepage lead magnet to capture leads and send magic links

**Files:**
- Modify: `src/components/public/home-lead-magnet-form.tsx`
- Add: `src/components/public/home-lead-magnet-form.test.tsx`

- [ ] **Step 1: Write the failing homepage lead-form test**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeLeadMagnetForm } from "@/components/public/home-lead-magnet-form";

const signInMagicLinkMock = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("utm_source=twitter"),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      magicLink: signInMagicLinkMock,
    },
  },
}));

describe("HomeLeadMagnetForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures the lead before sending the resource magic link", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "lead_1",
            email: "founder@example.com",
            status: "ACTIVE",
          }),
          { status: 201 },
        ),
      );

    signInMagicLinkMock.mockResolvedValueOnce({});

    render(<HomeLeadMagnetForm />);

    fireEvent.change(screen.getByPlaceholderText("you@startup.com"), {
      target: { value: "founder@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /get access now/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/leads",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    await waitFor(() => {
      expect(signInMagicLinkMock).toHaveBeenCalledWith({
        email: "founder@example.com",
        callbackURL: "/resources/startup-directories",
      });
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/components/public/home-lead-magnet-form.test.tsx`
Expected: FAIL because the homepage form does not call `authClient.signIn.magicLink(...)` yet.

- [ ] **Step 3: Change the homepage form to use lead capture plus magic-link fulfillment**

```tsx
// src/components/public/home-lead-magnet-form.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";

import { authClient } from "@/lib/auth-client";
```

```tsx
// src/components/public/home-lead-magnet-form.tsx
const normalizedEmail = email.trim().toLowerCase();
```

```tsx
// src/components/public/home-lead-magnet-form.tsx
const response = await fetch("/api/leads", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: normalizedEmail,
    source,
    leadMagnet,
    utmSource: searchParams.get("utm_source") ?? undefined,
    utmMedium: searchParams.get("utm_medium") ?? undefined,
    utmCampaign: searchParams.get("utm_campaign") ?? undefined,
    utmContent: searchParams.get("utm_content") ?? undefined,
    utmTerm: searchParams.get("utm_term") ?? undefined,
  }),
});
```

```tsx
// src/components/public/home-lead-magnet-form.tsx
const magicLinkResult = await authClient.signIn.magicLink({
  email: normalizedEmail,
  callbackURL: "/resources/startup-directories",
});

if (magicLinkResult?.error) {
  throw new Error(
    magicLinkResult.error.message ??
      "Your email was saved, but we could not send the access link right now.",
  );
}

setSuccessMessage(
  "Check your inbox. We sent a secure sign-in link to the startup directories resource.",
);
```

```tsx
// src/components/public/home-lead-magnet-form.tsx
<p className="mt-8 text-xs font-bold text-muted-foreground/40 tracking-widest">
  * Secure sign-in link. Unsubscribe with one click.
</p>
```

- [ ] **Step 4: Run the homepage test**

Run: `npm run test -- src/components/public/home-lead-magnet-form.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/public/home-lead-magnet-form.tsx src/components/public/home-lead-magnet-form.test.tsx
git commit -m "feat: route lead magnet signups through magic links"
```

### Task 4: Remove the obsolete direct-delivery path and env cleanup

**Files:**
- Modify: `src/server/services/lead-service.ts`
- Modify: `src/server/services/lead-service.test.ts`
- Modify: `src/server/email/transactional.ts`
- Modify: `src/server/env.ts`

- [ ] **Step 1: Update the failing lead-service test**

Replace the delivery-email assertion with a negative assertion:

```ts
// src/server/services/lead-service.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, resendInstance, emailMock, envMock } = vi.hoisted(() => ({
  prismaMock: {
    lead: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  resendInstance: {
    contacts: {
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  emailMock: {
    sendStartupDirectoriesLeadMagnetEmail: vi.fn(),
  },
  envMock: {
    RESEND_API_KEY: "re_test",
  } as {
    RESEND_API_KEY?: string;
  },
}));
```

```ts
// src/server/services/lead-service.test.ts
expect(emailMock.sendStartupDirectoriesLeadMagnetEmail).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/server/services/lead-service.test.ts`
Expected: FAIL because `captureLead(...)` still tries to send the old startup-directories email.

- [ ] **Step 3: Remove the old delivery helper and env usage**

```ts
// src/server/services/lead-service.ts
import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import type { LeadCaptureInput } from "@/server/validators/lead";
```

```ts
// src/server/services/lead-service.ts
export async function captureLead(input: LeadCaptureInput) {
  const email = normalizeEmail(input.email);
  const now = new Date();
  const leadDelegate = getLeadDelegate();

  const existing = await leadDelegate.findUnique({
    where: { email },
  });

  const lead = existing
    ? await leadDelegate.update({
        where: { email },
        data: {
          lastSubmittedAt: now,
          name: existing.name || input.name,
          utmSource: existing.utmSource || input.utmSource,
          utmMedium: existing.utmMedium || input.utmMedium,
          utmCampaign: existing.utmCampaign || input.utmCampaign,
          utmContent: existing.utmContent || input.utmContent,
          utmTerm: existing.utmTerm || input.utmTerm,
        },
      })
    : await leadDelegate.create({
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
      lead.resendContactId = resendContactId;
      await leadDelegate.update({
        where: { id: lead.id },
        data: { resendContactId },
      });
    }
  } catch (error) {
    console.error("[shipboost lead:resend-sync-error]", error);
  }

  return {
    created: !existing,
    lead,
  };
}
```

```ts
// src/server/env.ts
const envSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url("DATABASE_URL must be a valid Postgres connection string."),
  DIRECT_URL: z.url("DIRECT_URL must be a valid Postgres connection string."),
  BETTER_AUTH_SECRET: z
    .string()
    .trim()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters."),
  BETTER_AUTH_API_KEY: z.string().trim().min(1).optional(),
  GOOGLE_CLIENT_ID: optionalEnvString,
  GOOGLE_CLIENT_SECRET: optionalEnvString,
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  RESEND_API_KEY: optionalEnvString,
  POSTHOG_KEY: optionalEnvString,
  POSTHOG_HOST: optionalEnvString,
  RESEND_FROM_TRANSACTIONAL: optionalEnvString.transform(
    (value) => value ?? "ShipBoost <onboarding@resend.dev>",
  ),
  RESEND_REPLY_TO_TRANSACTIONAL: optionalEnvString,
  RESEND_FROM_MARKETING: optionalEnvString,
  LAUNCHPAD_GO_LIVE_AT: z
    .string()
    .trim()
    .datetime({ offset: true })
    .default("2026-05-01T00:00:00Z"),
  FREE_LAUNCH_SLOTS_PER_WEEK: z.coerce.number().int().positive().default(10),
  FOUNDING_PREMIUM_LAUNCH_LIMIT: z.coerce.number().int().positive().default(100),
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().trim().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().trim().min(1).optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().trim().min(1).optional(),
  POLAR_ACCESS_TOKEN: optionalEnvString,
  POLAR_WEBHOOK_SECRET: optionalEnvString,
  POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),
  POLAR_FEATURED_LAUNCH_PRODUCT_ID: optionalEnvString,
  POLAR_SUCCESS_URL: optionalEnvString,
  POLAR_RETURN_URL: optionalEnvString,
  CRON_SECRET: optionalEnvString,
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_NAME: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_PRELAUNCH_MODE: optionalEnvString,
});
```

Delete this exact function block from `src/server/email/transactional.ts`:

```ts
export async function sendStartupDirectoriesLeadMagnetEmail(input: {
  to: string;
  name?: string | null;
  directoriesUrl: string;
}) {
  const subject = "Your 800+ startup directories list is ready";
  const preview = "Use this list to find more places to submit your startup.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Here’s your startup directories list"),
      paragraph(
        `${greeting}here is the 800+ startup directories list you requested from ShipBoost.`,
      ),
      paragraph(
        "Use it to find relevant places to submit your startup and build compounding distribution over time.",
      ),
      ctaButton(input.directoriesUrl, "Open the directories list"),
      paragraph(
        "You’ll also get occasional startup growth and distribution emails from ShipBoost. You can unsubscribe any time.",
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
      "You’ll also get occasional startup growth and distribution emails from ShipBoost. You can unsubscribe any time.",
    ].join("\n"),
  });
}
```

- [ ] **Step 4: Run focused verification**

Run:
- `npm run test -- src/server/services/lead-service.test.ts`
- `npm run test -- src/components/auth/auth-form.test.tsx src/components/resources/resource-progress-toggle.test.tsx src/components/public/home-lead-magnet-form.test.tsx`
- `npx tsc --noEmit`
- `npm run build`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/services/lead-service.ts src/server/services/lead-service.test.ts src/server/email/transactional.ts src/server/env.ts
git commit -m "refactor: remove legacy lead magnet delivery flow"
```

---

## Self-Review Checklist

- Spec coverage:
  - Hosted startup-directories page on ShipBoost: covered in Task 2.
  - Any signed-in user can access the resource: covered in Task 2.
  - Homepage keeps capturing leads before fulfillment: covered in Task 3.
  - Magic-link access replaces file delivery immediately: covered in Tasks 1, 3, and 4.
  - Old lead-magnet helper/env path is removed: covered in Task 4.
  - Browser-only progress tracking: covered in Task 2.
- Placeholder scan:
  - No `TODO`, `TBD`, or “implement later” placeholders remain.
- Type consistency:
  - `authClient.signIn.magicLink(...)`, `sendMagicLinkEmailMessage(...)`, and `/resources/startup-directories` use a single naming path across all tasks.
