# Best Index Hub Design

Date: 2026-04-20
Project: ShipBoost
Status: Approved for planning

## Goal

Add a canonical `/best` index page that acts as the top-level hub for buyer-intent SEO pages and strengthen internal linking between the hub, category pages, tool pages, and existing `/best/[slug]` pages.

This should make the `best` namespace feel like a real content system instead of a set of isolated landing pages.

## Context

ShipBoost already has:

- canonical buyer-intent pages at `/best/[slug]`
- support cluster pages
- CRM cluster pages
- category hubs at `/categories/[slug]`
- alternatives pages at `/alternatives/[slug]`
- tool detail pages at `/tools/[slug]`

The missing piece is a top-level index for the `best` namespace. Without `/best`, the individual buyer-intent pages are internally linked, but they do not yet have a clear hub page that explains the system and groups them by cluster.

## Decision Summary

ShipBoost will add a grouped hub page at `/best`.

This page will:

- be the canonical index for buyer-intent pages
- group pages by cluster rather than listing them in a flat directory
- start with two clusters: `Support` and `CRM`
- include a short editorial intro for each cluster
- link to the relevant category page and supporting surfaces where useful

ShipBoost will also strengthen internal links into buyer-intent pages from:

- `/categories/support`
- `/categories/sales`
- relevant tool pages in the support and CRM clusters

## Route Architecture

### New hub route

Use:

- `/best`

Purpose:

- top-level buyer-intent hub
- cluster overview page
- internal-linking entry point into `/best/[slug]`

### Existing routes retained

Keep:

- `/best/[slug]`
- `/categories/[slug]`
- `/alternatives/[slug]`
- `/tools/[slug]`
- `/tags/[slug]`

Roles:

- `/best` = grouped index of buyer-intent pages
- `/best/[slug]` = canonical page for a specific commercial keyword
- `/categories/[slug]` = broader discovery hub
- `/alternatives/[slug]` = comparison-intent page
- `/tools/[slug]` = product/entity page
- `/tags/[slug]` = support taxonomy page

## `/best` Page Structure

### Page type

The `/best` page should be a grouped hub, not a flat directory.

### Layout

The page should include:

- breadcrumb navigation
- a hero section that explains what the `best` pages are
- grouped cluster sections
- page cards for each buyer-intent page
- supporting links for each cluster

### Initial clusters

#### Support

Purpose:

- group support and help-desk buying-guide pages

Pages:

- `/best/help-desk-software`
- `/best/customer-support-software`
- `/best/customer-support-software-for-small-business`

Supporting links:

- `/categories/support`
- `/alternatives`

#### CRM

Purpose:

- group CRM buying-guide pages

Pages:

- `/best/crm-software`
- `/best/crm-for-startups`
- `/best/crm-software-for-small-business`

Supporting links:

- `/categories/sales`
- `/alternatives`

## Hub Configuration Model

The `/best` page should be driven by a small explicit hub config rather than inferred from page copy.

The hub config should define, at minimum:

- cluster slug
- cluster title
- cluster intro
- member page slugs
- optional supporting links

This keeps the hub easy to extend when new buyer-intent clusters are added later.

## SEO and Metadata

### Metadata

The `/best` page should have unique metadata, separate from category or alternatives indexes.

It should position the page as a curated buying-guide hub for SaaS software evaluation.

### Schema

The page should emit collection/listing schema that includes the child `/best/[slug]` pages linked from the hub.

The schema should follow the same metadata/schema helper patterns already used by:

- `/categories`
- `/alternatives`
- `/tags`

## Internal Linking Behavior

### Hub to detail pages

`/best` should link to every buyer-intent page included in the current clusters.

### Category to best pages

`/categories/support` should link to the three support best pages.

`/categories/sales` should link to the three CRM best pages.

These links should be visible, intentional editorial links rather than buried in generic related-content logic.

### Tool page reinforcement

Relevant support tools should link into support best pages.

Relevant CRM tools should link into CRM best pages.

The intent is not to link every tool to every guide, but to create cluster-relevant crawl paths and stronger contextual reinforcement.

### Footer

The footer `Best Pages` column should continue to expose key buyer-intent pages and should include both support and CRM pages.

## Content and Presentation Rules

The `/best` hub should not read like a taxonomy page.

It should read like a curated guide directory with buying intent.

That means:

- cluster intros should be editorial, not generic
- page cards should surface clear titles and concise descriptions
- the page should emphasize evaluation and comparison intent
- the page should not duplicate the role of `/tags` or `/categories`

## Non-Goals

This change does not introduce:

- a CMS/admin flow for best-page clusters
- dynamic auto-clustering from tags
- a separate `/best` blog/editorial content system
- a major redesign of category or tool templates

The scope is:

- one explicit `/best` index hub
- stronger internal linking into existing buyer-intent pages

## Success Criteria

The implementation is successful when:

- `/best` exists as a working grouped hub page
- `/best` exposes both support and CRM clusters clearly
- `/best` is indexable and has proper metadata/schema
- `/categories/support` links to support buyer-intent pages
- `/categories/sales` links to CRM buyer-intent pages
- relevant tool pages expose cluster-relevant best-page links
- the footer continues to expose key best pages

