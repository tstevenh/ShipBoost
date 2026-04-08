# Upvotes Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or equivalent task-by-task execution. Steps use checkbox syntax for tracking.

**Goal:** Add signed-in, toggleable upvotes for public tools with a daily active cap of 3 per user, and expose vote count/state to launch-board and public tool queries.

**Architecture:** Introduce a `ToolVote` model keyed by `(toolId, userId)`, implement a focused upvote service for eligibility/cap/toggle logic, add a thin authenticated API route, and thread count/viewer state into launch-board and tool-page data.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, Better Auth, Vitest, Zod

---

## File Structure

### New files
- `prisma/migrations/<timestamp>_add_tool_votes/migration.sql`
  - schema migration for tool votes
- `src/server/services/upvote-service.ts`
  - toggle logic, daily cap enforcement, count helpers
- `src/server/services/upvote-service.test.ts`
  - service tests for create/toggle/cap/eligibility
- `src/server/validators/upvote.ts`
  - route input validation if needed
- `src/app/api/tools/[toolId]/vote/route.ts`
  - authenticated toggle endpoint

### Modified files
- `prisma/schema.prisma`
  - add `ToolVote` model and relations
- `src/server/services/launch-service.ts`
  - include vote counts for board items
- `src/server/services/tool-service.ts`
  - include vote count and viewer state for published tool pages
- `src/app/tools/[slug]/page.tsx`
  - consume the new vote fields later, or at minimum thread data shape through safely
- `src/components/public/launch-board.tsx`
  - future-ready prop expansion for vote count if wired immediately
- `src/server/services/public-tool-visibility.ts`
  - reuse existing helper if needed from vote service

---

## Task 1: Add the vote schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_tool_votes/migration.sql`

- [ ] Add `ToolVote` model with:
  - `id`
  - `toolId`
  - `userId`
  - `createdAt`
  - `updatedAt`
- [ ] Add relations on `Tool` and `User`
- [ ] Add unique constraint on `(toolId, userId)`
- [ ] Add supporting indexes on `toolId` and `userId, createdAt`
- [ ] Create the migration
- [ ] Run `npm run prisma:generate`
- [ ] Run `npx tsc --noEmit`

---

## Task 2: Implement the vote service

**Files:**
- Create: `src/server/services/upvote-service.ts`
- Create: `src/server/services/upvote-service.test.ts`

- [ ] Write failing tests for:
  - create first vote
  - toggle remove existing vote
  - block 4th same-day active vote
  - refund slot after removing same-day vote
  - reject voting on non-public tool
- [ ] Implement service helpers:
  - `getToolUpvoteCount(toolId)`
  - `hasUserUpvotedTool(toolId, userId)`
  - `getDailyVotesRemaining(userId, now?)`
  - `toggleToolUpvote(toolId, userId, now?)`
- [ ] Reuse public visibility checks instead of duplicating publication logic
- [ ] Normalize unique-constraint races into correct returned state
- [ ] Run the vote-service tests

---

## Task 3: Add the authenticated toggle route

**Files:**
- Create: `src/app/api/tools/[toolId]/vote/route.ts`
- Create/Modify: `src/server/validators/upvote.ts`

- [ ] Add a signed-in `POST` route
- [ ] Require auth with the existing session helper
- [ ] Validate route params/input
- [ ] Call `toggleToolUpvote`
- [ ] Return:
  - `hasUpvoted`
  - `upvoteCount`
  - `dailyVotesRemaining`
- [ ] Add route-level tests if current route test patterns exist, otherwise rely on service coverage + manual verification

---

## Task 4: Expose vote data in launch-board and tool queries

**Files:**
- Modify: `src/server/services/launch-service.ts`
- Modify: `src/server/services/tool-service.ts`
- Modify: `src/app/tools/[slug]/page.tsx`

- [ ] Extend launch-board query results with total tool upvote count
- [ ] Extend published tool query with:
  - total upvote count
  - viewer vote state when session exists
- [ ] Keep sorting unchanged for now
- [ ] Ensure no hidden/future tools gain vote affordances through query leakage
- [ ] Update tool-page data plumbing to accept the new fields even if the UI remains minimal for the moment

---

## Task 5: Optional first-pass UI wiring

**Files:**
- Modify: `src/components/public/launch-board.tsx`
- Modify: `src/app/tools/[slug]/page.tsx`

- [ ] Add minimal vote display/button on the public tool page
- [ ] Add minimal vote count display on launch-board cards
- [ ] If UI wiring is intentionally deferred, still keep props/data shape ready and document the gap in the final handoff

---

## Task 6: Verification

- [ ] Run targeted tests:
  - `npm test -- src/server/services/upvote-service.test.ts`
- [ ] Run broader relevant tests:
  - `npm test -- src/server/services/upvote-service.test.ts src/server/services/tool-search.test.ts src/server/services/seo-service.test.ts`
- [ ] Run `npm run lint`
- [ ] Run `npx tsc --noEmit`
- [ ] Manually verify:
  - signed-out vote request returns `401`
  - signed-in user can vote on a public tool
  - 4th same-day active vote is blocked
  - removing a same-day vote frees one slot

---

## Risks and watchpoints

- Counting “active votes created today” must align exactly with the refund rule. Do not model the cap as total vote actions.
- Avoid coupling votes to `Launch`; the count must persist beyond the launch window.
- If tool-page queries are viewer-aware, be careful not to make metadata generation depend on authenticated state.
- Keep ranking logic unchanged in this slice to reduce regression risk.
