# Schema Markup Design

## Purpose
Add a centralized structured-data system for public ShipBoost pages so schema markup stays consistent as the route surface grows.

This slice covers:
- centralized JSON-LD builders for public page types
- route-level schema integration for all current public routes
- explicit robots rules for indexed vs non-indexed routes
- conservative schema selection based on data the app actually has today

This slice does not cover:
- sitemap generation
- robots.txt generation
- Search Console submission workflows
- schema for API routes
- fake review, pricing, or rating enrichment

## Confirmed product decisions
- Use Option 1: centralized schema builders.
- The schema layer should live alongside the existing SEO code in `src/server/seo`.
- All current public routes should be classified and handled.
- Auth pages should be `noindex`.
- Dashboard and admin pages should be non-indexable.
- Indexed pages should only emit schema that matches visible page intent.
- First pass should favor correctness and maintainability over aggressive rich-result targeting.

## Goals
- Create one reusable schema system for current and future public pages.
- Keep route files thin by moving schema construction into shared builders/helpers.
- Align structured data with existing metadata and canonical patterns.
- Avoid invalid or weak markup caused by missing source data.

## Non-goals
- Chasing every Google rich result in the first pass.
- Emitting unsupported or speculative schema fields.
- Adding ratings, reviews, or numeric offer prices without trustworthy source data.
- Modeling hidden internal app flows with schema.

## Current route map

### Indexed public pages
- `/`
- `/launches/[board]`
- `/categories`
- `/categories/[slug]`
- `/tags`
- `/best/tag/[slug]`
- `/alternatives`
- `/alternatives/[slug]`
- `/tools/[slug]`
- `/pricing`
- `/submit`
- `/how-it-works`
- `/launch-guide`
- `/faqs`
- `/about`
- `/contact`
- `/affiliate`
- `/privacy`
- `/terms`

