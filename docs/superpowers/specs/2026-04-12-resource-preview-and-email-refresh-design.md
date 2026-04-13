# Resource Preview And Email Refresh Design

## Goal

Refine the startup directories lead magnet into a cleaner public-to-private resource flow:

- signed-out visitors can view a public preview of `/resources/startup-directories`
- the page uses a compact resource-specific unlock panel instead of an immediate redirect
- the unlock flow sends a dedicated directories-access email, not the generic sign-in email
- all transactional emails move to the current ShipBoost visual language and copy style

## Why This Change

The current implementation works mechanically, but the experience is still rough:

- signed-out users are redirected too early and do not get to evaluate the resource
- the lead magnet uses the generic sign-in email, which is correct technically but weak semantically
- the email design still reflects an outdated ShipBoost theme
- local testing exposed a real delivery constraint: the current `onboarding@resend.dev` sender only works for the Resend account owner's email, so public rollout requires a verified sending domain

## Scope

This slice covers:

- public preview state for `/resources/startup-directories`
- signed-in full-access state on the same route
- compact unlock panel on the resource page
- dedicated directories-access email copy and template
- refreshed visual system and wording for all transactional emails
- preview filtering rules, including excluding Reddit rows

This slice does not cover:

- project-based submission tracking inside the directories resource
- analytics instrumentation for preview-to-unlock conversion
- affiliate or UTM link rewriting for destination URLs
- full marketing-email/broadcast redesign outside transactional flows

## Product Behavior

### Signed-out visitor

When a signed-out visitor lands on `/resources/startup-directories`:

1. They stay on the page.
2. They see a resource landing view with:
   - page headline
   - short value proposition
   - directory count summary
   - compact unlock panel
   - preview table rows
3. The preview uses real directory rows, but excludes all `reddit.com` entries.
4. If they enter an email, ShipBoost:
   - captures the lead via `/api/leads`
   - sends a dedicated directories-access email
   - authenticates through the existing Better Auth magic-link flow underneath
5. The success state tells them to check their inbox for the access link.

### Signed-in visitor

When a signed-in user lands on the same route:

- they see the full directories table immediately
- Reddit rows remain available in the full list
- no unlock panel is shown

## Architecture

Use a dual-state resource page instead of route-level redirect gating.

### Current model

- `page.tsx` checks session
- if no session, it redirects to `/sign-in`

### New model

- `page.tsx` checks session
- if session exists, render the full resource
- if session does not exist, render a preview shell plus unlock panel

This keeps one canonical route and avoids split landing-page/resource-page behavior.

## Components

### Resource page

`src/app/resources/startup-directories/page.tsx`

- stop redirecting signed-out visitors
- load session on the server
- choose between:
  - signed-in full resource state
  - signed-out preview state

### Resource table

`src/components/resources/startup-directories-resource.tsx`

- support a preview mode flag
- preview mode limits row count
- preview mode excludes `reddit.com`
- signed-in mode renders the full table as it does today

### Unlock panel

New component:

- `src/components/resources/resource-unlock-panel.tsx`

Responsibilities:

- email input
- CTA copy specific to this resource
- success/error presentation
- lead capture + directories-access email trigger

This should not reuse the homepage promotional surface wholesale. It should be smaller and more tightly connected to the resource preview.

## Email System Design

Keep a shared email rendering system, but separate emails by user intent.

### Shared base

Refactor the transactional renderer so all templates share:

- current ShipBoost palette
- current spacing and border treatment
- consistent CTA button style
- consistent footer and support framing

### Template split

Use distinct auth-adjacent templates:

- `sendMagicLinkSignInEmailMessage(...)`
  - used from `/sign-in`
  - subject like `Your ShipBoost sign-in link`
  - utility-first

- `sendDirectoriesAccessEmailMessage(...)`
  - used from the homepage lead magnet and resource unlock panel
  - subject like `Your startup directories access link`
  - slightly more contextual/value-led
  - CTA like `Open the directories`

Important: these are different templates, not different auth systems. Both still use Better Auth magic-link verification URLs.

## Copy Direction

### Sign-in page

Keep:

- button: `Email me a sign-in link`
- success message: `Check your inbox for your sign-in link.`

### Homepage lead magnet

Shift from generic auth language to resource-access language:

- CTA stays resource-specific
- success state says the access link is on the way

### Resource unlock panel

Use explicit resource copy:

- button: `Email me access`
- success message: `Check your inbox for your access link.`

### Directories access email

This email should feel like resource fulfillment, not generic auth.

Example shape:

- subject: `Your startup directories access link`
- headline: `Your directories list is ready`
- short body: explain what they are opening
- CTA: `Open the directories`

## Preview Rules

The preview should be intentionally useful but incomplete.

Rules:

- use real imported data
- exclude all `reddit.com` entries
- show a small fixed number of rows, recommended `12`
- keep the same columns as the full table
- preserve sorting clarity, but preview should prioritize a clean first impression over power-user controls

## Error Handling

### Lead capture fails

- show inline error in the unlock panel
- do not claim the email was sent

### Lead capture succeeds but directories-access email fails

- show a specific inline error:
  - email saved, access link could not be sent right now
- keep the lead record

### Resend sender is still test-only

This is a deployment constraint, not a product behavior choice.

For public rollout:

- Resend must use a verified sending domain
- `RESEND_FROM_TRANSACTIONAL` must use that domain
- `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` must point at the real app domain

Without those settings, public email delivery will remain blocked or unusable.

## Testing

Add or update tests for:

- resource page signed-out preview behavior
- resource preview excludes Reddit rows
- unlock panel submission flow
- homepage lead magnet using directories-access email path
- auth form still using generic sign-in email path
- transactional email renderer snapshots or string assertions for:
  - sign-in email
  - directories-access email

## Success Criteria

- signed-out users can view `/resources/startup-directories` without redirect
- the page shows a compact unlock panel and real preview rows
- preview excludes Reddit rows
- signed-in users see the full table
- lead-magnet unlock requests send a dedicated directories-access email
- `/sign-in` still sends the generic sign-in email
- transactional emails match the current ShipBoost visual direction

