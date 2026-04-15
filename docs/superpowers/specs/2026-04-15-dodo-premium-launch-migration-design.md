# Dodo Premium Launch Migration Design

## Purpose
Replace Polar with Dodo Payments for the premium launch checkout flow, remove Polar from the app entirely, and align product language around `premium launch` without taking unnecessary live-schema risk.

This slice covers:
- hard cutover from Polar to Dodo for all new and current payment behavior
- server-side Dodo checkout session creation for premium launches
- Dodo webhook verification and payment/refund handling
- dashboard return reconciliation using Dodo return parameters
- removal of Polar routes, env vars, dependencies, and helper modules
- app-layer rename from `featured launch` to `premium launch`
- pricing page integration that can show the live Dodo price with caching

This slice does not cover:
- database field renames in Prisma for Polar-specific columns
- enum renames for `SubmissionType.FEATURED_LAUNCH`
- subscriptions, coupons, or recurring billing
- customer portal features
- a second provider fallback path

## Confirmed product decisions
- The migration is a hard cutover. Polar should be treated as dead code.
- The payment flow is a one-time payment only.
- The premium launch checkout price should be managed in Dodo, not hardcoded in checkout logic.
- The pricing page may fetch the live current Dodo price server-side.
- The crossed-out compare-at price on the pricing page can remain static marketing copy for now.
- The founding-offer countdown must remain tied to successful paid launches in ShipBoost’s own database.
- There are no real customer payment records that require backward compatibility behavior.
- Database cleanup should happen in a later release, after Dodo is stable in production.

## Goals
- Make Dodo the only payment provider in the codebase.
- Preserve the current premium launch purchase behavior with minimal operational risk.
- Rename the product consistently to `premium launch` in routes, server code, UI copy, and messaging.
- Keep the public site fast by avoiding client-side payment price fetches.
- Preserve the founding-offer countdown behavior on the pricing page.

## Non-goals
- Re-modeling the entire billing domain during the provider swap.
- Building a generic multi-provider abstraction before there is a real need for one.
- Renaming production database columns and enum values in the same release.
- Making the pricing page depend on a live uncached client-side Dodo request.

## Current codebase map

### Active payment surfaces
- `src/server/polar.ts`
  - Polar client creation and success/return URL defaults
- `src/server/services/submission-payment-service.ts`
  - checkout creation
  - payment apply/reconcile logic
  - refund handling
  - premium launch reschedule gating
- `src/app/api/polar/checkout/featured-launch/route.ts`
  - authenticated checkout start route
- `src/app/api/polar/webhooks/route.ts`
  - Polar webhook entrypoint
- `src/app/dashboard/page.tsx`
  - checkout success reconciliation from query params
- `src/components/founder/submit-product-form.tsx`
  - submit flow kickoff for paid launch
- `src/components/founder/founder-dashboard.tsx`
  - retry/start checkout from dashboard
- `src/app/pricing/page.tsx`
  - founding offer copy and paid spot counter
- `src/server/services/founding-offer-service.ts`
  - remaining founder spots calculation

### Current live-schema coupling
- `prisma/schema.prisma`
  - `Submission.polarCheckoutId`
  - `Submission.polarOrderId`
  - `Submission.submissionType === FEATURED_LAUNCH`

These schema details stay in place for this release, even though app-facing terminology and provider logic change.

## Chosen approach

### Recommended approach
Do an app-layer cleanup and provider swap now, while leaving the live database shape stable for one release.

This means:
- Dodo becomes the only active provider in app code
- Polar code, routes, env vars, and packages are removed
- UI and server naming become `premium launch`
- Prisma columns and enum values remain temporarily as compatibility storage details

### Why this approach
The current payment surface is narrow, so the provider cutover itself is manageable. The avoidable risk is combining that with a live database rename. Splitting those concerns gives a clean provider migration now and a safer dedicated schema cleanup later.

### Explicitly rejected alternatives

#### Minimal provider-only swap
Rejected because it would keep `polar` and `featured` concepts embedded in active code, which increases maintenance cost immediately after the migration.

#### Full provider swap plus DB rename in one release
Rejected because it mixes network/payment integration risk with live-schema migration risk and does not produce enough immediate product value to justify the rollout complexity.

