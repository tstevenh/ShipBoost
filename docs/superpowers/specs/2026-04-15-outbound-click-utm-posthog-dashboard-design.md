# Outbound Click UTM And PostHog Dashboard Design

## Purpose
Make ShipBoost outbound clicks consistently trackable, append ShipBoost attribution parameters to destination URLs, prefer affiliate URLs when present, and replace the current empty PostHog default dashboard with analytics that match what the product actually emits.

This slice covers:
- canonical tracked outbound redirects for all public tool clicks
- ShipBoost UTM parameter appending on outbound destinations
- affiliate-first URL resolution for website CTA clicks
- stronger PostHog event payloads for outbound analysis
- browser pageview tracking so standard PostHog web analytics can work
- a ShipBoost-specific PostHog dashboard built around outbound traffic and top-level site traffic

This slice does not cover:
- founder-facing internal analytics pages inside ShipBoost
- local database click counters
- revenue attribution, conversion imports, or downstream purchase matching
- CPC billing or sponsor pricing logic
- arbitrary external URL passthrough

## Confirmed product decisions
- All public outbound clicks should carry ShipBoost attribution.
- The tracked redirect should remain the canonical outbound path.
- If a tool has an affiliate URL, outbound website clicks should use the affiliate URL rather than the plain website URL.
- PostHog is the analytics store for outbound clicks.
- The current default dashboard is not useful because it expects browser pageview events that the app does not currently send.

## Current diagnosis

### What is working
- ShipBoost already emits the `tool_outbound_click` event from the server redirect flow.
- PostHog has received recent `tool_outbound_click` events in the live project.
- Some public outbound surfaces already route through `/api/outbound/tool/[toolId]`.

### What is not working
- The current PostHog dashboard tiles are the default sample insights based on `$pageview` and `$screen`.
- The app currently has no frontend PostHog client, so those events are never emitted.
- The redirect flow does not append ShipBoost UTM parameters to outbound URLs.
- The current outbound click event payload is too weak for founder-trust reporting and ops analysis.
- Existing tests do not fully reflect the intended affiliate-first behavior for website clicks.

### Why the dashboard is empty
The dashboard is empty because it asks PostHog for `$pageview` and `$screen`, while ShipBoost currently only sends `tool_outbound_click`.

This is a dashboard-model mismatch, not evidence that PostHog is failing entirely.

### Server cost impact
Adding UTMs to the redirect flow does not meaningfully increase ShipBoost server cost because those outbound clicks already hit the server redirect route.

Adding frontend pageview tracking should send events directly from the browser to PostHog, so it should increase PostHog event volume rather than materially increasing ShipBoost server load.

## Goals
- Ensure every public outbound tool click goes through a single tracked redirect.
- Append ShipBoost UTMs to outbound destinations in a consistent, predictable way.
- Guarantee affiliate-first resolution for outbound website CTAs when an affiliate URL exists.
- Capture enough event detail in PostHog to answer:
  - which tool was clicked
  - from which page/surface
  - whether the redirect used an affiliate URL
  - what final destination URL the user was sent to
- Restore meaningful PostHog visibility by adding browser pageviews and replacing the default dashboard with ShipBoost-specific insights.

## Non-goals
- Building a custom analytics warehouse.
- Tracking arbitrary external links outside the tool-outbound domain model in this slice.
- Rewriting every analytics event in the app to use PostHog.
- Creating real-time click counters on the public site.

## Chosen approach

### Recommended approach
Keep the server redirect as the canonical outbound tracking mechanism, enrich it with UTM appending and stronger PostHog properties, add a lightweight frontend PostHog browser client for pageviews, and replace the default dashboard with one built around ShipBoost’s real events.

### Why this approach
This gives ShipBoost reliable click analytics without depending on client-side race conditions before navigation, preserves affiliate routing logic in one place, keeps UTM behavior consistent, and fixes the empty dashboard at the root cause instead of only patching individual charts.

### Explicitly rejected alternatives

#### Client-side only outbound tracking
Rejected because navigation can interrupt event delivery and because URL resolution and affiliate precedence become duplicated across components.

#### Per-component UTM appending
Rejected because it spreads attribution logic across the UI, increases drift risk, and makes future changes to campaign naming expensive.

#### Dashboard-only fix without frontend pageviews
Rejected because it would produce outbound insights only, while leaving standard top-level web traffic visibility broken.

## Architecture

### 1. Canonical outbound redirect
All public outbound tool links should resolve through the existing tracked redirect route:
- `/api/outbound/tool/[toolId]?target=website&source=<surface>`
- `/api/outbound/tool/[toolId]?target=affiliate&source=<surface>`

The redirect service remains the only place that:
- validates the tool is public
- resolves the destination URL
- decides whether affiliate or plain URL is used
- appends UTMs
- emits the PostHog outbound event
- redirects the browser

