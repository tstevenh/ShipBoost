# Auth, Admin, and DB Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce slow mobile auth navigation and admin boot load by removing auth-specific PostHog session work, eliminating duplicate admin API requests, and validating Neon/Prisma connection settings.

**Architecture:** Keep PostHog for anonymous visitor/pageview tracking and outbound click tracking only. Keep admin data behavior the same, but stop the first render from immediately re-fetching endpoints it just loaded. Confirm production database URLs use Neon pooled runtime connections and tolerant connection timeouts.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 6, Better Auth, PostHog, DigitalOcean App Platform, Neon Postgres.

---

## Files

- Modify: `src/components/analytics/posthog-page-tracker.tsx`
- Modify: `src/components/analytics/posthog-page-tracker.test.tsx`
- Modify: `src/lib/posthog-browser.ts`
- Modify: `src/components/auth/auth-form.tsx`
- Modify: `src/lib/auth.ts`
- Modify: `src/components/admin/admin-console.tsx`
- Verify only: `prisma/schema.prisma`
- Verify only: DigitalOcean App Platform env vars

---

## Task 1: Remove PostHog Auth Tracking and Session Lookup

**Intent:** PostHog should still initialize for visitor/pageview tracking. It should no longer call Better Auth session hooks, identify users, reset users, track sign-in/sign-up completion, or store pending auth intent.

- [ ] **Step 1: Replace the PostHog tracker test with pageview-only expectations**

Replace `src/components/analytics/posthog-page-tracker.test.tsx` with tests that do not mock `@/lib/auth-client` and do not expect `identify`, `reset`, or auth completion events.

Expected test coverage:

```tsx
it("does not initialize when the api key is missing", () => {
  render(<PostHogPageTracker />);
  expect(posthogInitMock).not.toHaveBeenCalled();
});

it("initializes PostHog with anonymous pageview tracking", () => {
  render(<PostHogPageTracker apiKey="phc_test" apiHost="https://us.i.posthog.com" />);
  expect(posthogInitMock).toHaveBeenCalledWith("phc_test", {
    api_host: "https://us.i.posthog.com",
    defaults: "2026-01-30",
    autocapture: false,
    capture_pageview: "history_change",
    capture_pageleave: false,
  });
});

it("initializes only once even if rendered again", () => {
  const { rerender } = render(<PostHogPageTracker apiKey="phc_test" />);
  rerender(<PostHogPageTracker apiKey="phc_test" />);
  expect(posthogInitMock).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails before implementation**

Run:

```bash
npx vitest run src/components/analytics/posthog-page-tracker.test.tsx
```

Expected before code change: failure because the component still imports and calls auth/session behavior.

- [ ] **Step 3: Simplify `PostHogPageTracker`**

Edit `src/components/analytics/posthog-page-tracker.tsx` so it only imports `useEffect` and `posthog-js`, initializes once, and returns `null`.

Required behavior:

```tsx
"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

let hasInitializedPostHog = false;

export function resetPostHogPageTrackerForTest() {
  hasInitializedPostHog = false;
}

