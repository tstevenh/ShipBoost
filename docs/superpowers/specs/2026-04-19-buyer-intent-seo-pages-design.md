# Buyer-Intent SEO Pages Design

Date: 2026-04-19
Project: ShipBoost
Status: Approved for planning

## Goal

Add a dedicated buyer-intent SEO page system that lets ShipBoost rank with stronger intent match for commercial queries such as:

- `best help desk software`
- `best customer support software`
- `best customer support software for small business`
- `best crm for startups`

The system should make `/best/*` the canonical ranking surface for intent-heavy keywords, while keeping tools, categories, tags, and alternatives as supporting discovery and internal-linking surfaces.

## Context

ShipBoost already supports:

- tool pages at `/tools/[slug]`
- category pages at `/categories/[slug]`
- alternatives pages at `/alternatives/[slug]`
- tag pages currently exposed at `/best/tag/[slug]`

The current architecture is strong enough to support buyer-intent SEO. The missing piece is a dedicated page type for ranking against narrow commercial keywords. Broad category pages and tag pages are useful support surfaces, but they are not the ideal canonical page for queries like `best crm for startups`.

## Decision Summary

ShipBoost will introduce a dedicated page type at `/best/[slug]` for buyer-intent ranking pages.

This page type will:

- be the canonical SEO target for narrow commercial intent queries
- use one shared template
- use hardcoded per-page content/config for v1
- support rich editorial copy and structured comparison sections
- rank tools editorially, with internal scoring kept private

ShipBoost will also rename tag pages from `/best/tag/[slug]` to `/tags/[slug]` so the `best` namespace is reserved only for canonical buyer-intent pages.

## Route Architecture

### Canonical buyer-intent pages

Use:

- `/best/[slug]`

Examples:

- `/best/help-desk-software`
- `/best/customer-support-software`
- `/best/customer-support-software-for-small-business`
- `/best/crm-for-startups`

Purpose:

- canonical ranking target for commercial evaluation keywords
- editorial comparison page with strong intent match

### Support taxonomy pages

Use:

- `/tags/[slug]`

Examples:

- `/tags/help-desk`
- `/tags/customer-support`
- `/tags/crm`

Purpose:

- support taxonomy and internal linking
- secondary discovery surface
- not the main ranking target for commercial head terms

### Existing routes retained

Keep:

- `/tools/[slug]`
- `/categories/[slug]`
- `/alternatives/[slug]`

Roles:

- `/tools/[slug]` = product/entity pages
- `/categories/[slug]` = broad cluster hubs
- `/alternatives/[slug]` = dedicated substitute/comparison intent pages

## Route Migration

### Tag route migration

Current:

- `/best/tag/[slug]`

New:

- `/tags/[slug]`

Required migration behavior:

- 301 redirect `/best/tag/:slug` to `/tags/:slug`
- update all internal links to point to `/tags/:slug`
- update canonical URLs for tag pages
- update sitemap generation for the new tag route

### Best namespace rule

After this change, `best` should refer only to canonical buyer-intent landing pages.

`/best/tag/[slug]` should no longer exist as a live canonical route.

## Page Architecture for `/best/[slug]`

### Rendering model

Use one shared page template plus one hardcoded content/config entry per page.

This is intentionally a middle ground:

- not one fully custom React page per keyword
- not a thin fully generic auto-generated template

The template should be reusable, but every page should still be richly authored.

### Why this model

This approach keeps:

- content quality high
- page structure consistent
- implementation faster than building a CMS/admin flow
- future scaling possible without rewriting the system

Thin content should be prevented through content standards, not by forcing one-off page files.

## Content Model for `/best/[slug]`

Each page should have a structured hardcoded config entry with at least:

- `slug`
- `targetKeyword`
- `title`
- `metaTitle`
- `metaDescription`
- `intro`
- `whoItsFor`
- `howWeEvaluated`
- `comparisonTable`
- `rankedTools`
- `faq`
- `internalLinks`
- optional `customSections`

### Ranked tool entry model

Each ranked tool should define:

- `toolSlug`
- `rank`
- `verdict`
- `bestFor`
- `notIdealFor` or drawback note
- optional criteria highlights

The shared template should consume this structure and render a high-depth editorial page.

## Page Composition Standard

Every `/best/[slug]` page should contain, at minimum:

