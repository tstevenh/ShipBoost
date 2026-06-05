# Free-Launch Requirements UX — Design

**Date:** 2026-06-05
**Status:** Approved (brainstorming) — pending spec review
**Branch:** `feat/distributor-toolkit` (stacked on Plan A + Plan B)

## Problem

Free launches now require (Plan B) a **verified ShipBoost badge** and **3 upvotes on this week's board**. Today those requirements are scattered: a badge-verify card floats in the submit-form sidebar, upvoting happens on a separate board page, and the only feedback that you're not done is a **400 error** when you click "Schedule free launch." Founders find this confusing and dead-ends are a bounce risk.

## Goal

Consolidate everything a free launch needs into **one place — the launch-plans page (`LaunchSection`, `/submit?...&section=launch`)** — as a visible, interactive checklist with live progress, so the founder completes both steps in-flow and the **Schedule** button only enables when they're truly ready.

## Scope

In scope: the launch-plans page requirements UX, an in-modal upvote flow, a guarded vote action that bypasses the daily cap, a dynamic required-vote count, and removal of the now-redundant sidebar badge card. Out of scope: the badge artwork/embed (Plan A), the link-policy and marketing copy (Plan B, done), premium flow (unchanged).

## Decisions (locked)

1. **Upvote target:** real current-week board products; upvotes are **real board votes** (seed liveness). [A]
2. **Daily-cap collision:** requirement votes **bypass the daily cap**, guard-railed server-side. [A]
3. **Thin board:** required count = **`min(3, available non-own current-board tools)`**; **0 others → vote step waived** (badge-only). [A]
4. **Placement:** full-width **"Before you can schedule" panel** below the two plan cards, shown only when **Free** is selected; the Free card keeps its two summary bullets; the bottom **"Schedule free launch"** button is **disabled with a reason** until both steps pass.
5. **Vote UI:** **modal** (not new tab) so the progress bar updates live.

## Components

### Frontend

**`FreeLaunchRequirementsPanel`** (new) — rendered by `LaunchSection` when `selectedLaunch === "FREE"`, full width, below the plan cards.
- **Step ① Badge:** badge preview + Copy snippet (reuse existing `getFreeLaunchBadgeSnippet`, which carries `data-shipboost-badge="free-launch"`) + **Verify badge now** button (calls existing `/api/submissions/[id]/verify-badge`); shows ✓ Verified when `badgeVerification === "VERIFIED"`.
- **Step ② Upvotes:** progress bar `eligibleCount / requiredCount` + **Upvote now** button → opens the modal. Shows ✓ when `eligibleCount >= requiredCount`. If `requiredCount === 0` (empty board), render as "Waived — no other launches to upvote yet ✓".
- Reflects state from props (no internal fetching of source-of-truth); updates `eligibleCount` from the modal's callback.

**`UpvoteRequirementModal`** (new) — "Support this week's launches."
- Lists the current-week board products **excluding the founder's own tool** (card: logo, name, tagline, ▲ upvote). Already-upvoted ones show as upvoted.
- Each upvote calls `castLaunchRequirementVote`; on success updates the live `X/requiredCount` progress.
- At `eligibleCount >= requiredCount`: success state ("You're all set ✓"); closing returns to the panel with step ② checked.
- Accepts the board list + already-upvoted set as props (fetched once with page data).

**`LaunchSection`** (modify) — render the panel when Free is selected; thread through `badgeVerification`, the board list, `eligibleCount`, `requiredCount`; disable "Schedule free launch" until `badgeVerified && eligibleCount >= requiredCount`, with the unmet reason shown.

**`submit-product-form.tsx`** (modify) — **remove** the sidebar `showBadgeVerifyCard` block (~1573–1631) and the stale free-launch description (~1376); keep `getFreeLaunchBadgeSnippet` and the verify handler (reused by the panel).

### Backend

**Required-count helper** (new, pure) — `computeRequiredBoardUpvotes(availableNonOwnBoardToolCount: number): number` → `Math.min(3, count)`. Used by both the page data and the server gate so UI and server agree.

**`castLaunchRequirementVote(submissionId, toolId, user)`** (new service + `POST` route) — guarded:
- caller owns `submissionId` and it's an editable free-launch draft;
- `toolId` is on the current week's board and is **not** the caller's own tool;
- caller currently has `< requiredCount` eligible votes;
- records a **real** vote (same persistence as a normal upvote, idempotent on `toolId+userId`) **skipping the daily-cap check**;
- returns the updated `eligibleCount`.
Normal board voting (`toggleToolUpvote`) keeps the daily cap untouched.

**Page/modal data** — when serving the launch section for a free draft, provide: current-week board tools excluding own (`listLaunchBoard("weekly")` filtered), the caller's upvoted subset (`listUserUpvotedToolIds`), `eligibleCount`, `requiredCount` (`computeRequiredBoardUpvotes`), and `badgeVerification`.

**Server gate (Plan B) update** — `scheduleFreeSubmissionLaunch` computes `requiredCount = computeRequiredBoardUpvotes(availableNonOwnBoardToolCount)` and passes it to `assertFreeLaunchGate({ badgeVerification, eligibleBoardUpvoteCount, requiredBoardUpvotes })`. `assertFreeLaunchGate` compares against `requiredBoardUpvotes` instead of the hardcoded constant (constant becomes the default `3`). When `requiredBoardUpvotes === 0`, the vote check is satisfied (badge still required). This keeps the gate as defense-in-depth and consistent with the UI.

## Data flow

```
load launch section (free draft)
  → server: board tools (excl own), upvoted subset, eligibleCount, requiredCount, badgeVerification
  → panel renders steps ① ② with progress; Schedule disabled if unmet

Verify badge now  → POST /verify-badge → badgeVerification=VERIFIED → step ① ✓
Upvote now        → modal (board tools) → each ▲ → POST castLaunchRequirementVote
                    → returns eligibleCount → progress updates → step ② ✓ at requiredCount
Schedule free     → enabled when ① ✓ && ② ✓ → POST /schedule-free
                    → server gate re-checks (assertFreeLaunchGate) as defense
```

## Edge cases

- **Already eligible** (`eligibleCount >= requiredCount` on load): step ② pre-checked; modal shows the done state.
- **Badge already verified:** step ① pre-checked.
- **0 other board tools:** `requiredCount === 0` → vote step waived; gate's vote check passes; badge still required.
- **Fewer than 3 others:** `requiredCount = available` (e.g., 2/2).
- **Own tool:** excluded from counting and from the modal list.
- **Unvote in modal:** allowed; `eligibleCount` drops; gate re-checks at schedule time.
- **Daily cap already spent elsewhere:** irrelevant — requirement votes bypass the cap.

## Testing

- **Pure/unit:** `computeRequiredBoardUpvotes` (0/1/2/≥3 → min(3,n)); `assertFreeLaunchGate` with dynamic `requiredBoardUpvotes` incl. `0` (waived) and unmet; `castLaunchRequirementVote` guard rules (reject non-owner, own tool, off-board tool, over-`requiredCount`); the gate wiring computes `requiredCount` from board availability.
- **Component:** `FreeLaunchRequirementsPanel` (Schedule disabled→enabled as ①/② complete; waived state at requiredCount 0); `UpvoteRequirementModal` (progress 0→requiredCount, own tool absent).

## Non-goals / YAGNI

No reminder emails, no "schedule now, vote later," no global daily-cap change, no badge-count badge in the verify step (draft isn't public; static badge is correct there).
