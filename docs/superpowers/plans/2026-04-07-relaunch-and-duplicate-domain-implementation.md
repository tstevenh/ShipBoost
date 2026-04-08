# Relaunch And Duplicate-Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or equivalent task-by-task execution. Steps use checkbox syntax for tracking.

**Goal:** Prevent duplicate tool creation by normalized root domain, return founder-appropriate CTA metadata when a duplicate is detected, and make relaunch fully correct across submission, review, and launch history flows.

**Architecture:** Add a shared root-domain helper and duplicate-domain guard around submission creation, keep one canonical `Tool` per root domain, and fix relaunch handling so it consistently produces `LaunchType.RELAUNCH` on the existing tool instead of accidentally behaving like a free launch.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, Better Auth, Vitest, Zod

---

## File Structure

### New files
- `src/server/services/tool-domain.ts`
  - normalized root-domain extraction and comparison helpers for tools
- `src/server/services/tool-domain.test.ts`
  - tests for root-domain normalization

### Modified files
- `src/server/services/submission-draft-service.ts`
  - duplicate-domain guard before creating a new tool
- `src/server/services/submission-review-service.ts`
  - correct launch type creation for relaunch
- `src/server/validators/submission.ts`
  - extend duplicate error shape only if needed at validator boundary
- `src/server/repositories/tool-repository.ts`
  - add duplicate-domain lookup helper if useful
- `src/components/founder/submit-product-form.tsx`
  - later, consume duplicate-domain error payload cleanly
- `src/server/services/submission-draft-service.test.ts`
  - add duplicate-domain tests if this file already exists or create focused tests
- `src/server/services/submission-review-service.test.ts`
  - add relaunch-specific approval tests if this file already exists or create focused tests

---

## Task 1: Add shared tool-domain normalization helper

**Files:**
- Create: `src/server/services/tool-domain.ts`
- Create: `src/server/services/tool-domain.test.ts`

- [ ] Write failing tests for:
  - `acme.com`
  - `www.acme.com`
  - `app.acme.com`
  - invalid URL handling
- [ ] Implement helper(s):
  - `getToolRootDomain(websiteUrl)`
  - `toolDomainsMatch(leftUrl, rightUrl)` if useful
- [ ] Reuse the same normalization philosophy as the claim-domain logic, but keep this helper tool-centric
- [ ] Run the domain tests

---

## Task 2: Enforce duplicate domains on new submissions

**Files:**
- Modify: `src/server/services/submission-draft-service.ts`
- Modify/Create: submission-draft service tests

- [ ] Add a duplicate-domain lookup before creating a new tool for a submission
- [ ] Compare requested website root domain against all existing tools
- [ ] Exclude the current tool when editing an existing submission
- [ ] On duplicate conflict, throw a structured `AppError(409, ...)` with:
  - duplicate tool id
  - slug
  - name
  - `ownedByYou`
  - `ctaHref`
  - `ctaLabel`
- [ ] Same-founder duplicate should point to `/dashboard/tools/[toolId]`
- [ ] Different-founder duplicate should still block creation with duplicate metadata
- [ ] Add tests for:
  - same-founder duplicate
  - different-founder duplicate
  - same submission/tool edit not blocked

---

## Task 3: Fix relaunch launch creation

**Files:**
- Modify: `src/server/services/submission-review-service.ts`
- Modify/Create: review service tests

- [ ] Replace the current free/featured-only launch creation branch with explicit launch-type resolution:
  - `FEATURED_LAUNCH` -> `FEATURED`
  - `RELAUNCH` -> `RELAUNCH`
  - `FREE_LAUNCH` -> `FREE`
- [ ] Verify status and priority logic still make sense for relaunches
- [ ] Ensure relaunch creates a launch row on the existing tool, not a duplicate tool
- [ ] Add tests proving:
  - relaunch approval creates `LaunchType.RELAUNCH`
  - existing tool launch history is appended

---

## Task 4: Audit relaunch consistency across downstream flows

**Files:**
- Modify if needed:
  - `src/server/services/submission-service-shared.ts`
  - `src/server/services/launch-service.ts`
  - `src/server/services/public-tool-visibility.ts`

- [ ] Verify `resolveLaunchType(...)` remains the shared source of truth
- [ ] Verify `publishDueLaunches(...)` preserves relaunch semantics
- [ ] Verify no downstream code assumes all non-featured launches are free launches
- [ ] Patch any incorrect assumptions found during implementation

---

## Task 5: Verification

- [ ] Run targeted tests:
  - `npm test -- src/server/services/tool-domain.test.ts`
  - duplicate-domain service/submission tests
  - relaunch review tests
- [ ] Run broader checks:
  - `npm run lint`
  - `npx tsc --noEmit`
- [ ] Manual verification:
  - submitting the same root domain twice returns duplicate metadata
  - same-founder duplicate includes dashboard CTA
  - relaunch submission ends up as `LaunchType.RELAUNCH`

---

## Risks and watchpoints

- The duplicate check must not break editing an existing draft tied to the same tool.
- Root-domain normalization is intentionally simple; be careful around edge cases like multi-part public suffixes if they matter later.
- Relaunch correctness must be verified in both `currentLaunchType` and the actual `Launch` record, not just one of them.
- Service-level duplicate checks can still race under concurrency unless backed by a DB constraint later.