### Non-indexed utility or private pages
- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/dashboard`
- `/dashboard/tools/[toolId]`
- `/admin`
- `not-found`

## Architecture

### 1. Centralized schema builders
Create a shared schema layer under `src/server/seo` built from pure functions.

The layer has three responsibilities:
- define the common JSON-LD types used in the app
- build reusable schema fragments such as organization, breadcrumbs, item lists, and page types
- expose route-friendly helpers that compose those fragments for specific page families

This keeps schema logic out of route files while still letting each route own its data loading.

### 2. Thin route integration
Each route should:
- load its current page data
- call a route-friendly schema helper with that data
- render a small JSON-LD component near the top of the page tree

Route files should not build raw schema objects inline unless there is a one-off page that clearly does not fit existing helpers.

### 3. Conservative data policy
Only emit fields that are visible on the page or can be derived from trusted app data.

Do not emit:
- fake `aggregateRating`
- fake `review`
- fake founder identities
- numeric `Offer.price` without a real price field
- unsupported organization details that are not yet modeled

### 4. Central site identity
Define one canonical source of ShipBoost organization and website identity. This includes:
- site name
- app URL
- logo URL
- support email
- sameAs links only when real URLs exist

This source should be reused by homepage, contact page, and any other route that references the organization.

## File structure

### New files
- `src/components/seo/json-ld.tsx`
  - tiny presentational component for rendering one or more JSON-LD script tags
- `src/server/seo/schema-types.ts`
  - shared input and output types for schema builders
- `src/server/seo/schema-builders.ts`
  - pure builders for common schema fragments and page-level schema objects
- `src/server/seo/site-schema.ts`
  - canonical ShipBoost organization and website constants
- `src/server/seo/page-schema.ts`
  - route-facing helpers that map loaded page data to schema objects
- `src/server/seo/schema-builders.test.ts`
  - focused tests for pure builder behavior
- `src/server/seo/page-schema.test.ts`
  - focused tests for route helper composition

### Modified files
- `src/app/page.tsx`
  - render homepage schema
- `src/app/launches/[board]/page.tsx`
  - render launch board schema
- `src/app/categories/page.tsx`
  - render categories index schema
- `src/app/categories/[slug]/page.tsx`
  - render category detail schema
- `src/app/tags/page.tsx`
  - render tags index schema
- `src/app/best/tag/[slug]/page.tsx`
  - render best-tag schema
- `src/app/alternatives/page.tsx`
  - render alternatives index schema
- `src/app/alternatives/[slug]/page.tsx`
  - render alternatives detail schema
- `src/app/tools/[slug]/page.tsx`
  - render tool detail schema
- `src/app/pricing/page.tsx`
  - render pricing/service schema
- `src/app/how-it-works/page.tsx`
  - render article schema
- `src/app/launch-guide/page.tsx`
  - render article schema
- `src/app/faqs/page.tsx`
  - render FAQ schema
- `src/app/about/page.tsx`
  - render about schema
- `src/app/contact/page.tsx`
  - render contact schema
- `src/app/affiliate/page.tsx`
  - render thin web page schema
- `src/app/privacy/page.tsx`
  - render thin web page schema
- `src/app/terms/page.tsx`
  - render thin web page schema
- `src/app/sign-in/page.tsx`
  - add explicit `robots` noindex metadata
- `src/app/sign-up/page.tsx`
  - add explicit `robots` noindex metadata
- `src/app/forgot-password/page.tsx`
  - add explicit `robots` noindex metadata
- `src/app/reset-password/page.tsx`
  - add explicit `robots` noindex metadata
- `src/app/verify-email/page.tsx`
  - add explicit `robots` noindex metadata
- `src/app/dashboard/page.tsx`
  - add explicit `robots` noindex metadata
- `src/app/dashboard/tools/[toolId]/page.tsx`
  - add explicit `robots` noindex metadata
- `src/app/admin/page.tsx`
  - add explicit `robots` noindex metadata

## Schema selection by route family

### Homepage
Route:
- `/`

Intent:
- primary discovery page
- launch board overview
- entry point for brand understanding and browsing

Schema:
- `Organization`
- `WebSite`
- `CollectionPage`
- `ItemList`

Notes:
- homepage should represent ShipBoost as both an entity and a browse surface
- the item list should represent visible launch items or visible prelaunch items depending on mode

### Launch board pages
Route:
- `/launches/[board]`

Intent:
- browse launches by time period

Schema:
- `CollectionPage`
- `ItemList`
- no breadcrumb schema in the first pass

### Taxonomy and directory index pages
Routes:
- `/categories`
- `/tags`
- `/alternatives`

Intent:
- browse groups of landing pages

Schema:
- `CollectionPage`
- `ItemList`

### Taxonomy and comparison detail pages
Routes:
- `/categories/[slug]`
- `/best/tag/[slug]`
- `/alternatives/[slug]`

Intent:
- browse a curated or grouped collection of tools

Schema:
- `CollectionPage`
- `ItemList`
- `BreadcrumbList`

Notes:
- each visible tool should be represented as a `ListItem` linking to `/tools/[slug]`
- alternatives pages should model the page as a comparison/collection surface, not as a single product page

### Tool detail pages
Route:
- `/tools/[slug]`

Intent:
- evaluate one software product

Schema:
- `SoftwareApplication`
- `BreadcrumbList`

Safe fields from current model:
- `name`
- `description`
- `url`
- `image`
- `applicationCategory`
- `operatingSystem` as `"Web"`
- `keywords` from tags only if useful and not noisy
- `offers` only if represented conservatively from current pricing model rules

Explicit constraints:
- do not emit `aggregateRating`
- do not emit `review`
- do not emit numeric `Offer.price` without real numeric pricing data

Implementation note:
- first pass should prioritize semantic correctness over Google software-app rich-result eligibility
- breadcrumb shape should stay minimal: home -> current tool page

### Pricing page
Route:
- `/pricing`

Intent:
- explain ShipBoost launch options and pricing

Schema:
- `Service`
- nested `OfferCatalog` or nested `Offer` objects for the listed plans

Notes:
- the page is selling launch/distribution services, not a physical or retail product
- free and premium launch tiers can be modeled as offers if values remain truthful and visible on page

### Editorial/help content
Routes:
- `/how-it-works`
- `/launch-guide`

Intent:
- evergreen explanatory content

Schema:
- `Article`
- `BreadcrumbList`

Rationale:
- these are better modeled as content pages than as `HowTo`

### FAQ page
Route:
- `/faqs`

Intent:
- answer common founder questions

Schema:
- `FAQPage`
- `BreadcrumbList`

Rationale:
- semantically correct for the content structure
- treat this as semantic markup, not a promise of FAQ rich results

### Trust and company pages
Routes:
- `/about`
- `/contact`
- `/affiliate`
- `/privacy`
- `/terms`

Schema:
- `/about` -> `AboutPage` and reference to `Organization`
- `/contact` -> `ContactPage` and `Organization` with `contactPoint`
- `/affiliate` -> `WebPage`
- `/privacy` -> `WebPage`
- `/terms` -> `WebPage`

### Conversion page with form
Route:
- `/submit`

Intent:
- encourage product submission and authenticated conversion

Schema:
- simple `WebPage` only

Notes:
- do not force richer schema onto a gated form flow
- this route should remain indexable unless product strategy changes

### Auth, private, and utility pages
Routes:
- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/dashboard`
- `/dashboard/tools/[toolId]`
- `/admin`
- `not-found`

