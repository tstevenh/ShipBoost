# Cluster 5 Scheduling Design

Date: 2026-04-20
Project: ShipBoost
Status: Approved for planning

## Goal

Ship the first Scheduling SEO slice after Forms and Surveys by:

- reusing the already imported scheduling anchor tools
- building the first scheduling buyer-intent pages
- adding the first scheduling alternatives pages
- keeping the cluster coherent inside the existing ShipBoost buyer-intent SEO architecture

This rollout should expand ShipBoost into the next commercially meaningful cluster without changing the route model, page templates, or content-management approach already used for clusters 1 to 4.

## Context

ShipBoost already supports:

- canonical buyer-intent pages at `/best/[slug]`
- grouped hub page at `/best`
- alternatives pages at `/alternatives/[slug]`
- tool pages at `/tools/[slug]`
- category pages at `/categories/[slug]`
- tag pages at `/tags/[slug]`
- tag-aware buyer-guide linking on tool pages
- support, CRM, Email Marketing, and Forms and Surveys clusters already implemented

Cluster 5 in the SEO plan combines scheduling and social publishing, but this first rollout should focus only on the scheduling side because the buyer intent is cleaner and the category fit is more stable.

## Decision Summary

This batch will use a focused scheduling-first rollout.

It will:

- reuse the already public scheduling anchor tools
- keep the first scheduling slice under `sales`
- build two scheduling best pages
- build two scheduling alternatives pages

It will not build social scheduling pages in this batch. Buffer and Later stay for a later social-specific pass under `marketing`.

## Inventory Source

The scheduling inventory already exists publicly from:

- `ShipBoost-Docs/SEO-Plan/cluster-3-5-anchor-tools-master.csv`

Relevant scheduling tools now publicly available include:

- Calendly
- Acuity Scheduling
- TidyCal
- SavvyCal
- Cal.com

No additional import pass is required before implementation as long as these tools remain public and approved.

## Category Strategy

No new category will be introduced in this rollout.

The first scheduling slice will stay under:

- `sales`

This is intentional. The buyer intent for small-business scheduling and booking tools fits the current `sales` category better than `marketing` for this batch.

Social scheduling will be treated as a separate pass later.

## Tag Strategy

The scheduling slice should rely on the imported scheduling tags to narrow the cluster inside the broader `sales` category.

Important tags include:

- `scheduling`
- `appointment-booking`
- `meeting-scheduling`
- `calendar-tools`
- `booking-software`
- `small-business`

These tags matter because the sales category now contains both CRM and scheduling, so the scheduling cluster should stay coherent through narrower tag-based relevance.

## Route Scope for This Batch

### Best pages

Build:

- `/best/scheduling-app-for-small-business`
- `/best/scheduling-software-for-small-business`

These are the canonical Cluster 5 buyer-intent pages for the first scheduling rollout.

### Alternatives pages

Build:

- `/alternatives/calendly`
- `/alternatives/acuity-scheduling`

### Not in this batch

Do not build:

- Buffer or Later alternatives
- social scheduling best pages
- any social publishing routes

Those belong to the second Cluster 5 pass.

## Best Page Ranking Model

Both scheduling best pages should use the same five public anchors:

- `calendly`
- `acuity-scheduling`
- `tidycal`
- `savvycal`
- `cal-com`

The angle should differ slightly by page.

### `/best/scheduling-app-for-small-business`

This page should use more buyer-friendly, practical small-business language.

It should emphasize:

- simplicity
- booking flow quality
- ease of adoption
- scheduling value for small teams

### `/best/scheduling-software-for-small-business`

This page should use slightly broader, more platform-oriented language.

It should emphasize:

- workflow flexibility
- integrations
- operational fit
- longer-term scheduling needs

### Recommended ranking direction for both

1. `calendly`
2. `savvycal`
3. `tidycal`
4. `acuity-scheduling`
5. `cal-com`

Reasoning:

- Calendly remains the clearest benchmark for scheduling intent
- SavvyCal is a strong modern premium alternative
- TidyCal is a strong value-oriented SMB pick
- Acuity Scheduling is credible but feels more appointment-specific and legacy
- Cal.com is powerful, but less default-fit for many small-business buyers

## Alternatives Matrix

Use one shared scheduling competitor pool, but reorder by anchor tool.

### `/alternatives/calendly`

- `savvycal`
- `tidycal`
- `acuity-scheduling`
- `cal-com`

### `/alternatives/acuity-scheduling`

- `calendly`
- `savvycal`
- `tidycal`
- `cal-com`

This keeps the buyer job tight:

- appointment scheduling
- booking flows
- calendar-based meeting setup
- small-business scheduling software

## Page Architecture

Use the current buyer-intent architecture without introducing a new page model.

### Best pages

Use:

- hardcoded entries in `src/server/seo/best-pages.ts`
- shared `/best/[slug]` template
- automatic inclusion in `/best` via hub config

### Alternatives pages

Use:

- manual entries in `src/server/seo/registry.ts`
- current alternatives page template and service layer

This rollout should extend the current architecture, not create a parallel one.

## Internal Linking Rules

### Sales category page

`/categories/sales` should link to:

- `/best/scheduling-app-for-small-business`
- `/best/scheduling-software-for-small-business`

### Best pages

Each scheduling best page should link to:

- all ranked scheduling tool pages
- `/categories/sales`
- relevant scheduling alternatives pages

### Alternatives pages

Each scheduling alternatives page should link to:

- the anchor scheduling tool page
- all compared scheduling tool pages
- `/categories/sales`
- one relevant scheduling best page

### Tool pages

Relevant scheduling tool pages should link to:

- `/categories/sales`
- one or both scheduling best pages
- their own alternatives page when one exists

## Buyer-Guide Matching Guardrail

Tool pages must continue using tag-aware buyer-guide matching, not broad category-only matching.

This matters because the `sales` category now contains:

- CRM
- Scheduling

If tool pages matched buyer guides only by category, CRM tools and scheduling tools would surface the wrong `/best/*` pages and dilute relevance.

The scheduling rollout must preserve the existing tag-aware buyer-guide matching behavior.

## Content Quality Rules

Do not ship the scheduling pages unless all ranked or compared tool slugs resolve publicly.

Each best page should keep the same depth standard used in prior clusters:

- clear intro
- who it is for
- evaluation criteria
- comparison table
- ranked tools
- FAQ
- internal links

The alternatives pages should feel like real replacements around the same buyer job rather than a mechanically copied list.

## Success Criteria for This Batch

Cluster 5 first slice is successful when:

- `/best/scheduling-app-for-small-business` is live and indexable
- `/best/scheduling-software-for-small-business` is live and indexable
- `/alternatives/calendly` is live and indexable
- `/alternatives/acuity-scheduling` is live and indexable
- the pages use only real public scheduling tool slugs
- the sales category and tool pages reinforce the new scheduling cluster cleanly
- buyer-guide matching remains tag-aware so CRM tools do not point at scheduling pages

## Not Part of This Batch

This rollout does not include:

- social scheduling best pages
- Buffer alternatives
- Later alternatives
- any social publishing routes
- new categories

Those belong to the second Cluster 5 pass after the first scheduling slice is live and reviewed.
