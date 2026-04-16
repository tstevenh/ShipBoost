# PostHog Traffic And Conversion Events Design

## Purpose
Add the missing general traffic analytics and a small set of meaningful conversion events to ShipBoost without enabling broad autocapture or polluting the product with low-signal tracking.

This slice covers:
- browser-side PostHog identity stitching after real authentication
- standard traffic visibility from browser pageviews
- a minimal conversion-event set for founder funnels
- event placement at confirmed business milestones instead of generic button clicks

This slice does not cover:
- broad PostHog autocapture
- custom founder analytics pages inside ShipBoost
- warehouse export or advanced attribution models
- tracking every minor UI interaction

## Confirmed product decisions
- ShipBoost should track general visitor traffic such as visitors, pageviews, sessions, landing pages, and referring domains.
- PostHog should identify users after real signup/signin success.
- Broad autocapture should remain disabled.
- The initial conversion set should be:
  - `sign_up_completed`
  - `sign_in_completed`
  - `lead_magnet_submitted`
  - `tool_submission_completed`
  - `premium_launch_checkout_started`
  - `premium_launch_paid`
- `sign_in_completed` should only fire for a real authenticated login success, not for magic-link email requests.

## Current state

### What already exists
- Browser pageview tracking is now wired via `posthog-js`.
- Outbound click tracking already uses the canonical redirect route and emits `tool_outbound_click`.
- The PostHog dashboard has already been repurposed to show outbound-click and top-level traffic insights.

### What is still missing
- The browser does not yet identify users after authentication, so anonymous visits are not stitched to logged-in founders.
- Conversion events are not yet emitted for signup, login, lead capture, submission completion, checkout start, or payment success.
- The product currently knows when these milestones happen, but those moments are not yet translated into PostHog events.

## Goals
- Preserve lightweight traffic analytics while improving funnel visibility.
- Tie anonymous traffic to real users after authentication where possible.
- Track only milestone events that answer real business questions.
- Emit success events from confirmed success paths, not optimistic UI actions.

## Non-goals
- Tracking every CTA click, form field interaction, or tab change.
- Creating a custom analytics abstraction before it is needed.
- Using PostHog as a replacement for operational logs or transactional system state.

## Chosen approach

### Recommended approach
Use a hybrid tracking model:
- browser PostHog for pageviews, visitor/session data, user identification, and a few client-confirmed events
- server-side capture for backend-confirmed business milestones

### Why this approach
This keeps top-of-funnel traffic analytics browser-native and low-cost while ensuring business milestones such as submissions and payments are recorded from the paths that actually confirm success.

### Explicitly rejected alternatives

#### Client-only conversion tracking
Rejected because some critical milestones, especially premium payment success and submission completion, are more trustworthy when emitted from the confirmed backend path.

#### Server-only analytics
Rejected because browser traffic, landing pages, referrers, and authenticated identity stitching are a natural fit for browser-side PostHog and should not be proxied through ShipBoost’s server.

#### Broad autocapture
Rejected because it increases event volume, adds noise, and does not match the product’s current need for clear, sparse funnel metrics.

## Event model

### Identity behavior
When a real authenticated session exists in the browser:
- call `posthog.identify(user.id, { email, name, role })`
- use the ShipBoost user id as the primary distinct identity

When the user signs out:
- call `posthog.reset()`

This allows anonymous pre-auth pageviews to stitch into the authenticated founder journey in the same browser session.

### Conversion events

#### 1. `lead_magnet_submitted`
Meaning:
- a lead capture request succeeded and the email was accepted by ShipBoost

Source of truth:
- after `/api/leads` succeeds in the startup-directories access flow

Recommended properties:
- `lead_magnet`
- `source`
- `email_domain`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

#### 2. `premium_launch_checkout_started`
Meaning:
- ShipBoost successfully created a premium launch checkout session and returned a usable checkout URL

Source of truth:
- after `/api/dodo/checkout/premium-launch` succeeds in the founder dashboard

Recommended properties:
- `submission_id`
- `tool_id`
- `tool_name`
- `submission_type`
- `preferred_launch_date`