Robots:
- auth pages -> `noindex, follow`
- dashboard and admin pages -> `noindex, nofollow`

Schema:
- none in the first pass

## Robots and metadata policy

### Indexable routes
Use `index, follow` for all public marketing, discovery, trust, and legal routes unless already intentionally excluded.

### Non-indexable routes
Use:
- `noindex, follow` for auth entry pages
- `noindex, nofollow` for authenticated app and admin surfaces

### Canonical alignment
Where a route already computes canonical URLs, use the same canonical in schema `url` fields when the schema describes the page or main entity.

The schema layer should not invent alternate canonicals.

## Builder boundaries

### `schema-builders.ts`
Pure helpers that know nothing about route modules.

Examples:
- `buildBreadcrumbList`
- `buildCollectionPage`
- `buildItemList`
- `buildSoftwareApplication`
- `buildArticle`
- `buildFaqPage`
- `buildWebSite`
- `buildOrganization`

### `page-schema.ts`
ShipBoost-specific page composition helpers.

Examples:
- `buildHomePageSchema`
- `buildLaunchBoardPageSchema`
- `buildCategoryPageSchema`
- `buildBestTagPageSchema`
- `buildAlternativesPageSchema`
- `buildToolPageSchema`
- `buildPricingPageSchema`
- `buildArticlePageSchema`
- `buildFaqsPageSchema`
- `buildAboutPageSchema`
- `buildContactPageSchema`

### Route files
Routes should only:
- load route data
- pass route data into a page helper
- render `<JsonLd />`

## Data mapping rules

### Tool data
Current public tool data includes:
- name
- tagline
- description
- canonical URL
- logo
- screenshots
- categories
- tags
- pricing model
- related links

This is enough for a strong semantic tool schema layer, but not enough for trustworthy review-rich or price-rich markup.

### List pages
List pages should describe visible page items in display order.

For tool lists, each list item should include:
- position
- item URL
- item name

The list should reflect the rendered page ordering rather than a hidden secondary ordering.

### Breadcrumbs
Breadcrumb schema should only reflect stable route hierarchy.

Good candidates:
- home -> categories -> category
- home -> alternatives -> anchor alternatives page
- home -> tags -> best tag page
- home -> tools -> tool, if the UI and helper rules make that hierarchy explicit

Avoid breadcrumbs that imply a hierarchy not represented by the route design.

## Testing

### Unit tests
Add focused unit tests for pure builders:
- correct `@type`
- required fields exist
- optional fields are omitted when unavailable
- item list positions are correct
- breadcrumb ordering is correct

### Helper tests
Add tests for page helpers:
- homepage returns organization and website schema
- tool page returns software application schema
- category, best-tag, and alternatives pages return collection and item list schema
- FAQ page returns question/answer structure
- contact page returns contact page structure and support email

### Route-level verification
For selected high-value routes, assert:
- JSON-LD script is present
- auth routes export `robots` metadata with `noindex`

### Manual verification
After implementation:
- inspect rendered HTML for `/`
- inspect rendered HTML for one tool page
- inspect rendered HTML for one category page
- inspect rendered HTML for `/faqs`
- validate representative pages with Rich Results Test and Schema Markup Validator

## Rollout order
1. Add shared schema infrastructure and tests.
2. Add homepage and tool-page schema.
3. Add collection-page schema to categories, tags, alternatives, and launch boards.
4. Add pricing, article, FAQ, about, and contact schema.
5. Add thin web page schema to legal/disclosure pages.
6. Add noindex metadata to auth, dashboard, and admin pages.
7. Run typecheck, lint, and targeted tests.
8. Validate a representative set of pages manually.

## Risks and guardrails

### Risk: over-marking pages
Guardrail:
- use one primary page intent per route
- keep schema minimal and truthful

### Risk: invalid pricing or review markup
Guardrail:
- do not emit fields that are not explicitly modeled and visible

### Risk: route drift over time
Guardrail:
- centralize route helpers and keep schema tests close to builders

### Risk: duplicated site identity data
Guardrail:
- keep organization/site identity in one shared file

## Follow-on work enabled by this design
- richer tool schema once pricing becomes structured
- founder/profile schema if public founder entities become modeled
- search-result validation automation
- centralized canonical and robots helpers beyond schema work
