# Discovery + SEO Design

## Purpose
Implement the first discovery layer for the SaaS launch directory without adding admin CMS complexity.

This slice covers:
- homepage hero search with modal results
- public search backend for published tools
- code-managed SEO pages for manual alternatives and best-by-tag pages
- metadata and route behavior needed for those pages

This slice does not cover:
- a dedicated search results page
- admin-editable SEO page records
- newsletter lead capture
- upvotes
- click tracking
- sitemap, robots, or structured data beyond what is directly needed for the new pages

## Confirmed product decisions
- Search is available from the homepage hero only.
- Search opens in a modal, not a dedicated page.
- Search results update live with a short debounce.
- Search only includes published tools.
- The query state should still be reflected in `/?q=...` so the modal state is reload-safe and linkable.
- Category pages remain canonical at `/categories/[slug]`.
- New SEO pages for this slice are:
  - `/alternatives/[tool-slug]`
  - `/best/tag/[tag-slug]`
- Alternatives pages are fully manual only.
- SEO page copy/config is stored in the codebase, not the admin dashboard.
- SEO content is managed through typed registry files plus DB lookups for tool records.

## Goals
- Let users quickly discover published tools from the homepage.
- Create scalable SEO page primitives without introducing a new database model or admin surface.
- Keep editorial control high for the first SEO page set.
- Reuse existing tool/category/tag data where possible.

## Non-goals
- Automatic related-tool selection.
- Search across launches, founders, or submissions.
- Search analytics or click tracking in this slice.
- Generic SEO CMS infrastructure.

## Architecture

### 1. Homepage search
The homepage hero includes a search trigger that opens a modal. The modal contains:
- a search input
- a loading state
- an empty/default state before typing
- a no-results state
- a compact result list of published tools

The client debounces user input and requests matching tools from a public API route. The route returns a small, ranked result set optimized for typeahead behavior rather than full search exploration.

The homepage syncs the active query to `?q=`. If the page loads with a non-empty `q`, the modal opens automatically and hydrates results for that query.

### 2. Search backend
Add a public search endpoint dedicated to homepage typeahead. The endpoint:
- accepts a query string
- trims and validates minimum length of 2 characters
- returns published tools only
- searches across:
  - tool name
  - tool tagline
  - category name
  - tag name

Ranking should stay simple and deterministic for MVP:
1. exact or prefix name matches
2. partial name matches
3. tagline matches
4. category/tag matches
5. secondary stable ordering by featured status and name

The endpoint should cap results to a small number suitable for a modal, such as 6 to 8 records.

### 3. SEO content registry
Create typed code-managed registry files for SEO page definitions. These files live in the repo and are the source of truth for:
- page copy
- metadata
- FAQ content
- manually selected tool slugs

Recommended structure:
- one registry for alternatives pages keyed by tool slug
- one registry for best-by-tag pages keyed by tag slug

Each registry entry should support:
- title / heading
- intro copy
- meta title
- meta description
- optional FAQ items
- ordered tool slug list
- optional supporting section copy if needed later

The registry should be validated at compile time through TypeScript types, not a runtime admin form.

### 4. SEO page query layer
Add a small shared query layer that:
- resolves the relevant registry entry
- fetches the referenced tools from Prisma
- filters out unpublished or missing tools
- preserves the configured order from the registry
- returns a normalized page view model for rendering

This layer should not try to infer related tools automatically. If a page has no registry entry, the route returns `404`.

If some configured tool slugs do not resolve to published tools, the page still renders with the remaining valid tools.

### 5. Public routes

#### `/alternatives/[tool-slug]`
Displays a code-managed alternatives page for a specific tool. The page uses the registry entry for copy and tool ordering. The source tool is shown as the anchor context at the top of the page, while the comparison set remains fully manual.

If the source tool exists but there is no registry entry, return `404`. This prevents thin auto-generated pages.

#### `/best/tag/[tag-slug]`
Displays a code-managed best-by-tag page. The page copy and selected tools come from the registry, while the tool cards themselves use live DB records.

If there is no registry entry for the tag slug, return `404`.

#### `/categories/[slug]`
The existing route remains canonical. This slice may improve metadata generation and internal linking there, but it does not change the route design.

## UI behavior

### Homepage search modal
- Opens from the homepage hero only.
- Supports keyboard focus on open.
- Closes via escape, overlay click, or close button.
- Uses debounced live search.
- Shows a compact result item with:
  - logo
  - tool name
  - tagline
  - optional category or tag context
  - link to `/tools/[slug]`

The modal should feel like a utility surface, not a full-screen destination.

### SEO pages
Use a shared rendering pattern where possible:
- hero/title section
- editorial intro
- list of curated tool cards
- optional FAQ block
- internal links to related categories, tools, or adjacent discovery surfaces when available

The pages should not look auto-generated. Copy is editorial and code-managed by design.

## Data contracts

### Search result shape
Each result should expose only what the modal needs:
- `id`
- `slug`
- `name`
- `tagline`
- `logoUrl`
- `isFeatured`
- lightweight category labels
- lightweight tag labels if needed

### SEO registry entry shape
Each entry should include:
- `slug`
- `title`
- `intro`
- `metaTitle`
- `metaDescription`
- `toolSlugs`
- `faq` as optional structured items

Alternatives entries should also reference the anchor tool slug explicitly, even if the key already matches it. That keeps the type clear and avoids ambiguity later.

## Error handling
- Empty query: show an idle state and avoid requesting results.
- Query shorter than 2 characters: do not issue a search request and keep the modal in its idle state.
- Search API failure: show a generic search error state in the modal without breaking the homepage.
- Missing SEO registry entry: return `404`.
- Missing configured tools: omit invalid tools and continue rendering.
- Zero valid tools after filtering: return `404` rather than rendering a thin page.

## Testing

### Search
- service-level coverage for matching on:
  - name
  - tagline
  - category
  - tag
- only published tools are returned
- ranking is stable enough for prefix and exact name matches

### Homepage modal
- `?q=` opens the modal on load
- debounce-driven requests update results
- empty and no-results states render correctly

### SEO pages
- configured alternatives page renders expected tools in configured order
- configured best-by-tag page renders expected tools in configured order
- missing registry entries return `404`
- unpublished tools are excluded
- pages with no remaining valid tools return `404`

### Metadata
- new SEO pages emit correct title and description
- canonical behavior is preserved for `/categories/[slug]`

## Implementation notes
- Reuse existing tool service patterns where sensible, but do not overload admin search methods with public search concerns.
- Keep the SEO registry and page query layer separate from route components so additional page families can be added later without copying logic.
- Avoid introducing a Prisma `SeoPage` model in this slice.

## Follow-on work enabled by this design
- sitemap generation from the registry plus DB-backed public routes
- structured data per SEO page type
- richer metadata helpers
- homepage featured sections tied to real editorial registries
- eventual expansion to code-managed category landing variants or a lightweight CMS if needed