export function PostHogPageTracker({
  apiKey,
  apiHost,
}: {
  apiKey?: string;
  apiHost?: string;
}) {
  useEffect(() => {
    if (!apiKey || hasInitializedPostHog) {
      return;
    }

    posthog.init(apiKey, {
      api_host: apiHost ?? "https://us.i.posthog.com",
      defaults: "2026-01-30",
      autocapture: false,
      capture_pageview: "history_change",
      capture_pageleave: false,
    });

    hasInitializedPostHog = true;
  }, [apiHost, apiKey]);

  return null;
}
```

- [ ] **Step 4: Remove pending auth intent storage helpers**

Edit `src/lib/posthog-browser.ts` to remove these auth-only exports and supporting types/constants:

```ts
setPendingAuthIntent
clearPendingAuthIntent
getPendingAuthIntent
```

Keep:

```ts
captureBrowserPostHogEvent
captureBrowserOutboundLinkClicked
```

- [ ] **Step 5: Remove auth intent calls from `AuthForm`**

Edit `src/components/auth/auth-form.tsx`:

- Remove import of `clearPendingAuthIntent` and `setPendingAuthIntent`.
- Remove every call to `setPendingAuthIntent(...)`.
- Remove every call to `clearPendingAuthIntent()`.
- Keep the Better Auth sign-in, sign-up, Google sign-in, magic link, redirects, and error handling unchanged.

- [ ] **Step 6: Remove server-side auth PostHog capture**

Edit `src/lib/auth.ts`:

- Remove import of `capturePostHogEventSafely`.
- Remove import of `getEmailDomain`.
- Remove the `afterEmailVerification` PostHog `sign_up_completed` capture block.
- Keep the welcome email in `afterEmailVerification`.

Target shape:

```ts
afterEmailVerification: async (user) => {
  await sendWelcomeEmailMessage({
    to: user.email,
    name: user.name,
    dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
},
```

- [ ] **Step 7: Verify Task 1**

Run:

```bash
npx vitest run src/components/analytics/posthog-page-tracker.test.tsx src/components/auth/auth-form.test.tsx
npx eslint src/components/analytics/posthog-page-tracker.tsx src/components/analytics/posthog-page-tracker.test.tsx src/components/auth/auth-form.tsx src/lib/posthog-browser.ts src/lib/auth.ts
rg -n "setPendingAuthIntent|clearPendingAuthIntent|getPendingAuthIntent|sign_in_completed|sign_up_completed|authClient.useSession" src/components/analytics src/components/auth src/lib/posthog-browser.ts src/lib/auth.ts
```

Expected:

- Vitest passes.
- ESLint passes.
- `rg` finds no auth intent helpers or auth completion events in the edited files.
- `authClient.useSession` no longer appears in `src/components/analytics/posthog-page-tracker.tsx`.

---

## Task 2: Remove Duplicate Admin Boot Fetches

**Intent:** Admin currently fetches tools, submissions, and claims during boot, then immediately re-fetches the same three endpoints from search/filter effects. Keep current UI behavior but skip those first redundant effect runs.

- [ ] **Step 1: Add a focused admin console test**

Add or update tests for `src/components/admin/admin-console.tsx` if a test file already exists. If there is no existing file, create `src/components/admin/admin-console.test.tsx`.

Mock `apiRequest` and assert initial mount requests each admin endpoint once:

```ts
expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/categories");
expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/tags");
expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/tools");
expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/submissions?reviewStatus=PENDING");
expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/listing-claims?status=PENDING");
expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/launches");
expect(apiRequestMock).toHaveBeenCalledTimes(6);
```

- [ ] **Step 2: Run the focused test and confirm it fails before implementation**

Run:

```bash
npx vitest run src/components/admin/admin-console.test.tsx
```

Expected before code change: failure because current mount triggers 9 requests.

- [ ] **Step 3: Gate search/filter effects until boot finishes**

Edit `src/components/admin/admin-console.tsx`:

Add state near `bootError`:

```ts
const [hasBooted, setHasBooted] = useState(false);
```

Inside the boot `useEffect`, after setting categories/tags/tools/submissions/claims/launchWeeks:

```ts
setHasBooted(true);
```

In the `catch`, also set boot state so later user actions can still trigger refreshes after a displayed error is handled:

```ts
setHasBooted(true);
```

Update the three search/filter effects:

```ts
useEffect(() => {
  if (!hasBooted) {
    return;
  }

  void syncToolsSearch(deferredToolSearch);
}, [deferredToolSearch, hasBooted]);

useEffect(() => {
  if (!hasBooted) {
    return;
  }

  void syncSubmissionsSearch(deferredSubmissionSearch, submissionFilter);
}, [deferredSubmissionSearch, hasBooted, submissionFilter]);

useEffect(() => {
  if (!hasBooted) {
    return;
  }

  void syncClaimsSearch(deferredClaimSearch, claimFilter);
}, [claimFilter, deferredClaimSearch, hasBooted]);
```

- [ ] **Step 4: Verify Task 2**

Run:

```bash
npx vitest run src/components/admin/admin-console.test.tsx
npx eslint src/components/admin/admin-console.tsx src/components/admin/admin-console.test.tsx
```

Expected:

- Initial admin mount makes 6 boot API calls, not 9.
- Changing search/filter after boot still calls the relevant endpoint.
- ESLint passes.

---

## Task 3: Validate Neon/Prisma Runtime Connection Settings

**Intent:** Confirm production uses Neon pooled runtime connections with a direct URL for migrations and a connection timeout that tolerates cold wake-up.

- [ ] **Step 1: Confirm Prisma schema is already configured correctly**

Check `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Expected: this is already present.

- [ ] **Step 2: Inspect DO env var names without printing secrets**

Run with the DO token exported in the shell:

```bash
export DO_API_TOKEN="..."
curl -sS "https://api.digitalocean.com/v2/apps/19f8b453-0cdb-4994-9826-5f5950ed6673" \
  -H "Authorization: Bearer ${DO_API_TOKEN}" \
  | jq '.app.spec.services[] | select(.name=="shipboost") | {name, envs: [.envs[]? | {key, scope, type, has_value: (.value != null)}]}'
```

Expected:

- `DATABASE_URL` exists.
- `DIRECT_URL` exists.
- Do not paste the secret values into chat or commit logs.

- [ ] **Step 3: Confirm values in DigitalOcean dashboard**

Open DigitalOcean App Platform env settings and verify:

```env
DATABASE_URL=postgresql://...-pooler...neon.tech/...?...sslmode=require&connect_timeout=15
DIRECT_URL=postgresql://...neon.tech/...?...sslmode=require&connect_timeout=15
```

Expected:

- `DATABASE_URL` hostname contains `-pooler`.
- `DIRECT_URL` hostname does not contain `-pooler`.
- Both URLs include `sslmode=require`.
- Both URLs include `connect_timeout=15`.

- [ ] **Step 4: Apply env updates if needed**

If `connect_timeout=15` is missing, append it using `&connect_timeout=15` if the URL already has query params, or `?connect_timeout=15` if it does not.

If `DATABASE_URL` is not using the Neon pooler hostname, replace it with the pooled Neon connection string.

If `DIRECT_URL` is using the pooler hostname, replace it with the direct Neon connection string.

- [ ] **Step 5: Redeploy after env changes**

Trigger a DigitalOcean redeploy after changing env vars.

Expected:

- App reaches `ACTIVE`.
- Runtime logs no longer show repeated Prisma closed connection errors during normal traffic.

- [ ] **Step 6: Verify production timing after deployment**

Run:

```bash
curl -sS -o /dev/null -H 'Accept-Encoding: br,gzip' \
  -w 'signin status=%{http_code} ttfb=%{time_starttransfer} total=%{time_total} size=%{size_download}\n' \
  https://shipboost.io/sign-in

curl -sS -o /dev/null -H 'Accept-Encoding: br,gzip' \
  -w 'signup status=%{http_code} ttfb=%{time_starttransfer} total=%{time_total} size=%{size_download}\n' \
  https://shipboost.io/sign-up
```

Expected:

- No request errors.
- TTFB is lower or more consistent than the previous observed range of roughly `0.39s` to `0.98s`.
- If the first request after idle is still slow, note it as Neon cold wake-up behavior and decide separately whether to disable scale-to-zero or upgrade Neon.

---

## Final Verification

- [ ] Run focused tests:

```bash
npx vitest run src/components/analytics/posthog-page-tracker.test.tsx src/components/auth/auth-form.test.tsx src/components/admin/admin-console.test.tsx
```

- [ ] Run lint on touched files:

```bash
npx eslint src/components/analytics/posthog-page-tracker.tsx src/components/analytics/posthog-page-tracker.test.tsx src/lib/posthog-browser.ts src/components/auth/auth-form.tsx src/lib/auth.ts src/components/admin/admin-console.tsx src/components/admin/admin-console.test.tsx
```

- [ ] Run typecheck:

```bash
npx tsc --noEmit
```

- [ ] Production smoke test:

```bash
curl -sS -o /dev/null -H 'Accept-Encoding: br,gzip' \
  -w 'signin status=%{http_code} ttfb=%{time_starttransfer} total=%{time_total}\n' \
  https://shipboost.io/sign-in
```

---

## Expected Outcome

- Sign-in and sign-up pages no longer perform PostHog auth session tracking on the client.
- PostHog still records anonymous visitor pageviews and outbound click events.
- Admin first load removes three redundant API requests.
- Neon runtime connection settings are verified for pooled app traffic and tolerant cold wake-up.
