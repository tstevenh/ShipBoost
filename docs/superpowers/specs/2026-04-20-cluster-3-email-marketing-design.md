# Cluster 3 Email Marketing Design

Date: 2026-04-20
Project: ShipBoost
Status: Approved for planning

## Goal

Ship the first Email Marketing SEO slice after Support and CRM by:

- importing and publishing all anchor tools from the cluster 3 to 5 CSV
- building the first buyer-intent Email Marketing pages
- strengthening internal linking for the Email Marketing cluster inside the existing ShipBoost SEO architecture

This rollout should expand ShipBoost into the next commercially meaningful buyer-intent cluster without changing the core route or page architecture already used for clusters 1 and 2.

## Context

ShipBoost already supports:

- canonical buyer-intent pages at `/best/[slug]`
- grouped hub page at `/best`
- alternatives pages at `/alternatives/[slug]`
- tool pages at `/tools/[slug]`
- category pages at `/categories/[slug]`
- support and CRM clusters already implemented

The new planning documents define Cluster 3 as Email Marketing and specify that the right first step is inventory-first execution.

## Decision Summary

This batch will use an inventory-first, focused Cluster 3 rollout.

It will:

- import and publish all anchor tools from `cluster-3-5-anchor-tools-master.csv`
- standardize tags during import
- build only the first Email Marketing page set in this batch

It will not attempt to fully ship clusters 4 and 5 yet, even though their anchor tools will be imported at the same time.

## Inventory Source

Use:

- `ShipBoost-Docs/SEO-Plan/cluster-3-5-anchor-tools-master.csv`

The CSV format is compatible with the existing seeded-tool importer.

It already uses:

- `category`
- `tag_1` through `tag_5`
- `pricing_model`

No importer redesign is required for this cluster.

## Publication Rule

All imported anchor tools from clusters 3 to 5 should be published immediately if the CSV data is clean enough for public use.

The goal is to avoid future buyer-intent pages being blocked by missing public inventory.

## Category Strategy

No new categories will be introduced in this rollout.

Clusters 3 to 5 remain on existing broad categories.

### Cluster 3

Primary category:

- `marketing`

### Cluster 4 and 5 inventory

Their anchor tools may also remain under existing broad categories from the CSV rather than forcing new category creation in this batch.

The differentiation for now comes from:

- `/best/*` pages
- `/alternatives/*` pages
- tags
- internal linking

## Tag Strategy

Import and standardize tags from the CSV during the inventory pass.

For Cluster 3, expected tags include:

- `email-marketing`
- `newsletter`
- `email-automation`
- `email-campaigns`
- `creator-email`
- `ecommerce-email`
- `marketing-automation`

These tags are important because the `marketing` category is broad and needs a narrower layer to support the Email Marketing cluster properly.

## Route Scope for This Batch

### Best pages

Build:

- `/best/email-marketing-for-small-business`
- `/best/email-marketing-platform-for-small-business`

These URLs should mirror the target keyword closely.

### Alternatives pages

Build:

- `/alternatives/mailchimp`
- `/alternatives/convertkit`
- `/alternatives/activecampaign`

For ConvertKit:

- keep the URL slug as `convertkit`
- page copy may explain the current Kit branding

### Not in this batch

Do not build cluster 4 or 5 landing pages in this rollout.

Those clusters only receive imported public inventory for now.

## Supporting Tool Inventory

This batch should import the full cluster 3 to 5 anchor set, but the first Email Marketing slice depends most directly on the Cluster 3 anchors.

Cluster 3 anchor tools include:

- Mailchimp
- ConvertKit / Kit
- ActiveCampaign
- MailerLite
- Brevo
- Klaviyo
- Beehiiv
- Campaign Monitor
- Constant Contact
- GetResponse

These tools should be publicly available before the Email Marketing pages are considered complete.

## Page Architecture

Use the existing buyer-intent architecture without introducing a new page model.

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

### Marketing category page

`/categories/marketing` should link to:

- `/best/email-marketing-for-small-business`
- `/best/email-marketing-platform-for-small-business`
- `/alternatives/mailchimp`
- `/alternatives/convertkit`
- `/alternatives/activecampaign`

### Best pages

Each best page should link to:

- all ranked email tool pages
- `/categories/marketing`
- relevant alternatives pages

### Alternatives pages

Each alternatives page should link to:

- the anchor tool page
- all compared alternative tool pages
- `/categories/marketing`
- one related Email Marketing best page

### Tool pages

Relevant Email Marketing tool pages should link to:

- `/categories/marketing`
- at least one relevant Email Marketing best page
- the tool’s alternatives page when one exists

## Content Quality Rules

Do not ship Email Marketing pages unless all ranked or compared tool slugs resolve publicly.

The importer runs first specifically to avoid missing-tool blockers.

Each `/best/*` page should maintain the same depth standard used for Support and CRM:

- clear intro
- who it is for
- evaluation criteria
- comparison table
- ranked tools
- FAQ
- internal links

## Non-Goals

This rollout does not include:

- full Cluster 4 landing pages
- full Cluster 5 landing pages
- new category creation
- CMS/admin tooling for buyer-intent pages
- a comparison-page content system beyond existing alternatives pages

## Success Criteria

This batch is successful when:

- all cluster 3 to 5 anchor tools from the CSV are imported and public
- Cluster 3 email tags are standardized
- the two Email Marketing `/best/*` pages exist and resolve
- the three Email Marketing alternatives pages exist and resolve
- `/categories/marketing` links into the new Email Marketing pages
- relevant email tool pages expose cluster-relevant best/alternatives links
- the pages are indexable and supported by metadata, canonical URLs, and schema through the existing best/alternatives systems

