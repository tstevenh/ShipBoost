# Launchpad Go-Live Date Shift Design

**Date:** 2026-04-17  
**Status:** Approved for spec review  
**Owner:** Codex

## Goal

Move the Launchpad opening from **Friday, May 1, 2026 UTC** to **Monday, May 4, 2026 UTC** so the weekly launch cadence runs Monday-to-Monday instead of Friday-to-Friday.

This change must:

- shift the global launchpad go-live anchor to May 4, 2026 UTC
- automatically move the one existing free launch already scheduled for May 1, 2026 UTC to May 4, 2026 UTC
- update visible UI copy that still mentions May 1, 2026 UTC
- update tests and validation expectations that currently assert May 1 behavior

This change should **not** add new abstraction or helper utilities just to avoid touching a small number of strings.

## Why This Approach

The launch-week logic is already anchored to a single config value: `LAUNCHPAD_GO_LIVE_AT`. Changing that value cleanly redefines the weekly windows for both free and premium launches.

Because the user expects this to be a one-time date correction, introducing a new shared display helper for launch-date copy would add indirection without enough long-term benefit. The simpler solution is:

- update the anchor
- patch the affected UI strings directly
- move the one existing launch row
- update tests

## Current System Behavior

The current system uses `LAUNCHPAD_GO_LIVE_AT` as the floor and weekly anchor for:

- free launch auto-scheduling
- premium launch week validation
- premium launch week selection
- prelaunch messaging that describes when ShipBoost opens

The current default value is `2026-05-01T00:00:00Z`, which makes the launch week anchor Friday, May 1, 2026 UTC.

As a result:

- the first free launch week starts on Friday, May 1, 2026 UTC
- premium launch week selection and validation also start from that Friday anchor
- multiple public/founder-facing surfaces explicitly mention May 1, 2026 UTC in copy

## Proposed Changes

### 1. Shift the Scheduling Anchor

Change the code-level default/fallback `LAUNCHPAD_GO_LIVE_AT` from:

- `2026-05-01T00:00:00Z`

to:

- `2026-05-04T00:00:00Z`

This will automatically make launch weeks run Monday-to-Monday because the existing scheduling logic derives week boundaries from the configured go-live date.

No scheduling algorithm rewrite is needed.

This is important because the current environment does **not** define `LAUNCHPAD_GO_LIVE_AT`, so the application is using the fallback from code. The implementation must therefore change the fallback directly in code rather than relying on an environment update.

### 2. Move Existing Launch Data

Perform a one-time data update for the existing free launch currently scheduled at:

- `2026-05-01T00:00:00Z`

Update that launch record to:

- `2026-05-04T00:00:00Z`

This ensures the already-created launch stays aligned with the new system anchor and all dashboards/emails/admin views render the corrected date.

Because the user has stated there is only one such record right now, this can be implemented as a narrowly scoped update instead of a broad migration framework.

### 3. Update Validation and Selection Messaging

Any validation messages or selection guidance that currently say:

- `May 1, 2026 UTC`

must be updated to:

- `May 4, 2026 UTC`

This includes:

- founder submit flow prelaunch messaging
- premium launch week chooser helper text
- pricing and prelaunch marketing surfaces
- founder dashboard prelaunch messaging
- any premium payment validation errors that mention the floor date

### 4. Keep the Codebase Simple

Do not add a new helper just to centralize this date string unless implementation reveals substantially more copy duplication than expected.

For this change, direct string updates are acceptable and preferred.

## Components and Files Affected

### Configuration / backend behavior

- `src/server/env.ts`
- `src/server/services/launch-scheduling.ts`
- `src/server/services/submission-payment-service.ts`
- tests that assert the current launch floor or first available launch week

### Founder / public UI copy

Likely affected surfaces include:

- `src/components/founder/submit-product-form.tsx`
- `src/components/public/prelaunch-surface.tsx`
- `src/app/pricing/page.tsx`
- `src/app/submit/page.tsx`
- `src/app/dashboard/page.tsx`

Additional files may be updated if they contain visible May 1 references discovered during implementation.

### Existing launch data

- one launch row in the database currently scheduled for `2026-05-01T00:00:00Z`

## Data Flow

### Scheduling after the change

1. System reads `LAUNCHPAD_GO_LIVE_AT`
2. Launch scheduling logic normalizes it to start-of-day UTC
3. Free launches schedule into weekly cohorts starting Monday, May 4, 2026 UTC
4. Premium launch selection and validation accept week starts anchored from Monday, May 4, 2026 UTC

### Existing launch update

1. Identify launch records scheduled exactly at `2026-05-01T00:00:00Z`
2. Narrow to the intended free launch record(s)
3. Update `launchDate` and aligned timing fields to `2026-05-04T00:00:00Z`
4. Existing admin/founder views show the corrected date automatically

## Error Handling and Safety

- If no launch record exists for `2026-05-01T00:00:00Z`, the one-time update should fail safely or no-op clearly rather than silently updating unrelated rows.
- The data update should be tightly scoped to avoid touching premium launches or any unrelated historical records.
- Validation messages must stay consistent with the actual configured floor date so founders are not told the wrong starting week.
- The change should not alter launch statuses or publication behavior; only the anchor date, related copy, and the one affected launch date should change.

## Testing

Update and verify:

- scheduling tests that expect the first free launch week to be May 1
- premium validation tests that expect `Choose May 1, 2026 UTC or later.`
- any UI tests that assert prelaunch text mentioning May 1

Add or adjust coverage to confirm:

- the launchpad go-live floor is now May 4, 2026 UTC
- weekly launch windows anchor from Monday, May 4, 2026 UTC
- the moved free launch renders as May 4, 2026 in affected views

## Out of Scope

- introducing a new date-display helper
- changing the weekly scheduling algorithm beyond the anchor shift
- redesigning launch messaging beyond replacing May 1 references
- adding bulk migration tooling for hypothetical future date shifts

## Acceptance Criteria

- `LAUNCHPAD_GO_LIVE_AT` defaults to `2026-05-04T00:00:00Z`
- the application behaves correctly even when `LAUNCHPAD_GO_LIVE_AT` is absent from the environment, because the code fallback is now May 4
- free launch scheduling starts at Monday, May 4, 2026 UTC
- premium launch validation and week selection are anchored to Monday, May 4, 2026 UTC
- the existing manually scheduled free launch is moved from May 1 to May 4
- visible UI copy no longer tells founders that ShipBoost opens on May 1, 2026 UTC
- tests reflect the new Monday anchor and pass
