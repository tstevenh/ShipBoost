# Admin Submission Draft Visibility Design

## Goal

Make the admin `Moderate` tab useful for both:

- real review work (`PENDING` submissions that can be approved or rejected)
- saved but unsubmitted founder drafts (`DRAFT` submissions) that help explain where founders stopped

The design keeps both states in the same moderation surface, but removes the current ambiguity between them.

## Problem

Today the admin submissions list mixes saved drafts and real review items when the filter is set to `All`, but the UI does not explain that clearly:

- `DRAFT` submissions are currently displayed with the fallback lifecycle label `Pending review`
- only `PENDING` submissions render the `Approve & Publish` and `Reject` actions
- there is no read-only detail page for admins to inspect the saved draft data

This makes it hard to answer simple operational questions:

- which founders actually submitted for moderation?
- which founders only saved a draft?
- for free launches, which drafts are stuck at badge verification?

## Scope

In scope:

- keep drafts and real pending reviews together in the existing `Moderate` tab
- fix submission lifecycle labels so `DRAFT` is visually distinct from `PENDING`
- show a compact draft-progress summary directly on the moderation card
- make founder and tool names clickable
- add an admin submission detail page that shows the saved submission data in read-only form

Out of scope:

- autosave while typing
- tracking unsaved abandonment before a founder clicks `Save & Choose Plan`
- full event analytics for exact click-by-click dropoff
- changing founder-facing submission flow or validation

## User Experience

### Moderate tab list

The `Moderate` tab remains a single mixed list.

Each card should show:

- lifecycle chip: `Draft`, `Pending review`, `Approved`, `Needs changes`, or `Awaiting payment`
- submission type chip: `FREE_LAUNCH`, `FEATURED_LAUNCH`, etc.
- payment chip: existing payment label
- badge chip: `Badge: Pending`, `Badge: Verified`, or `Badge: Not required`
- timestamps: `Submitted ...` and `Last updated ...`

Behavior:

- `PENDING` submissions continue to show review actions
- `DRAFT` submissions do not show review actions
- founder name and tool name link to the admin detail page

This lets the admin scan the queue without guessing whether a row is actionable.

### Detail page

Add a read-only admin page for a single submission.

Route shape:

- `/admin/submissions/[submissionId]`

The page should show:

- top summary with review status, submission type, payment status, badge status, created at, updated at
- founder info and tool identity
- saved general fields: name, slug, website URL, pricing model, tagline, description, category, tags
- saved media: logo and screenshots
- saved social links
- launch choices: preferred launch date when present
- notes already stored on the submission

The page is not an editor. It is an inspection surface for admins.

## Data Model And API

No schema migration is required for this design.

The existing `Submission` record already contains enough state to support the first version:

- `reviewStatus`
- `submissionType`
- `paymentStatus`
- `badgeVerification`
- `createdAt`
- `updatedAt`
- linked `tool` fields
- linked `user` fields

The existing admin list endpoint can continue to return mixed submissions. It only needs to expose `updatedAt` in its serialized payload if that is not already present in the client type.

The new detail page should use a dedicated admin-only loader that fetches one submission with the same relational depth already used by the admin list:

- submission
- user
- tool
- tool media
- categories and tags
- launches if useful for context

## Status Rules

The admin lifecycle label logic should become explicit:

- `DRAFT` => `Draft`
- `REJECTED` => `Needs changes`
- `FEATURED_LAUNCH` + `paymentStatus === "PENDING"` => `Awaiting payment`
- `APPROVED` => `Approved`
- otherwise `PENDING` => `Pending review`

The review action buttons should remain limited to:

- `reviewStatus === "PENDING"`
- excluding premium launches still waiting on payment

Badge summary logic:

- `FREE_LAUNCH` + `badgeVerification === "PENDING"` strongly suggests the founder saved the draft but did not finish badge verification
- `FREE_LAUNCH` + `badgeVerification === "VERIFIED"` means the founder passed badge verification
- other submission types should display `Not required`

This is inference from saved state, not exact behavioral telemetry.

## Components

### Existing components to update

- `src/components/admin/admin-console-shared.tsx`
  - fix lifecycle label mapping
  - add badge label helper if needed

- `src/components/admin/submission-review-panel.tsx`
  - show badge status and last-updated metadata
  - make founder and tool names linkable
  - keep review actions conditional on real review items only

- `src/components/admin/admin-console.tsx`
  - pass through any newly serialized fields such as `updatedAt`

### New server surface

- admin service function for fetching one submission by id
- admin page loader for `/admin/submissions/[submissionId]`

### New UI surface

- read-only admin submission detail page component, or page-local rendering if the file stays small

## Data Flow

1. Admin opens `Moderate`
2. Admin sees mixed rows from the existing submissions endpoint
3. UI distinguishes `DRAFT` vs `PENDING` correctly
4. Admin clicks founder name or tool name
5. App navigates to `/admin/submissions/[submissionId]`
6. Server loads the submission and related saved tool data
7. Admin inspects the saved draft or review-ready submission

## Error Handling

List page:

- if `updatedAt` or badge fields are unexpectedly missing, render a safe fallback instead of hiding the row

Detail page:

- unauthenticated or non-admin users are blocked by existing admin auth
- unknown submission id returns not found
- deleted or inaccessible linked media should degrade to missing-image placeholders rather than failing the whole page

## Testing

Add or update tests for:

- lifecycle label mapping returns `Draft` for `DRAFT`
- `PENDING` submissions still show review actions
- `DRAFT` submissions do not show review actions
- badge summary renders correctly for free vs premium submissions
- detail page loader returns 404 for missing submission
- detail page renders saved submission fields for a known draft

## Tradeoffs

Why this approach:

- minimal product change with high operational value
- no database migration
- no extra tracking system required for the first version
- avoids overloading the moderation list with full inline details

Known limitation:

- this does not tell us whether a founder viewed the badge section and abandoned it
- it only tells us the last persisted state after a draft save

If exact abandonment analytics becomes necessary later, that should be a separate follow-up using explicit progress events or saved progress markers.

## Implementation Notes

Keep the first version read-only and focused.

Do not add inline editing to the detail page.
Do not move drafts to a separate admin section.
Do not add analytics or schema changes in this pass.
