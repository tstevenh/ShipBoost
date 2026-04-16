# Outbound Click UTM And PostHog Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ShipBoost outbound clicks affiliate-first, append ShipBoost UTMs, add browser PostHog pageviews, and replace the empty default PostHog dashboard with insights that match the app.

**Architecture:** Keep `/api/outbound/tool/[toolId]` as the canonical redirect path, enrich the redirect service with UTM + analytics metadata, and add a small browser PostHog client mounted from the root layout. Then replace the sample PostHog dashboard tiles with outbound-click and top-level traffic insights.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, PostHog MCP, server-side redirect tracking

---

### Task 1: Upgrade outbound redirect behavior

**Files:**
- Modify: `src/server/services/outbound-click-service.ts`
- Modify: `src/server/services/outbound-click-service.test.ts`
- Modify: `src/lib/tool-outbound.ts`

- [ ] Add URL enrichment helpers and stronger redirect metadata to `src/server/services/outbound-click-service.ts`.
- [ ] Make `target=website` explicitly affiliate-first and capture both original and final destination URLs plus `used_affiliate_url`.
- [ ] Add test coverage for affiliate-first website clicks, website fallback, and UTM appending behavior.

### Task 2: Ensure tracked links are used consistently

**Files:**
- Modify: `src/components/public/tool-page-content.tsx`
- Modify: `src/components/public/launch-board.tsx`
- Modify: `src/components/public/public-tool-card.tsx`
- Modify: `src/components/founder/founder-dashboard.tsx`

- [ ] Audit existing tool outbound CTAs and switch any remaining persisted tool links to the tracked redirect helper.
- [ ] Add any missing `ToolOutboundSource` values required by those surfaces.

### Task 3: Add browser PostHog pageview tracking

**Files:**
- Create: `src/components/analytics/posthog-page-tracker.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/server/env.ts`
- Modify: `package.json`

- [ ] Add browser-side PostHog initialization and pageview capture.
- [ ] Gate initialization on public env vars so the app no-ops safely when PostHog browser config is missing.
- [ ] Mount the tracker from the root layout without disturbing existing Google Analytics.

### Task 4: Replace the empty PostHog dashboard

**Files:**
- Modify via PostHog MCP: dashboard `1439308`
- Create or update via PostHog MCP: outbound-click and traffic insights

- [ ] Replace the sample `$pageview` dashboard tiles with ShipBoost-specific insights.
- [ ] Add insights for outbound clicks over time, by tool, by source surface, by affiliate usage, top destination domains, pageviews over time, landing pages, and referring domains.

### Task 5: Verify end to end

**Files:**
- No code changes required unless verification finds an issue

- [ ] Run focused Vitest coverage for outbound click behavior.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Verify PostHog MCP can see the updated dashboard/insight configuration.