## Dodo integration architecture

### New server module
Create a dedicated Dodo server module to replace `src/server/polar.ts`.

Responsibilities:
- validate Dodo env vars
- initialize the Dodo SDK with mode mapping
- provide return URL generation
- provide helpers for looking up payment state for reconciliation
- centralize any Dodo-specific payload shaping

Likely file:
- `src/server/dodo.ts`

### Checkout creation flow
The authenticated premium launch checkout flow remains server-created and redirect-based.

Behavior:
- founder selects premium launch and saves the draft
- app POSTs to `/api/dodo/checkout/premium-launch`
- server verifies the submission belongs to the founder and is eligible for payment
- server creates a Dodo checkout session using:
  - `product_cart` with the single premium launch product id
  - `customer` details from the authenticated founder
  - `return_url`
  - `metadata` including ShipBoost submission identifiers
- server stores the external payment reference in the existing temporary columns
- server returns `checkout_url`
- frontend redirects the founder to Dodo-hosted checkout

No checkout price is hardcoded in backend logic. Dodo’s product configuration is the source of truth for the purchase amount.

### Return reconciliation flow
The current dashboard reconciliation expects Polar’s `checkout_id`. Dodo should replace that with its own return parameters.

Chosen behavior:
- Dodo returns to the dashboard with payment-oriented params, primarily `payment_id` and `status`
- dashboard loader calls a server reconciliation function when those params are present
- reconciliation verifies the payment with Dodo server-side instead of trusting the query string
- successful payments mark the submission paid using existing transaction logic

This preserves the current “return to dashboard and confirm payment” UX while matching Dodo’s model.

### Webhook flow
Replace the Polar webhook route with a Dodo webhook route that uses Standard Webhooks verification.

Chosen behavior:
- verify signature using Dodo webhook headers and secret
- accept at least:
  - `payment.succeeded`
  - the Dodo refund event used for one-time purchase refunds, confirmed from the live docs/SDK during implementation
- read the ShipBoost identifiers from metadata when available
- fall back to the stored external reference when necessary
- apply idempotent updates to the existing submission and tool launch records
- revalidate public content after successful payment/refund processing

The code should tolerate duplicate webhook delivery and dashboard reconciliation happening near the same time.

## Naming strategy for this release

### Product naming
Use `premium launch` as the product name everywhere user-facing and in active code.

This includes:
- pricing page
- submit flow labels
- dashboard statuses and CTA labels
- success and error messages
- email content related to paid launch confirmation
- route names where the route is part of active app behavior

### Temporary internal storage naming
For this release only:
- `SubmissionType.FEATURED_LAUNCH` remains the stored enum value
- `polarCheckoutId` remains the temporary external checkout reference column
- `polarOrderId` remains the temporary external payment reference column

These are implementation details, not naming we continue to expand.

### Release 2 cleanup target
After Dodo is stable, ShipBoost should run a dedicated schema cleanup release that:
- renames provider-specific columns to neutral names
- renames `FEATURED_LAUNCH` to a premium-aligned enum/value
- removes any compatibility naming left from this release

## Pricing page strategy

### Chosen approach
Fetch the live Dodo premium launch price server-side with caching, and continue rendering the compare-at price as static marketing copy.

Behavior:
- server reads the Dodo premium launch product by id
- page formats the current live product price for display
- page uses cache/revalidation so visitors do not trigger a Dodo request on every load
- static crossed-out price remains in code for now, for example `$19`
- founder spot count remains derived from ShipBoost’s own paid submission count

### Why this approach
This keeps the checkout amount accurate without making the public pricing page dependent on a client-side roundtrip or a fresh server fetch on every request.

### Performance requirement
Do not fetch the Dodo price from the client. The pricing page should remain static-feeling and fast.

Recommended cache strategy:
- server-side data fetch only
- revalidate in the range of 5 to 60 minutes
- graceful fallback to the current static premium launch price copy if Dodo is unavailable

## Env and config changes

### New env vars
- `DODO_PAYMENTS_API_KEY`
- `DODO_PAYMENTS_WEBHOOK_SECRET`
- `DODO_PAYMENTS_MODE`
- `DODO_PREMIUM_LAUNCH_PRODUCT_ID`
- optional `DODO_PAYMENTS_RETURN_URL`

