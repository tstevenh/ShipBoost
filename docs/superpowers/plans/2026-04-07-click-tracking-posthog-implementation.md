# Click Tracking With PostHog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or equivalent task-by-task execution. Steps use checkbox syntax for tracking.

**Goal:** Track all public outbound tool clicks through a server redirect endpoint, validate destinations against saved tool URLs, and send `tool_outbound_click` events to PostHog without introducing a local click-events table.

**Architecture:** Add a server-side PostHog helper, create a tracked outbound redirect route, reuse the public-tool visibility rule for eligibility, and update all public outbound links to route through the tracking endpoint.

**Tech Stack:** Next.js App Router, TypeScript, Better Auth session flow, PostHog, Vitest, Zod

---

## File Structure

### New files
- `src/server/posthog.ts`
  - server-side PostHog client singleton and capture helpers
- `src/server/services/outbound-click-service.ts`
  - resolve tool destination, validate target, capture click, return redirect URL
- `src/server/services/outbound-click-service.test.ts`
  - service tests for redirect and analytics behavior
- `src/server/validators/outbound-click.ts`
  - route param/query validation
- `src/app/api/outbound/tool/[toolId]/route.ts`
  - tracked redirect endpoint

### Modified files
- `src/server/env.ts`
  - add PostHog server env vars
- `src/components/public/launch-board.tsx`
  - replace direct external website links with tracked redirect URLs
- `src/app/tools/[slug]/page.tsx`
  - replace direct website and affiliate links with tracked redirect URLs
- `src/components/public/public-tool-card.tsx`
  - replace direct affiliate links with tracked redirect URLs
- `src/components/public/home-search-modal.tsx`
  - likely unchanged unless outbound links are added later
- `src/server/services/tool-service.ts`
  - if needed, expose tool ids/destination fields cleanly for public link building

---

## Task 1: Add server-side PostHog helper

**Files:**
- Create: `src/server/posthog.ts`
- Modify: `src/server/env.ts`

- [ ] Add env vars for PostHog server capture:
  - `POSTHOG_KEY`
  - `POSTHOG_HOST`
- [ ] Create a singleton PostHog client
- [ ] Add a focused helper like:
  - `captureToolOutboundClick({ distinctId, properties })`
- [ ] Make capture best-effort so endpoint redirects even if analytics fails
- [ ] Add no-op/fallback behavior if env vars are missing in development

---

## Task 2: Implement outbound click service

**Files:**
- Create: `src/server/services/outbound-click-service.ts`
- Create: `src/server/services/outbound-click-service.test.ts`
- Create: `src/server/validators/outbound-click.ts`

- [ ] Write failing tests for:
  - valid website redirect
  - valid affiliate redirect
  - missing affiliate URL rejects
  - hidden/future tool rejects
  - capture failure still returns redirect
- [ ] Implement service helpers:
  - validate tool is public
  - resolve destination from `target`
  - build PostHog event payload
  - derive distinct id from signed-in session or anonymous fallback
- [ ] Use strict validation:
  - `website` => `tool.websiteUrl`
  - `affiliate` => `tool.affiliateUrl`
- [ ] Run the service tests

---

## Task 3: Add tracked redirect route

**Files:**
- Create: `src/app/api/outbound/tool/[toolId]/route.ts`

- [ ] Add route that parses:
  - `toolId` from params
  - `target` from search params
  - `source` from search params
- [ ] Load session if present
- [ ] Call outbound-click service
- [ ] Redirect with `NextResponse.redirect(...)`
- [ ] Return `400/404` for invalid targets or non-public tools

---

## Task 4: Migrate public outbound links

**Files:**
- Modify: `src/components/public/launch-board.tsx`
- Modify: `src/app/tools/[slug]/page.tsx`
- Modify: `src/components/public/public-tool-card.tsx`

- [ ] Replace launch board `Visit site` links with tracked redirect URLs
- [ ] Replace tool page `Visit website` link with tracked redirect URL
- [ ] Replace tool page affiliate link with tracked redirect URL
- [ ] Replace public tool card affiliate link with tracked redirect URL
- [ ] Keep internal links untouched

---

## Task 5: Verification

- [ ] Run targeted tests:
  - `npm test -- src/server/services/outbound-click-service.test.ts`
- [ ] Run broader checks:
  - `npm run lint`
  - `npx tsc --noEmit`
- [ ] Manual verification:
  - click website link from tool page and land on destination
  - click affiliate link and land on destination
  - click launch board outbound link and land on destination
  - confirm `tool_outbound_click` appears in PostHog with expected properties

---

## Risks and watchpoints

- Do not allow arbitrary outbound URLs, or the route becomes an open redirect.
- Capture failure must not block redirect, or users will experience broken outbound links.
- Keep analytics properties consistent across surfaces so downstream analysis stays usable.
- Be careful with anonymous identity strategy; avoid making the first version more complex than necessary.