This should not fire when the founder only clicks the button but checkout creation fails.

#### 3. `tool_submission_completed`
Meaning:
- the founder completed the submission workflow and ShipBoost accepted the draft into the submission pipeline

Source of truth:
- server-side after `submitSubmissionDraft(...)` succeeds

Recommended properties:
- `submission_id`
- `tool_id`
- `tool_name`
- `submission_type`
- `has_affiliate_url`
- `category_count`
- `tag_count`

#### 4. `premium_launch_paid`
Meaning:
- ShipBoost confirmed payment success and marked the premium launch as paid

Source of truth:
- the same confirmed payment-success path that currently updates the submission to `PAID`

Recommended properties:
- `submission_id`
- `tool_id`
- `tool_name`
- `launch_date`
- `payment_id`
- `checkout_session_id`

This should be fired from the confirmed success path, not from the checkout redirect button.

#### 5. `sign_up_completed`
Meaning:
- a user successfully completed signup and crossed the verification threshold into a real account

Source of truth:
- the post-verification success path, not the initial sign-up form submit

Reasoning:
- ShipBoost requires verified email, so form submission is not the true success milestone

Recommended properties:
- `user_id`
- `email_domain`
- `auth_method`

#### 6. `sign_in_completed`
Meaning:
- a real authenticated session exists after login

Source of truth:
- browser-side session detection after auth resolves to a real signed-in user

Reasoning:
- email-password, Google, and magic-link flows all converge on “session now exists”
- this avoids false positives from magic-link email requests

Recommended properties:
- `user_id`
- `email_domain`
- `auth_method` when inferable, otherwise omit

## Placement strategy

### Browser-side placement
Use the existing PostHog browser client for:
- `posthog.identify(...)`
- `posthog.reset()`
- `lead_magnet_submitted`
- `sign_in_completed`
- pageview/session traffic
- optionally `premium_launch_checkout_started` if the UI already has the needed data and success signal

### Server-side placement
Use the existing server-side PostHog helper for:
- `tool_submission_completed`
- `premium_launch_paid`
- `sign_up_completed` if emitted from a server-side verification hook
- optionally `premium_launch_checkout_started` if easier to emit from the checkout route after session creation

The general rule:
- browser for browser-native traffic and authenticated identity
- server for backend-confirmed business milestones

## Event timing rules
- never emit success events before the success path is confirmed
- do not emit `sign_in_completed` for magic-link email request sends
- do not emit `premium_launch_checkout_started` if checkout creation fails
- do not emit `premium_launch_paid` from the return URL alone; only from confirmed payment success logic

## Data quality rules
- keep event names stable and explicit
- keep properties sparse and useful
- avoid attaching entire objects or raw unbounded payloads
- avoid duplicate emission from both browser and server for the same milestone
- prefer ShipBoost ids over inferred UI labels whenever possible

## Testing strategy

### Browser analytics tests
- session-based identify runs only when a real user session exists
- sign-out resets PostHog identity
- `sign_in_completed` only fires when the browser transitions into a real authenticated state
- lead magnet success triggers `lead_magnet_submitted`

### Server analytics tests
- `tool_submission_completed` fires after successful submission
- `premium_launch_paid` fires after payment is confirmed
- `premium_launch_checkout_started` fires only after a valid checkout session is created, if implemented server-side

### Manual verification
- visit the site anonymously and confirm `$pageview` continues to arrive
- sign up and verify email; confirm `sign_up_completed`
- sign in successfully; confirm `sign_in_completed`
- submit the lead magnet form; confirm `lead_magnet_submitted`
- complete a tool submission; confirm `tool_submission_completed`
- start premium checkout successfully; confirm `premium_launch_checkout_started`
- complete a premium payment; confirm `premium_launch_paid`

## Follow-on work enabled by this design
- conversion funnels from visitor to signup to submission to payment
- founder acquisition reporting by landing page and referrer
- campaign performance analysis for ShipBoost distribution channels
- cleaner distinction between top-of-funnel traffic and monetized founder behavior
