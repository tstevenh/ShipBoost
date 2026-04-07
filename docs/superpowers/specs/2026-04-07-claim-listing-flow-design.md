# Claim Listing Flow Design

## Purpose
Implement a claim flow for seeded public listings so founders can take ownership of an existing directory record without creating a duplicate listing.

This slice covers:
- public claim CTA on eligible seeded listings
- auth-resume claim flow
- domain-based ownership proof using company email
- dedicated claim request model with audit trail
- founder-visible claim status
- admin approval and rejection workflow
- ownership transfer into the existing founder tool model

This slice does not cover:
- DNS or HTML-file verification
- manual exception review for domain mismatch
- public claim history
- collaborative ownership or multiple owners per listing
- full revision history for tool edits

## Confirmed product decisions
- Public listings remain visible while a claim is pending review.
- Claiming starts from the public listing page.
- If the user is not signed in, they should go through auth and then resume the claim flow.
- Claim creation requires a company email matching the listing website domain.
- Approval should:
  - transfer ownership
  - unlock founder editing
  - preserve a lightweight audit record of the original seeded state

## Goals
- Turn seeded listings into founder-owned listings without creating duplicate records.
- Keep abuse resistance reasonable through domain-matched email gating.
- Preserve admin review control over ownership transfer.
- Fit the current founder dashboard and ownership model instead of introducing a parallel account system.

## Non-goals
- Strong cryptographic or DNS-based ownership verification.
- Organization/team management.
- Automatic approval.
- Hiding seeded listings during claim review.

## Architecture

### 1. Ownership model
`Tool.ownerUserId` remains the source of truth for who controls a listing.

The claim flow does not replace that field. Instead, it adds a dedicated claim-request model that can be reviewed and audited independently.

On approval, the claim record is updated and `Tool.ownerUserId` is set to the claimant’s user id.

### 2. Claim request model
Add a dedicated `ListingClaim` model.

Recommended fields:
- `id`
- `toolId`
- `claimantUserId`
- `status` with values such as:
  - `PENDING`
  - `APPROVED`
  - `REJECTED`
  - `CANCELED`
- `claimEmail`
- `claimDomain`
- `websiteDomain`
- `founderVisibleNote`
- `internalAdminNote`
- `seededToolSnapshot` as JSON
- `reviewedByUserId`
- `reviewedAt`
- `createdAt`
- `updatedAt`

The snapshot should capture enough seeded-state context to explain what was claimed and from what baseline:
- tool id
- slug
- name
- website URL
- prior owner user id
- moderation status
- publication status

### 3. Domain proof
Claim eligibility is based on matching the signed-in user email domain against the listing website domain.

First-pass matching rules:
- exact root-domain match passes
- common subdomain forms should normalize to the same base host where reasonable

Examples:
- `founder@acme.com` matches `https://acme.com`
- `founder@acme.com` matches `https://www.acme.com`
- `founder@acme.com` should match `https://app.acme.com` after normalization

If the domains do not match, claim creation is rejected with a clear founder-facing error.

There is no manual override path in this slice.

### 4. Public listing behavior
The claim CTA appears on a public tool page only when:
- the tool is publicly visible
- `ownerUserId` is null

The CTA should not appear:
- when the tool is already claimed
- when the current signed-in founder already owns the tool

The public listing stays visible while a claim is pending.

### 5. Auth-resume flow
The claim flow can be initiated from the public listing page while signed out.

Recommended behavior:
- clicking `Claim this listing` while signed out redirects to sign-in or sign-up
- include enough return context to resume claim after auth
- after auth completes, return the user to the listing page with claim intent preserved
- then validate the domain and create the claim request

This keeps conversion higher than requiring dashboard discovery first.

### 6. Founder experience
After claim creation:
- founder sees a pending claim state in the dashboard
- founder sees founder-visible notes after admin review
- approved claims cause the tool to appear in the founder’s editable tools list automatically because ownership is now transferred

The founder dashboard should show:
- pending claims
- approved claims
- rejected claims if present

### 7. Admin review flow
Admin needs a review surface for pending listing claims.

Review actions:
- approve claim
- reject claim

On approval:
- update claim status to `APPROVED`
- store reviewer and review time
- set `Tool.ownerUserId = claimantUserId`

On rejection:
- update claim status to `REJECTED`
- store reviewer and review time
- preserve founder-visible note and internal admin note
- leave public listing and tool ownership unchanged

### 8. Duplicate and conflict rules
Recommended constraints:
- only one pending claim per tool at a time
- repeated claim attempts by the same founder for the same tool should return the existing pending claim instead of creating duplicates
- rejected claims may be retried later

This keeps moderation simple and avoids queue clutter.

## Route and API shape

### Public tool page
Add a claim CTA to `/tools/[slug]` for eligible listings.

### Claim creation endpoint
Add a founder-authenticated or session-authenticated endpoint that:
- accepts the tool id or slug
- loads the tool
- checks eligibility
- validates email-domain match
- creates or returns the pending claim

### Founder dashboard data
Extend founder dashboard data loading to include claim records relevant to the current founder.

### Admin claim review endpoint
Add admin route(s) to:
- list claims
- approve claim
- reject claim

## Data loading boundaries

### Claim service
Add a dedicated claim service that owns:
- domain normalization
- eligibility checks
- duplicate prevention
- claim creation
- approval and rejection logic

### Tool service
Do not overload general tool services with claim-review logic.
Tool ownership updates can be called from the claim service, but claim orchestration should stay isolated.

## Error handling
- signed-out founder: route through auth, then resume
- tool not found: `404`
- tool already owned: block claim creation
- domain mismatch: block claim creation with clear error
- duplicate pending claim: return existing claim status instead of creating another row
- admin re-review of a finalized claim: reject with conflict

## Testing

### Domain matching
- root domain extraction from `websiteUrl`
- email-domain extraction from claimant email
- exact and normalized match cases
- mismatch cases

### Claim creation
- succeeds for eligible unowned listing with matching domain
- fails for owned listing
- fails for mismatched domain
- reuses existing pending claim for same user/tool pair

### Claim review
- approval transfers ownership
- rejection preserves listing visibility and ownership
- audit snapshot is stored

### UI and routing
- public tool page shows claim CTA only for eligible unowned tools
- founder dashboard shows pending and resolved claim states
- claim flow resumes correctly after auth redirect

## Implementation notes
- Preserve the existing founder ownership model centered on `Tool.ownerUserId`.
- Keep the audit trail lightweight in this slice.
- Prefer one claim service plus small API endpoints over embedding claim logic in multiple route files.

## Follow-on work enabled by this design
- stronger domain verification later
- notifications for claim approvals and rejections
- claim analytics
- organization-level ownership
