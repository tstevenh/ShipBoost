# Master Outbound Link PostHog Design

## Purpose
Add a sitewide outbound-link analytics layer in PostHog so ShipBoost can measure every external webpage click across the public site, while preserving the existing specialized tool outbound tracking model.

This slice should support two reporting needs at the same time:
- a homepage-safe outbound traffic metric that counts every external webpage click on the site
- richer tool-specific analytics that continue to answer which tools received outbound traffic and through which tracked path

## Scope
This slice covers:
- a new master PostHog event for all outbound webpage clicks
- preserving `tool_outbound_click` as the specialized tool event
- extending the existing tool redirect flow so tool clicks contribute to the master outbound metric
- browser-side tracking for non-tool external webpage links
- instrumentation for current high-value public surfaces such as startup directories, pricing, and homepage or marketing CTAs

This slice does not cover:
- `mailto:`, `tel:`, downloads, or non-web destinations
- founder-facing analytics pages inside ShipBoost
- a full audit of every obscure legacy external link in one pass
- changing tool outbound routing away from the current redirect model

## Confirmed product decisions
- ShipBoost needs a master outbound event that tracks every outbound webpage click on the site.
- `tool_outbound_click` should remain as a specialized tool event.
- The master event should be broad enough to power a homepage proof metric.
- Only external webpage visits should count toward the master event.
- Tool links should keep the current redirect flow.
- Non-tool webpage links can remain direct external links.

## Current state

### What already exists
- ShipBoost already emits `tool_outbound_click` from the server redirect path at `/api/outbound/tool/[toolId]`.
- The redirect flow already validates public tool access, resolves the destination, prefers affiliate URLs for website clicks, and appends ShipBoost UTMs when appropriate.
- PostHog is already receiving `tool_outbound_click` in the live project.

### What is missing
- ShipBoost does not yet have a master event that represents all outbound webpage traffic.
- PostHog does not currently have a live `outbound_link_clicked` event definition because the event is not implemented yet.
- Public non-tool external links such as startup directory visits and pricing partner links currently bypass the tracked tool redirect flow.
- That means the current outbound dataset is incomplete for homepage proof or total traffic-sent reporting.

## Goals
- Add one master outbound event that can answer “how many outbound webpage clicks did ShipBoost send overall?”
- Keep `tool_outbound_click` intact for tool-specific analysis.
- Ensure tool clicks count toward both master outbound reporting and specialized tool reporting.
- Cover non-tool public outbound webpage links without forcing every external link through a server redirect.
- Keep event naming and property conventions stable enough for dashboards and future founder reporting.

## Non-goals
- Replacing the existing tool redirect model with browser-only tracking.
- Sending all external links through a ShipBoost redirect route.
- Tracking non-web destinations.
- Creating a custom warehouse or internal analytics backend for outbound traffic.

## Chosen approach

### Recommended approach
Use a hybrid outbound tracking model:
- keep the current server redirect for tool links
- add a new master event named `outbound_link_clicked`
- emit `outbound_link_clicked` for tool clicks from the redirect flow
- emit `outbound_link_clicked` for non-tool external webpage links in the browser

### Why this approach
This preserves the current reasons tool redirects exist while avoiding unnecessary redirect hops for simple non-tool external links. It also gives ShipBoost one true sitewide outbound metric without sacrificing the richer tool-specific event model.

### Rejected alternatives

#### Redirect every external link through ShipBoost
Rejected because it is more invasive than necessary for generic links and would add route plumbing and an extra hop to simple public CTAs that do not require backend resolution.

#### Browser-only tracking for everything
Rejected because it weakens reliability for tool clicks and undermines the centralized business logic already implemented for affiliate-first tool routing and tracked redirect behavior.

## Event model

### Master event
Add a new event:
- `outbound_link_clicked`

Purpose:
- represent every outbound external webpage click across ShipBoost
- power a homepage proof metric and sitewide outbound dashboards
- provide a common top-level event even when the destination is not modeled as a tool

Required properties:
- `href`
- `destination_domain`
- `source_path`
- `source_surface`
- `link_context`
- `is_tool_link`
- `tracking_method`

Optional properties when available:
- `link_text`
- `tool_id`
- `tool_slug`
- `tool_name`

Property rules:
- `href` is the final external URL the user is sent to
- `destination_domain` is the normalized hostname from `href`
- `source_path` is the ShipBoost pathname and query string where the click happened
- `source_surface` identifies the specific UI surface or entry point
- `link_context` is a coarser grouping used for dashboard breakdowns
- `is_tool_link` distinguishes tool-modeled traffic from general outbound traffic
- `tracking_method` is either `server_redirect` or `browser`

### Specialized tool event
Keep the existing event:
- `tool_outbound_click`

Purpose:
- preserve the current tool outbound analytics model
- retain richer tool-specific properties such as destination type and affiliate usage
- support tool-level reporting independently of the broader outbound metric