### Removed env vars
- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_SERVER`
- `POLAR_FEATURED_LAUNCH_PRODUCT_ID`
- `POLAR_SUCCESS_URL`
- `POLAR_RETURN_URL`

### Mode mapping
ShipBoost should expose a simple app env like `test` or `live`, and the Dodo server module should map that to the SDK’s expected values.

## File-level change plan

### Remove
- `src/server/polar.ts`
- `src/app/api/polar/webhooks/route.ts`
- `src/app/api/polar/checkout/featured-launch/route.ts`
- Polar package dependencies from `package.json`

### Add
- `src/server/dodo.ts`
- `src/app/api/dodo/webhooks/route.ts`
- `src/app/api/dodo/checkout/premium-launch/route.ts`

### Modify
- `src/server/services/submission-payment-service.ts`
- `src/server/services/submission-service.ts` exports if needed
- `src/server/services/submission-service-shared.ts`
- `src/server/services/founding-offer-service.ts`
- `src/app/dashboard/page.tsx`
- `src/app/pricing/page.tsx`
- `src/components/founder/submit-product-form.tsx`
- `src/components/founder/founder-dashboard.tsx`
- `src/server/env.ts`
- `.env.example`
- `.env.production.example`
- tests covering payment and founding-offer behavior

## Error handling requirements
- If Dodo checkout session creation fails, do not leave the submission in a misleading paid state.
- If Dodo is temporarily unavailable when loading pricing, render the page with the static fallback price and do not fail the page.
- If webhook signature verification fails, return an auth error and do not process the event.
- If the webhook payload is valid but does not match a ShipBoost submission, log it clearly and return success to avoid endless retries.
- If both webhook and dashboard reconciliation try to finalize the same payment, the final state must still be correct and idempotent.

## Verification requirements

### Automated
- update unit tests for checkout creation to assert Dodo session creation input
- update reconciliation tests to assert Dodo payment lookup and paid-state application
- update refund tests to assert the Dodo refund event path
- update founding-offer tests to ensure the founder spot count still reflects paid premium launches
- run the relevant Vitest suite for payment and pricing behavior

### Manual
- create a premium launch draft and start a Dodo test checkout
- confirm redirect to Dodo checkout URL
- complete a successful Dodo test payment and confirm dashboard reconciliation
- verify premium launch status updates in the founder dashboard
- verify pricing page renders the current Dodo product price without client-side fetching
- verify founder spot count still decrements from successful paid submissions
- verify refund webhook behavior in test mode if Dodo supports the relevant test event

## Rollout plan

### Release 1
- merge the app-layer Dodo migration
- deploy with Dodo test configuration in the target environment first
- verify checkout, return reconciliation, webhook processing, and pricing rendering
- switch to live Dodo env values after the test flow is confirmed

### Release 2
- perform the dedicated Prisma/schema cleanup
- rename provider-specific storage fields
- rename `FEATURED_LAUNCH` to the long-term premium-aligned enum/value
- remove any release-1 compatibility naming from application code

## Risks and mitigations

### Risk: mixed terminology causes bugs
Mitigation:
- enforce `premium launch` naming everywhere in active app code and copy
- isolate temporary old naming to persistence boundaries only

### Risk: webhook and dashboard reconciliation race each other
Mitigation:
- preserve idempotent paid-state application logic
- treat external references as already-processed if the submission is already paid with the same external payment id

### Risk: pricing page becomes slow or brittle
Mitigation:
- server-only cached Dodo fetch
- fallback value on upstream failure
- no client-side price request

### Risk: provider migration accidentally expands scope
Mitigation:
- do not rename Prisma storage in this release
- do not add a generic payments abstraction beyond what this one flow needs

## Open implementation assumptions
- Dodo’s one-time premium launch product will exist in test mode before end-to-end verification.
- Dodo provides a payment lookup flow suitable for server-side reconciliation from the return parameters.
- Dodo exposes a stable refund event for one-time purchases that can map onto ShipBoost’s current refund behavior.

If any of these assumptions are wrong in the live docs or SDK behavior, the implementation should adjust at the Dodo integration boundary without expanding scope into schema redesign.
