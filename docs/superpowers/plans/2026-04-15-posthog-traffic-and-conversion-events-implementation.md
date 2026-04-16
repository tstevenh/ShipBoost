# PostHog Traffic And Conversion Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated PostHog identity stitching and a minimal set of high-signal conversion events for ShipBoost traffic and founder funnels.

**Architecture:** Extend the existing browser PostHog setup with an auth-aware tracker for `identify`, `reset`, and real login detection, then emit milestone conversions from the most trustworthy browser or server success path for each event.

**Tech Stack:** Next.js App Router, better-auth, posthog-js, server-side PostHog capture helper, Vitest

---

### Task 1: Add browser auth tracking and real-login detection

**Files:**
- Modify: `src/components/analytics/posthog-page-tracker.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/auth/auth-form.tsx`
- Add/Modify tests around analytics/auth browser behavior

- [ ] Add browser-side `posthog.identify(...)` when a real authenticated session exists.
- [ ] Add `posthog.reset()` on sign-out.
- [ ] Emit `sign_in_completed` only on a real auth-session transition, not on magic-link email request.

### Task 2: Add browser conversion events

**Files:**
- Modify: `src/lib/startup-directories-access.ts`
- Modify: `src/components/founder/founder-dashboard.tsx`
- Add/modify focused tests

- [ ] Emit `lead_magnet_submitted` after `/api/leads` succeeds.
- [ ] Emit `premium_launch_checkout_started` only after a valid checkout URL is returned.

### Task 3: Add server-confirmed conversion events

**Files:**
- Modify: `src/server/posthog.ts`
- Modify: `src/lib/auth.ts`
- Modify: `src/server/services/submission-draft-service.ts`
- Modify: `src/server/services/submission-payment-service.ts`
- Add/modify focused tests

- [ ] Emit `sign_up_completed` from the post-verification success path.
- [ ] Emit `tool_submission_completed` after successful submission acceptance.
- [ ] Emit `premium_launch_paid` from the confirmed payment-success path.

### Task 4: Verify end to end

**Files:**
- No code changes required unless verification finds an issue

- [ ] Run focused analytics/auth/payment tests.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