### Relationship between the two events
For tool links:
- emit `outbound_link_clicked`
- emit `tool_outbound_click`

For non-tool outbound webpage links:
- emit `outbound_link_clicked` only

This keeps the master event broad and the specialized event precise.

## Capture architecture

### 1. Tool outbound links
Keep tool links on the existing redirect route:
- `/api/outbound/tool/[toolId]?target=<target>&source=<source>`

The redirect flow remains responsible for:
- validating the tool is public
- resolving the destination URL
- preferring affiliate URLs for website clicks when present
- appending ShipBoost UTMs according to the existing rules
- emitting the specialized tool event
- redirecting the browser to the external destination

Change required:
- extend this flow so it also emits `outbound_link_clicked`

For tool clicks, the master event should use:
- `is_tool_link=true`
- `tracking_method=server_redirect`

This preserves the current business logic and ensures tool clicks contribute to the sitewide outbound total.

### 2. Non-tool outbound webpage links
Keep non-tool external webpage links as direct links.

Add a small browser-side helper that:
- detects clicks on external `http` or `https` links that leave the ShipBoost domain
- emits `outbound_link_clicked`
- ignores internal links, hash links, and non-web protocols

For non-tool clicks, the master event should use:
- `is_tool_link=false`
- `tracking_method=browser`

This avoids forcing generic public links through a redirect route when they do not need backend URL resolution.

## Eligible links

### In scope
- tool website and affiliate clicks that already use the tracked tool redirect
- startup directories resource visits
- pricing partner CTA visits
- public homepage and marketing-page external webpage CTAs
- other public external webpage links that are clearly part of traffic-sent reporting

### Out of scope
- `mailto:`
- `tel:`
- file downloads
- anchors and internal links

Note:
The master event should be capable of tracking every outbound webpage click on the site. Filtering lower-signal surfaces can happen in dashboard logic later if needed, but the base capture model should remain broad.

## Naming and property conventions

### `source_surface`
This should identify the precise origin of the click. Examples:
- `tool_page`
- `launch_board`
- `category_page`
- `startup_directories`
- `pricing_page`
- `homepage`
- `footer`

### `link_context`
This should identify a broader reporting bucket. Examples:
- `tool_page`
- `tool_listing`
- `startup_directories`
- `pricing`
- `homepage`
- `marketing`

Constraint:
- define a small stable vocabulary and reuse it across components
- avoid ad hoc strings that drift over time

## Dashboard and reporting strategy

### Homepage proof
Use `outbound_link_clicked` as the canonical source for homepage-facing outbound traffic claims.

### Operational dashboard
Recommended PostHog insights:
- total outbound clicks over time from `outbound_link_clicked`
- outbound clicks by `link_context`
- outbound clicks by `destination_domain`
- outbound clicks by `tracking_method`
- tool outbound clicks over time from `tool_outbound_click`
- tool outbound clicks by tool slug or tool name

This separates high-level proof from tool-level operational analysis without requiring one event to serve both jobs badly.

## Error handling and data quality

### Tool links
- redirect behavior should remain best-effort for analytics
- if PostHog capture fails, redirect should still complete
- existing tool redirect validation rules remain in force

### Browser-tracked non-tool links
- analytics should not block navigation
- event loss is acceptable for generic non-tool links if navigation wins the race
- reliability-critical tool clicks remain server-backed

### Double-counting control
Tool links must not emit the master event both in the browser and in the redirect flow.

Rule:
- tool outbound links should rely on the server redirect path for both `outbound_link_clicked` and `tool_outbound_click`
- browser-side outbound tracking should not also fire for those same tool links

## Testing strategy

### Redirect tests
- tool redirect still emits `tool_outbound_click`
- tool redirect also emits `outbound_link_clicked`
- tool redirect continues to resolve affiliate-first URLs correctly
- tool redirect still appends expected UTMs
- tool redirect still succeeds if analytics capture fails

### Browser tracking tests
- external non-tool `http/https` links emit `outbound_link_clicked`
- internal links do not emit the master event
- `mailto:`, `tel:`, and hash links do not emit the master event
- tracked properties include expected path, domain, and context values

### Manual verification
- click a tracked tool link and confirm both events appear in PostHog
- click a startup directories link and confirm only `outbound_link_clicked` appears
- click the pricing partner link and confirm only `outbound_link_clicked` appears
- confirm `tracking_method` and `is_tool_link` values are correct

## Implementation notes
- Reuse the existing PostHog browser helper rather than scattering raw capture logic across components.
- Keep the current tracked tool redirect as the only canonical path for tool outbound analytics.
- Prefer small explicit instrumentation over overly clever global DOM interception.
- Preserve existing PostHog event shapes where possible and extend them carefully rather than renaming working events.

## Follow-on work enabled by this design
- homepage proof such as total clicks sent outward by ShipBoost
- founder-facing traffic-sent reporting later
- better sponsor and partner reporting
- segmentation of outbound traffic by surface, domain, and context
