# Cluster 4 Forms and Surveys Design

Date: 2026-04-20
Project: ShipBoost
Status: Approved for planning

## Goal

Ship the first Forms and Surveys SEO slice after Email Marketing by:

- reusing the already imported Cluster 4 anchor tools
- building the first buyer-intent forms page
- adding the first alternatives pages for major forms and survey products
- keeping the cluster coherent inside the existing ShipBoost buyer-intent SEO architecture

This rollout should expand ShipBoost into the next commercially meaningful cluster without changing the route model, page templates, or content-management approach already used for clusters 1 to 3.

## Context

ShipBoost already supports:

- canonical buyer-intent pages at `/best/[slug]`
- grouped hub page at `/best`
- alternatives pages at `/alternatives/[slug]`
- tool pages at `/tools/[slug]`
- category pages at `/categories/[slug]`
- tag pages at `/tags/[slug]`
- tag-aware buyer-guide linking on tool pages
- support, CRM, and Email Marketing clusters already implemented

Cluster 4 in the SEO plan is Forms and Surveys. The inventory for this cluster is already public because the cluster 3 to 5 CSV import has already run successfully.

## Decision Summary

This batch will use a focused Cluster 4 rollout.

It will:

- reuse the already published Cluster 4 anchor tools
- stay inside the existing `marketing` category
- build one canonical best page
- build four alternatives pages

It will not build `best survey tool` in this batch. That page stays for a later pass once the first forms page is live and reviewed.

## Inventory Source

Cluster 4 anchor inventory already exists publicly from:

- `ShipBoost-Docs/SEO-Plan/cluster-3-5-anchor-tools-master.csv`

Relevant Cluster 4 tools now publicly available include:

- Typeform
- Jotform
- SurveyMonkey
- Formstack
- Tally
- Fillout
- Paperform

No additional import pass is required before implementation as long as these tools remain public and approved.

## Category Strategy

No new category will be introduced in this rollout.

Cluster 4 will stay under:

- `marketing`

This is intentional. The category remains broad while the cluster gets its real specificity from:

- `/best/*` pages
- `/alternatives/*` pages
- tags
- internal linking

## Tag Strategy

Cluster 4 should rely on the imported form-related tags to narrow the cluster inside the broader `marketing` category.

Important tags include:

- `form-builder`
- `online-forms`
- `survey-tool`
- `no-code-forms`
- `feedback-collection`
- `lead-capture`
- `quizzes`
- `workflow-automation`
- `branded-forms`

These tags matter because the marketing category now contains multiple buyer-intent clusters, so the forms cluster should stay coherent through narrower tag-based relevance.

## Route Scope for This Batch

### Best page

Build:

- `/best/online-form-builder`

This is the canonical Cluster 4 buyer-intent page for the first rollout.

### Alternatives pages

Build:

- `/alternatives/typeform`
- `/alternatives/jotform`
- `/alternatives/surveymonkey`
- `/alternatives/formstack`

### Not in this batch

Do not build:

- `/best/survey-tool`
- later alternatives pages outside the first four anchor brands

Those belong to the next pass after the first forms slice is live.

## Best Page Ranking Model

The first forms buyer-intent page should rank all seven relevant public anchors:

- `typeform`
- `jotform`
- `surveymonkey`
- `formstack`
- `tally`
- `fillout`
- `paperform`

The page should treat them as related but not interchangeable.

The ranking should distinguish between:

- conversational forms
- general-purpose business forms
- survey and research workflows
- workflow and approval-oriented forms
- no-code and creator-friendly form building

Recommended starting order:

1. `typeform`
2. `jotform`
3. `fillout`
4. `tally`
5. `paperform`
6. `surveymonkey`
7. `formstack`

Reasoning:

- Typeform remains the benchmark for form-builder intent
- Jotform is the broadest practical alternative
- Fillout and Tally are strong modern form-builder options
- Paperform is a strong branded/business workflow option
- SurveyMonkey is more survey-specialized
- Formstack is more workflow and operations oriented

## Alternatives Matrix

Use one shared forms competitor pool, but reorder each page based on the anchor tool.

### `/alternatives/typeform`

- `jotform`
- `fillout`
- `tally`
- `paperform`
- `surveymonkey`
- `formstack`

### `/alternatives/jotform`

- `typeform`
- `fillout`
- `tally`
- `paperform`
- `formstack`
- `surveymonkey`

### `/alternatives/surveymonkey`

- `typeform`
- `jotform`
- `formstack`
- `fillout`
- `tally`
- `paperform`

### `/alternatives/formstack`

- `jotform`
- `typeform`
- `fillout`
- `paperform`
- `surveymonkey`
- `tally`

This keeps the same main buyer job while still making each alternatives page feel like a real comparison instead of a copied list.

## Page Architecture

Use the current buyer-intent architecture without introducing a new page model.

### Best page

Use:

- hardcoded entry in `src/server/seo/best-pages.ts`
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

- `/best/online-form-builder`

It does not need dedicated survey links in this first batch.

### Best page

`/best/online-form-builder` should link to:

- all ranked form-builder tool pages
- `/categories/marketing`
- relevant alternatives pages

### Alternatives pages

Each Cluster 4 alternatives page should link to:

- the anchor tool page
- all compared form-builder pages
- `/categories/marketing`
- `/best/online-form-builder`

### Tool pages

Relevant forms and survey tool pages should link to:

- `/categories/marketing`
- `/best/online-form-builder`
- their own alternatives page when one exists

## Buyer-Guide Matching Guardrail

Tool pages must continue using tag-aware buyer-guide matching, not broad category-only matching.

This matters because the `marketing` category now contains:

- Email Marketing
- Forms and Surveys
- later Scheduling and Social Publishing

If tool pages match buyer guides only by broad category, unrelated marketing tools would link to the wrong `/best/*` pages, which would dilute relevance and hurt UX.

The forms rollout should preserve the tag-aware buyer-guide matching behavior already introduced during Cluster 3.

## Content Quality Rules

Do not ship the forms page or alternatives pages unless all ranked or compared tool slugs resolve publicly.

The best page should keep the same depth standard used in prior clusters:

- clear intro
- who it is for
- evaluation criteria
- comparison table
- ranked tools
- FAQ
- internal links

Alternatives pages should feel like real replacements around the same buyer job rather than a mechanically copied list.

## Success Criteria for This Batch

Cluster 4 is successful when:

- `/best/online-form-builder` is live and indexable
- the four Cluster 4 alternatives pages are live and indexable
- the pages use only real public tool slugs
- the marketing category and tool pages reinforce the new forms cluster cleanly
- buyer-guide matching remains tag-aware so unrelated marketing tools do not point at forms pages

## Not Part of This Batch

This rollout does not include:

- `/best/survey-tool`
- expanded Cluster 4 alternatives beyond the first four
- new categories
- cluster 5 implementation work

Those belong to later passes after the first forms slice is live and reviewed.
