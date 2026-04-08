# Relaunch And Duplicate-Domain Backend Design

## Purpose
Tighten the relaunch backend so an existing product can be launched again without creating a second tool record, and enforce a single canonical tool entry per root domain across the whole system.

This slice covers:
- duplicate-domain enforcement on submission creation
- root-domain normalization across common subdomains
- founder-facing duplicate error payload with CTA
- relaunch correctness across submission, review, launch creation, and publish flow
- backend behavior for routing same-founder duplicates back to their existing listing

This slice does not cover:
- new frontend relaunch UX beyond existing dashboard CTA targets
- claim flow changes for duplicate domains owned by someone else
- hard database uniqueness on normalized domain unless explicitly added later
- multi-domain products or aliases

## Confirmed product decisions
- A founder should not be able to submit the same product twice.
- Duplicate checks should apply against any existing tool, not only approved/published tools.
- The duplicate check should normalize by root domain, so `acme.com`, `www.acme.com`, and `app.acme.com` collapse to one product identity.
- If a duplicate is detected, the founder should see an error message and a CTA to relaunch or manage the existing product.
- If the duplicate belongs to the same founder, the CTA should go to the existing dashboard tool page.

## Current backend findings
- `SubmissionType.RELAUNCH` exists in Prisma.
- `LaunchType.RELAUNCH` exists in Prisma.
- `resolveLaunchType(...)` already maps `RELAUNCH -> RELAUNCH`.
- The review flow is not fully correct yet:
  - `currentLaunchType` is set using `resolveLaunchType(...)`
  - but `launch.create(...)` currently maps non-featured launches to `"FREE"`
  - this means relaunch submissions do not produce `LaunchType.RELAUNCH` consistently

So this is not just a duplicate check feature. Relaunch already exists partially and needs correctness work.

## Goals
- Enforce one canonical tool entry per product domain.
- Prevent duplicate tool creation at the draft/submission layer.
- Make relaunch the intended backend path for an existing product.
- Ensure relaunch creates correct launch history and publish behavior.

## Non-goals
- Team ownership or organization models.
- Multi-product handling under one shared corporate domain.
- Domain verification beyond the current claim-flow logic.
- Automatically redirecting unknown founders into claim flow on duplicate conflict.

## Architecture

### 1. Canonical root-domain identity
Introduce a shared backend helper for extracting a normalized root domain from a tool website URL.

Examples:
- `https://acme.com` -> `acme.com`
- `https://www.acme.com` -> `acme.com`
- `https://app.acme.com` -> `acme.com`

This helper should be reused in:
- duplicate submission checks
- admin tool creation checks if applicable
- any future dedupe/import tooling

### 2. Duplicate-domain rule
Before a new tool is created for a submission:
- normalize the requested website domain
- search for any existing tool whose normalized root domain matches

If a match exists:
- do not create a new tool
- return a structured error payload

This should apply to:
- new founder submissions
- potentially admin-created tools as well, if admin should not create duplicates either

### 3. Duplicate error contract
The duplicate-domain error should be more than a plain string.

Recommended response shape:
- `error`: human-readable message such as `This domain already exists on Shipboost.`
- `details.duplicateTool`:
  - `id`
  - `slug`
  - `name`
  - `ownedByYou`
  - `ctaHref`
  - `ctaLabel`

For same-founder duplicates:
- `ownedByYou = true`
- `ctaHref = /dashboard/tools/[toolId]`
- `ctaLabel = Manage existing listing`

For duplicates not owned by the founder:
- still block duplicate creation
- `ownedByYou = false`
- CTA can be omitted initially, or later point toward claim flow

### 4. Relaunch ownership model
Relaunch must not create a second tool.

Instead:
- relaunch submissions should target an existing tool id
- approval should create a new `Launch` row for the existing tool
- launch history should reflect multiple launches for the same tool over time

### 5. Relaunch correctness
Relaunch should work end-to-end through:
- `SubmissionType.RELAUNCH`
- `resolveLaunchType(...)`
- `reviewSubmission(...)`
- `launch.create(...)`
- `publishDueLaunches(...)`
- public launch board visibility

The key correctness rule:
- relaunch must create `LaunchType.RELAUNCH`, not `LaunchType.FREE`

### 6. Publication and visibility behavior
An existing tool should remain the same canonical public listing.

Relaunch should:
- append launch history
- update current launch state appropriately
- not create duplicate public pages

The existing public visibility rule should continue to determine when the tool is visible as a public listing.

### 7. Scope boundaries

#### Founder-owned duplicate
- block new submission
- return dashboard CTA

#### Not-owned duplicate
- block new submission
- return duplicate metadata
- no auto-claim handoff required in this slice

#### Existing draft resubmission
- should continue to update the existing draft/submission pair when `submissionId` is present
- duplicate logic should not break draft editing flows for the already-associated tool

## Route and service shape

### Submission creation service
Add duplicate-domain guard in `createSubmission(...)` before creating a new tool.

The guard should:
- skip when updating an existing submission for the same tool
- reject only true duplicates against other tool ids

### Shared duplicate-domain service/helper
Add a focused helper or service responsible for:
- website URL normalization
- root-domain extraction
- finding existing tools by normalized domain
- constructing duplicate payload metadata

### Review service
Fix relaunch handling in `reviewSubmission(...)` so launch creation uses:
- `FEATURED` for featured launch
- `RELAUNCH` for relaunch
- `FREE` for free launch

## Error handling
- invalid website URL: `400`
- duplicate root domain: `409`
- relaunch submission tied to missing tool: `404`
- relaunch approval with inconsistent state: `409` or `500` depending on failure mode

## Testing

### Root-domain normalization
- root domain extraction
- `www` collapse
- subdomain collapse
- mismatch cases

### Duplicate submission enforcement
- blocks a new submission when another tool already uses the same root domain
- same-founder duplicate returns dashboard CTA metadata
- different-founder duplicate still blocks creation

### Draft editing safety
- editing an existing submission for the same tool is not falsely blocked

### Relaunch correctness
- relaunch approval creates `LaunchType.RELAUNCH`
- relaunch launch history is appended to the existing tool
- relaunch publish flow works with scheduled/live transitions

## Implementation notes
- This slice should focus on service correctness before any polished relaunch UX.
- Prefer shared root-domain helpers over copying claim-domain code inline.
- If a DB uniqueness constraint on normalized domain is not added now, service-level checks still need race-aware handling.

## Follow-on work enabled by this design
- dedicated relaunch CTA/flow from founder dashboard
- automatic “this product already exists” claim suggestion
- seed import dedupe against canonical domains
- analytics on relaunch frequency and outcomes
