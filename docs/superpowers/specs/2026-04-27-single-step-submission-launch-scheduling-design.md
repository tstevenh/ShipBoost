# Single-Step Submission and Launch Scheduling Design

## Goal

Simplify ShipBoost submission from a two-step product form plus launch-path choice into one editor page. Founders should fill product details, save or preview the listing, and schedule a launch from the left sidebar without leaving the editor.

## Product Rules

- Free launches are capped at 10 free launches per week.
- Premium launches are uncapped and bypass the free queue.
- A product is not public before its launch date.
- Before launch date, scheduled products must not appear on the homepage, categories, tags, best pages, alternatives pages, public launchpad, or `/tools/[slug]`.
- Admin review remains internal. Admin can reject or hide a scheduled launch before launch date.
- Scheduling is explicit. Saving a draft never enters the launch queue.
- Free launch scheduling happens only after the founder clicks `Schedule your launch` and then `Join the waiting line`.

## Shared Editor

The submit page and edit listing page should use the same editor experience:

- Main form tabs: `General`, `Media`, `Socials`, `Sell`.
- Left sidebar: launch scheduling state, badge card, save, preview, and launch page actions.
- The edit listing page should match submit form structure, validation, field layout, and sidebar behavior.
- Differences between submit and edit should come from data and permissions, not separate UI patterns.

## Sidebar States

### Unscheduled and Incomplete

- Show `Schedule your launch` card.
- Show completion checklist.
- Scheduling requires all required fields to be complete.
- Founder can save draft and preview if enough preview data exists.

### Unscheduled and Complete

- Hide completion checklist.
- Show `Schedule your launch` card with a stronger CTA.
- Copy should make the free queue estimate visible before the modal opens when possible.
- CTA opens the scheduling modal.

### Free Launch Scheduled

Show a card similar to:

```txt
Launch Scheduled

Your product is scheduled to launch on August 18, 2026.

[Skip the waiting line]
[Unschedule your launch]
```

The badge card remains visible below this state. Badge copy should focus on faster approval, not launch date movement.

### Premium Launch Scheduled

Show a card similar to:

```txt
Launch Scheduled

You skipped the waiting line. Your product is scheduled to launch on May 4, 2026.

[Change launch date]
```

Do not show an unschedule button for premium launches because payment and cancellation require separate handling.

## Scheduling Modal

### Step 1: Choose Launch Path

The first modal has two cards.

Free card:

```txt
Join the waiting line (Free)
Get an automatic launch week and be part of the free launch queue.
Estimated launch: in ~112 days

[Join the waiting line]
```

Premium card:

```txt
Skip the waiting line ($9)
$19 crossed out - Founding price for the first 100 premium launches

- Reserve a specific launch week
- Get stronger baseline board placement
- Includes one editorial launch spotlight during launch period

[Skip the waiting line ($9)]
```

### Step 2A: Free Badge Prompt

After `Join the waiting line`, show a second modal for badge verification.

Use the existing badge prompt idea:

```txt
Get reviewed within 24-48 hours

Add a small ShipBoost badge to your homepage or footer to unlock priority review. It helps visitors see where you launched, adds a simple trust signal to your site, and helps more founders discover ShipBoost.

Your badge is optional. You can still submit without it, but standard free launches are reviewed after priority submissions.

[Add badge for faster approval]
[Continue without badge]
```

Clicking `Continue without badge` schedules the free launch immediately and closes the modal. Badge verification affects approval priority only; it does not change the free launch date.

### Step 2B: Premium Date Picker

After `Skip the waiting line ($9)`, show a date picker before checkout.

- Founder selects a launch week/date.
- CTA shows the selected date and price, for example `Launch on May 19, 2026 ($9)`.
- Starting checkout uses the selected date.

## Data Flow

### Save Draft

Saving persists product details and media but does not create or change launch queue placement.

### Schedule Free Launch

When the founder completes the free badge prompt:

- Save the current editor data.
- Submit or update the submission as a free launch.
- Create or update a free `Launch` record at the next available free slot using the 10-per-week cap.
- Keep the tool non-public until launch visibility rules allow it.
- Return the scheduled launch date to the editor so the sidebar can show `Launch Scheduled`.

### Schedule Premium Launch

When the founder selects a premium date:

- Save the current editor data.
- Save the selected premium launch date.
- Start checkout.
- After successful payment, create or update the premium launch record.
- Keep the tool non-public until launch visibility rules allow it.

### Unschedule Free Launch

Free scheduled launches can be unscheduled from the sidebar.

- Remove or cancel the free launch record.
- Keep the draft/listing editable.
- Return sidebar to unscheduled complete state.

### Change Premium Launch Date

Premium launches can change launch date from the sidebar.

- Show date picker.
- Do not require a second payment for date changes.
- Validate the selected date with existing premium launch week rules.

## Visibility

The existing visibility model should remain the guardrail:

- Public tool pages use `getPubliclyVisibleToolWhere`.
- Public launch boards use `getPublicLaunchBoardWhere`.
- Future scheduled launches do not become public until launch date.

Implementation must preserve the invariant that a scheduled product is hidden before launch date across all public surfaces.

## Error Handling

- If required fields are missing, block scheduling and surface missing fields in the sidebar.
- If free queue calculation fails, keep the modal open and show a clear retry message.
- If premium checkout fails to start, keep the selected date and show the error.
- If badge verification fails, allow continuing without badge.
- If admin rejects a scheduled launch before launch date, hide the scheduled state from founder actions and show the review note.

## Analytics

Track:

- `launch_schedule_modal_opened`
- `free_launch_queue_joined`
- `badge_prompt_shown`
- `badge_verification_started`
- `badge_verification_completed`
- `badge_verification_skipped`
- `premium_launch_date_selected`
- `premium_launch_checkout_started`
- `free_launch_unscheduled`
- `premium_launch_date_changed`

## Testing

Cover:

- Required-field checklist hides only when all required fields are complete.
- Save draft does not create a launch.
- Free scheduling creates a launch with the next available free slot.
- Free scheduling closes the modal and shows scheduled sidebar state.
- Premium date selection starts checkout with the selected date.
- Premium scheduled sidebar has no unschedule action.
- Scheduled future launches remain hidden from public pages and launch boards.
- Launch date visibility turns on only when public visibility conditions are met.
