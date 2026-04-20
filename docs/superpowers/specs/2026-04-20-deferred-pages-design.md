# Deferred Pages Design

Date: 2026-04-20
Project: ShipBoost
Status: Approved for planning

## Goal

Ship the remaining inventory-backed deferred pages from the SEO plan by:

- building the deferred survey best page
- building the deferred social scheduling best page
- adding the first social scheduling alternatives pages

This rollout should only include pages supported by real public inventory. It should not force pages for tools that do not yet exist in the database.

## Context

ShipBoost already supports:

- canonical buyer-intent pages at `/best/[slug]`
- grouped hub page at `/best`
- alternatives pages at `/alternatives/[slug]`
- tool pages at `/tools/[slug]`
- category pages at `/categories/[slug]`
- tag pages at `/tags/[slug]`
- tag-aware buyer-guide linking on tool pages
- clusters 1 to 5 first slices already implemented

The SEO plan still had a small set of deferred pages that were intentionally left for later:

- `best survey tool`
- `best social media scheduling tools`
- `buffer alternatives`
- `later alternatives`

The same plan also mentioned:

- `cognito forms alternatives`
- `hootsuite alternatives`

Those should not be included now because the required public inventory does not currently exist in the database.

## Decision Summary

This batch will build only the deferred pages that are supported by current public inventory.

It will include:

- `/best/survey-tool`
- `/best/social-media-scheduling-tools`
- `/alternatives/buffer`
- `/alternatives/later`

It will explicitly skip:

- `/alternatives/cognito-forms`
- `/alternatives/hootsuite`

## Inventory Guardrail

Do not build a page unless the relevant tools already exist publicly.

Current public inventory supports:

### Survey-related tools

- Typeform
- SurveyMonkey
- Jotform
- Fillout
- Formstack
- Tally

### Social scheduling tools

- Buffer
- Later
- Vista Social
- Sked Social
- Sociamonials

Current inventory does not support:

- Cognito Forms
- Hootsuite

Those pages should remain deferred until the tools exist publicly.

## Category Strategy

Both deferred best pages should stay under:

- `marketing`

This is intentional. The broad category remains the same, while tags and buyer-guide matching do the real narrowing.

## Tag Strategy

### Survey best page

Use tags like:

- `survey-tool`
- `feedback-collection`
- `online-forms`

### Social scheduling best page

Use tags like:

- `social-scheduling`
- `social-publishing`
- `social-media`

These tags matter because the `marketing` category now contains:

- Email Marketing
- Forms and Surveys
- Social Scheduling

Without tag-aware narrowing, tool pages inside marketing would surface the wrong buyer guides.

## Route Scope for This Batch

### Best pages

Build:

- `/best/survey-tool`
- `/best/social-media-scheduling-tools`

### Alternatives pages

Build:

- `/alternatives/buffer`
- `/alternatives/later`

### Not in this batch

Do not build:

- `/alternatives/cognito-forms`
- `/alternatives/hootsuite`

## Best Page Inventory and Ranking Model

### `/best/survey-tool`

Use this inventory:

- `surveymonkey`
- `typeform`
- `jotform`
- `fillout`
- `formstack`
- `tally`

This page is narrower than the online form builder page, but it should still include broader form tools when they are credible survey-capable alternatives.

Reasoning:

- SurveyMonkey is the clearest survey benchmark
- Typeform remains highly credible because survey UX and response experience matter
- Jotform, Fillout, Formstack, and Tally are still credible survey-capable tools even if they are broader than pure survey software

### `/best/social-media-scheduling-tools`

Use this inventory:

- `buffer`
- `later`
- `vista-social`
- `sked-social`
- `sociamonials`

This page is now supported by a real multi-tool public pool, not just Buffer vs Later.

## Alternatives Matrix

### `/alternatives/buffer`

- `later`
- `vista-social`
- `sked-social`
- `sociamonials`

### `/alternatives/later`

- `buffer`
- `vista-social`
- `sked-social`
- `sociamonials`

This keeps the buyer job tight around social scheduling and publishing, without pulling in unrelated social tools like messaging or chat products.

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

### Marketing category page

`/categories/marketing` should link to:

- `/best/survey-tool`
- `/best/social-media-scheduling-tools`

### Best pages

Each deferred best page should link to:

- all ranked tool pages
- `/categories/marketing`
- relevant alternatives pages when they exist

### Alternatives pages

Each social scheduling alternatives page should link to:

- the anchor tool page
- all compared alternative tool pages
- `/categories/marketing`
- `/best/social-media-scheduling-tools`

### Tool pages

Relevant survey and social scheduling tool pages should link to:

- `/categories/marketing`
- the matching deferred best page
- their own alternatives page when it exists

## Buyer-Guide Matching Guardrail

Tool pages must continue using tag-aware buyer-guide matching, not broad category-only matching.

This matters especially now because the `marketing` category contains multiple distinct clusters:

- Email Marketing
- Forms and Surveys
- Social Scheduling

If the matcher fell back to broad category matching, unrelated marketing tools would surface the wrong buyer guides and dilute relevance.

The deferred-pages rollout must preserve the existing tag-aware buyer-guide matching behavior.

## Content Quality Rules

Do not ship a deferred page unless all ranked or compared tool slugs resolve publicly.

Each best page should keep the same depth standard used across prior clusters:

- clear intro
- who it is for
- evaluation criteria
- comparison table
- ranked tools
- FAQ
- internal links

Alternatives pages should feel like real replacements around the same buyer job rather than a mechanically copied list.

## Success Criteria for This Batch

This deferred-pages rollout is successful when:

- `/best/survey-tool` is live and indexable
- `/best/social-media-scheduling-tools` is live and indexable
- `/alternatives/buffer` is live and indexable
- `/alternatives/later` is live and indexable
- the pages use only real public tool slugs
- the marketing category and tool pages reinforce the two new best pages cleanly
- buyer-guide matching remains tag-aware so unrelated marketing tools do not point at the wrong pages

## Not Part of This Batch

This rollout does not include:

- `/alternatives/cognito-forms`
- `/alternatives/hootsuite`
- any additional expansion beyond the four supported deferred pages

Those pages should wait until the missing tools exist publicly.