- unique intro
- clear “who this is for” section
- public “how we evaluated” section
- light comparison table near the top
- 6 to 8 ranked tools minimum
- verdict blurb for each ranked tool
- FAQ section
- internal links to tools, tags, category pages, and alternatives pages

This is the minimum launch threshold for a canonical buyer-intent page.

## Editorial Policy

### Ranking philosophy

Ranking order is editorial.

It should reflect actual fit for the searcher, not a purely mechanical formula.

However, rankings should still be guided by an internal scoring rubric so the editorial order remains defensible and consistent across pages.

### Public vs private evaluation logic

Publicly show the evaluation criteria in plain language.

Do not show numeric scoring on the page.

Examples of public criteria language:

- ease of use
- startup fit
- pricing
- automation depth
- integrations
- support workflow fit

Internal numeric or weighted scoring may exist behind the scenes, but should remain private.

### Monetization rule

Affiliate status, paid status, or founder submission status must not determine ranking order.

A non-affiliate or non-submitted tool can rank anywhere, including #1, if it is the strongest fit for the query.

### Tone and style

Pages should use a mixed style:

- editorial voice with clear opinions
- structured comparison sections for trust and scannability

They should not read like:

- neutral database dumps
- listicles padded with filler
- monetization-first recommendation pages

## Internal Linking Model

### `/best/[slug]` pages should link to

- ranked tool pages
- closely related alternatives pages
- relevant category hub
- relevant tag pages
- nearby `/best/*` pages where relevant

### Category pages should link to

- relevant `/best/*` pages for their cluster
- important alternatives pages
- top tool pages in the cluster

### Tool pages should link to

- relevant `/best/*` pages
- relevant `/alternatives/*` pages
- relevant category page
- relevant tag pages

### Tag pages should link to

- supporting tool pages
- related categories
- selected `/best/*` pages where the intent overlaps

The system should form a coherent cluster, not isolated landing pages.

## Cluster Rollout Strategy

### First implementation slice

Implement the `support/help desk` cluster first.

Reason:

- cleaner keyword grouping
- strong alternatives intent
- obvious category fit with `support`
- easier quality control for the first rollout

### First canonical pages

Initial `/best/*` targets:

- `/best/help-desk-software`
- `/best/customer-support-software`
- `/best/customer-support-software-for-small-business`

Initial supporting alternatives targets:

- `/alternatives/zendesk`
- `/alternatives/freshdesk`
- `/alternatives/intercom`
- `/alternatives/helpscout`

### Second implementation slice

Follow immediately with the `CRM/startups` cluster.

Likely initial canonical pages:

- `/best/crm-for-startups`
- optional later support for `/best/crm-software-for-startups`

Likely supporting alternatives targets:

- `/alternatives/hubspot`
- existing `/alternatives/pipedrive` can support, but should not be the only CRM alternatives asset

## Content Operations for v1

For v1, `/best/*` pages should be hardcoded rather than admin-managed.

Reason:

- simpler to implement
- easier to control quality
- faster to ship the first 5 to 15 pages

This is a product-management decision, not a frontend performance decision. Static or cached admin-managed pages could also be fast, but they require more infrastructure and QA than is justified for the first rollout.

## Review Cadence

These pages should be treated as living assets and reviewed internally on a recurring basis after launch.

The cadence does not need to be shown publicly on the page in v1.

No public “last reviewed” or “updated on” SEO mechanism is required for this scope.

## Success Criteria

Success for v1 is operational and architectural, not defined as guaranteed rankings.

The implementation is successful if:

- the route system is clean and semantically consistent
- `/best/[slug]` exists as a reusable canonical buyer-intent page type
- `/tags/[slug]` replaces `/best/tag/[slug]` cleanly
- the first `support/help desk` pages meet the content-depth standard
- internal linking is coherent across best pages, tools, categories, tags, and alternatives
- pages are indexable, differentiated, and clearly more useful than thin competitor list pages

## Explicit Non-Goals

This design does not include:

- building an admin UI for `/best/*` pages in v1
- exposing numeric scores publicly
- fully custom React page files for every best page
- using tag pages as the primary canonical ranking surface
- defining SEO success as “outrank every competitor”

The content can be designed to be stronger and more useful than competitor pages, but rankings remain dependent on broader SEO factors beyond page architecture alone.