### 2. Affiliate-first destination resolution
For `target=website`, the redirect should resolve:
- `tool.affiliateUrl` if present
- otherwise `tool.websiteUrl`

For `target=affiliate`, the redirect should resolve:
- `tool.affiliateUrl` only
- and return `404` when absent

This makes the “main outbound CTA” monetization-safe without requiring every surface to know whether the tool has an affiliate URL.

### 3. UTM appending rules
The redirect service should append ShipBoost attribution parameters to the final destination URL.

Chosen default scheme:
- `utm_source=shipboost`
- `utm_medium=referral`
- `utm_campaign=<source_surface>`
- `utm_content=<tool_slug>`

Behavior:
- preserve existing non-UTM query params on the destination URL
- overwrite existing `utm_source`, `utm_medium`, `utm_campaign`, and `utm_content` with ShipBoost values for consistency
- do not append `utm_term` in this slice
- do not append UTMs to invalid or missing destinations

This keeps attribution predictable for founders and destination site owners.

### 4. PostHog outbound event shape
Continue using the event name:
- `tool_outbound_click`

Required properties:
- `tool_id`
- `tool_slug`
- `tool_name`
- `destination_type`
- `destination_url_original`
- `destination_url_final`
- `source_surface`
- `source_path`
- `used_affiliate_url`
- `is_featured`
- `current_launch_type`

Optional future properties:
- `category_slug`
- `tag_slug`
- `search_query`
- `is_logged_in`

`destination_url_final` should contain the UTM-enriched URL actually used in the redirect.

### 5. Frontend pageview tracking
Add a lightweight PostHog browser integration so the app emits standard browser events such as `$pageview`.

Chosen behavior:
- initialize PostHog client only when browser env vars are configured
- capture pageviews on public and authenticated pages using the existing app router lifecycle
- do not proxy browser events through ShipBoost’s server

This restores compatibility with standard PostHog traffic insights and lets us keep an executive top-of-funnel view alongside outbound clicks.

### 6. PostHog dashboard strategy
Replace the current sample dashboard with ShipBoost-specific insights.

Recommended first dashboard sections:
- total outbound clicks over time
- outbound clicks by tool
- outbound clicks by source surface
- outbound clicks by `used_affiliate_url`
- top destination domains
- pageviews over time
- top landing pages
- referring domains

The current sample tiles based on `$pageview` and `$screen` can be deleted or replaced after browser pageview tracking is live.

## Public surfaces in scope
- tool page main website CTA
- tool page affiliate CTA
- launch board outbound CTA
- public tool cards on category pages
- public tool cards on best-tag pages
- public tool cards on alternatives pages
- any other public tool outbound CTA that currently links directly to an external destination

Internal admin links and founder-dashboard management links are out of scope unless they are true public outbound tool CTAs.

## Error handling
- invalid tool id: `404`
- hidden or non-public tool: `404`
- unsupported target: `400`
- `target=affiliate` without affiliate URL: `404`
- malformed destination URL: fail safely and do not redirect
- PostHog outbound capture failure: log and continue redirect
- browser PostHog init missing env: no-op rather than crash

## Testing strategy

### Redirect tests
- `target=website` uses affiliate URL when available
- `target=website` falls back to plain website URL when no affiliate URL exists
- `target=affiliate` requires affiliate URL
- UTM parameters are appended correctly
- existing unrelated query params are preserved
- malformed destination URLs fail safely

### Analytics tests
- `tool_outbound_click` includes the strengthened property set
- `destination_url_final` matches the redirected URL
- `used_affiliate_url` reflects actual resolution behavior
- redirect still succeeds if PostHog server capture throws

### Frontend analytics tests
- browser PostHog client initializes only when configured
- pageview capture does not break SSR or navigation
- no duplicate init on rerender

### Manual verification
- click outbound CTA on a live/public tool and confirm the final redirected URL includes ShipBoost UTMs
- confirm affiliate-backed tools redirect to affiliate URL rather than plain website URL
- confirm `tool_outbound_click` appears in PostHog with the new properties
- confirm PostHog begins receiving `$pageview`
- confirm rebuilt dashboard tiles populate with real data

## Implementation notes
- Reuse the existing tracked redirect route and service rather than creating a parallel outbound system.
- Keep outbound analytics best-effort: user navigation takes priority over event completeness.
- Use the app’s existing public visibility logic rather than reproducing publish checks by hand.
- The dashboard should be treated as product analytics configuration, not sample scaffolding.

## Follow-on work enabled by this design
- founder-facing “traffic sent by ShipBoost” reporting
- per-tool outbound trend charts in admin
- sponsor reporting based on outbound traffic
- click-to-signup funnel analysis where destination-side data becomes available
