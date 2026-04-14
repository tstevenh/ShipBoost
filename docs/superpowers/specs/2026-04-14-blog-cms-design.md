# Blog CMS Design

## Purpose
Add a database-backed blog system to ShipBoost that improves SEO and EEAT while letting articles be published from the admin dashboard without redeploying the app.

This slice covers:
- public blog index, article, category archive, and tag archive pages
- a native ShipBoost admin CMS for article publishing
- Markdown-based article storage and rendering
- Cloudinary-powered cover and inline image uploads
- metadata, schema markup, sitemap inclusion, and internal-linking support
- cache and revalidation behavior for fast publishing without build-time coupling

This slice does not cover:
- scheduled publishing
- revision history
- collaborative editing
- multiple authors in the UI
- WYSIWYG or Notion-style editing
- comments, likes, or newsletter workflows tied to blog posts

## Confirmed product decisions
- The CMS should be native to ShipBoost, not a separate headless CMS.
- The primary author is a single real person for now.
- The publishing workflow is `draft -> published -> archived`.
- Articles should use stable URLs at `/blog/[slug]`.
- Each article has exactly one primary category.
- Each article can have multiple tags.
- Both category and tag archive pages should be public and crawlable.
- Markdown paste is the primary editorial workflow.
- Cover image upload and inline image upload should both be supported.
- The public blog should be database-backed with cache revalidation, not build-time-only SSG.

## Goals
- Publish new articles without redeploying the site.
- Make article pages fast and crawlable.
- Improve trust signals with visible authorship, dates, and structured metadata.
- Keep the editorial workflow simple for AI-generated Markdown.
- Reuse ShipBoost’s current auth, Prisma, admin, Cloudinary, and cache patterns.

## Non-goals
- Building a rich editor before the content model is proven.
- Supporting arbitrary taxonomy sprawl with weak archive pages.
- Introducing a second operational system for content management.
- Modeling enterprise editorial workflows before content velocity justifies them.

## Public route map

### Blog index
Route:
- `/blog`

Purpose:
- primary editorial hub
- strongest internal-linking surface for the blog
- entry point for category and tag exploration

Content:
- intro section describing the blog’s expertise area
- featured article slot
- latest articles grid
- category rail
- selected tag links

SEO:
- `CollectionPage` schema
- unique title and meta description
- crawlable index page with stable internal links

### Article page
Route:
- `/blog/[slug]`

Purpose:
- canonical article destination

Content:
- title
- excerpt
- cover image
- published date
- updated date
- author box
- primary category
- tags
- Markdown body
- related articles

SEO:
- `Article` schema
- canonical URL
- OG/Twitter metadata from article data
- visible author and update information for EEAT

### Category archive
Route:
- `/blog/category/[slug]`

Purpose:
- primary topic cluster page

Content:
- category title and intro copy
- optional category description for search intent framing
- articles in that category

SEO:
- `CollectionPage` schema
- category pages should be treated as high-value archive pages, not thin filters

### Tag archive
Route:
- `/blog/tag/[slug]`

Purpose:
- secondary discovery archive

Content:
- tag title
- short intro copy
- list of tagged articles

SEO:
- `CollectionPage` schema
- lower priority than category pages
- only useful if tags are curated and kept meaningful

## Rendering and caching strategy

### Chosen approach
Use database-backed server-rendered pages with ISR-style caching and explicit invalidation.

This means:
- article and archive pages read from Postgres through server loaders
- those loaders are wrapped in `unstable_cache` and tagged similarly to current public content loaders
- admin mutations call `revalidateTag` and `revalidatePath` immediately after writes
- new content becomes visible without redeploying

### Why not build-time SSG
Build-time-only SSG conflicts with the product goal because every new article would require a build and deploy. That creates unnecessary friction, slower publishing, and operational coupling to deployment health.

### Fallback revalidation windows
- `/blog`: 10-15 minutes
- `/blog/category/[slug]`: 15-30 minutes
- `/blog/tag/[slug]`: 15-30 minutes
- `/blog/[slug]`: 1-6 hours

These windows are only safety nets. Publishing and edits should rely on immediate explicit revalidation.

## Content model

### New enums
- `BlogArticleStatus`
  - `DRAFT`
  - `PUBLISHED`
  - `ARCHIVED`

### New models

#### `BlogAuthor`
Purpose:
- represent a real author profile that can be reused by articles

Fields:
- `id`
- `slug`
- `name`
- `role`
- `bio`
- `imageUrl`
- `xUrl`
- `linkedinUrl`
- `websiteUrl`
- `isActive`
- `createdAt`
- `updatedAt`

Notes:
- v1 can seed one author record for the current founder
- article pages still reference an author explicitly so the model scales later without restructuring

#### `BlogCategory`
Purpose:
- one primary category per article

Fields:
- `id`
- `slug`
- `name`
- `description`
- `seoIntro`
- `metaTitle`
- `metaDescription`
- `isActive`
- `sortOrder`
- `createdAt`
- `updatedAt`

#### `BlogTag`
Purpose:
- reusable article tags

Fields:
- `id`
- `slug`
- `name`
- `description`
- `metaTitle`
- `metaDescription`
- `isActive`
- `createdAt`
- `updatedAt`

#### `BlogArticle`
Purpose:
- store the canonical article source and publishing metadata

Fields:
- `id`
- `slug`
- `title`
- `excerpt`
- `markdownContent`
- `status`
- `authorId`
- `primaryCategoryId`
- `coverImageUrl`
- `coverImagePublicId`
- `coverImageAlt`
- `metaTitle`
- `metaDescription`
- `canonicalUrl`
- `ogImageUrl`
- `publishedAt`
- `lastUpdatedAt`
- `createdAt`
- `updatedAt`

Rules:
- `slug` unique
- `primaryCategoryId` required
- `publishedAt` required when status is `PUBLISHED`
- `lastUpdatedAt` should be set whenever published content changes materially

#### `BlogArticleTag`
Purpose:
- join table for many-to-many article tags

Fields:
- `id`
- `articleId`
- `tagId`
- `sortOrder`
- `createdAt`

Constraints:
- unique on `articleId + tagId`

### Optional v1 field
`readingMinutes`

Recommendation:
- derive this at read time from Markdown content instead of storing it initially

## Author strategy
Use a dedicated `BlogAuthor` model even though there is only one current author.

Reasoning:
- keeps public article authorship explicit
- avoids coupling article content to auth-user lifecycle
- supports future multiple-authors or guest-post scenarios cleanly
- allows a controlled public-facing bio instead of exposing all `User` profile data

## Markdown strategy

### Source of truth
Store the raw Markdown in `BlogArticle.markdownContent`.

### Rendering
Reuse and extend the current Markdown renderer under `src/components/content`.

Expected enhancements:
- support `img` rendering with proper styling
- preserve code blocks and tables
- render headings consistently for long-form articles

### Editorial workflow
Primary workflow:
- paste Markdown into the admin CMS

Secondary support:
- optional frontmatter parsing later if needed

Not in v1:
- rich text editor
- drag-and-drop section blocks

## Cloudinary media workflow

### Cover image
Cover image is a dedicated article field and drives:
- blog cards
- article hero
- OG/Twitter image fallback

### Inline images
Admin should provide a utility uploader:
- choose image
- upload to Cloudinary
- receive secure URL
- optionally insert ready-made Markdown image syntax into the textarea

### Upload behavior
Reuse the current Cloudinary integration pattern from `src/server/cloudinary.ts` and `src/server/uploads/submission-media.ts`.

Recommended refinement:
- add a blog-specific upload helper and folder convention such as:
  - `shipboost/blog/covers`
  - `shipboost/blog/inline`

This avoids mixing tool-submission assets with editorial content.

## Admin CMS design

### Navigation
Extend the existing admin console with a new content section for blog operations.

Recommended nav additions:
- `Blog`
- `Blog categories`
- `Blog tags`

### Article list view
Needs:
- search by title or slug
- filter by status
- filter by primary category
- quick counts for draft, published, archived
- edit and archive actions

### Article editor
Fields:
- title
- slug
- excerpt
- primary category
- tags
- cover image upload
- cover image alt text
- Markdown body
- SEO title
- SEO description
- canonical URL override

Utilities:
- live slug suggestion from title
- inline image uploader
- preview tab

Actions:
- save draft
- publish
- archive

### Preview behavior
Preview should render the same public article shell used by `/blog/[slug]`, but behind admin access for draft content.

Recommended implementation:
- a dedicated admin preview route such as `/admin/blog/[articleId]/preview`
- uncached or minimally cached
- draft-safe

## Public page composition

### Blog index composition
- hero or intro section
- featured article
- latest articles grid
- category list with article counts
- optional tag strip

### Article composition
- hero with cover image and metadata
- category and tag links near the top
- Markdown content body
- author box beneath or beside article body
- related articles section based primarily on same-category matches

### Category archive composition
- strong intro copy
- curated or newest-first article list
- links to adjacent categories where useful

### Tag archive composition
- compact intro
- newest-first article list

## SEO and EEAT requirements

### Metadata
Each article needs:
- unique title
- unique meta description
- canonical URL
- OG image

Archive pages need:
- unique title and meta description
- canonical URL

### Schema
Add route-level schema using the existing `src/server/seo` system.

Recommended schema:
- `/blog`: `CollectionPage`
- `/blog/[slug]`: `Article` with author and publish/update dates
- `/blog/category/[slug]`: `CollectionPage`
- `/blog/tag/[slug]`: `CollectionPage`

### EEAT signals on article pages
- visible real author name
- author bio and image
- published date
- updated date
- category context
- strong internal links to relevant ShipBoost pages where editorially justified

### Internal linking policy
- every article links to its primary category page
- every article displays tag links
- article pages show related posts, weighted toward the same primary category
- the blog index links to key categories
- category pages surface strongest articles first once enough content exists

## Sitemap and robots behavior

### Sitemap
Update `src/app/sitemap.ts` to include:
- `/blog`
- all published article URLs
- all active category archive URLs with at least one published article
- all active tag archive URLs with at least one published article

### Robots
- public blog routes are indexable
- admin preview routes are `noindex`
- draft or archived articles must never be reachable through the public sitemap

## Server architecture

### New service layer
Create a dedicated blog service layer parallel to current catalog and tool services.

Recommended responsibilities:
- admin article CRUD
- category and tag CRUD
- public article lookup
- public archive listing
- related article lookup
- author lookup

### New cache layer
Extend `src/server/cache/public-content.ts` with blog-specific loaders and tags.

Recommended tags:
- `public:blog:index`
- `public:blog:articles`
- `public:blog:categories`
- `public:blog:tags`
- `public:blog:article:[slug]`
- `public:blog:category:[slug]`
- `public:blog:tag:[slug]`

### Revalidation behavior
Publishing or editing an article should revalidate:
- `/blog`
- `/blog/[slug]`
- `/blog/category/[primaryCategorySlug]`
- `/blog/tag/[slug]` for all attached tags
- sitemap and blog cache tags

Archiving an article should revalidate the same surfaces.

Taxonomy edits should revalidate:
- affected archive page
- `/blog`
- related article pages if labels or slugs changed

## API surface

### Admin article APIs
Recommended routes:
- `GET /api/admin/blog/articles`
- `POST /api/admin/blog/articles`
- `GET /api/admin/blog/articles/[articleId]`
- `PATCH /api/admin/blog/articles/[articleId]`

### Admin taxonomy APIs
Recommended routes:
- `GET /api/admin/blog/categories`
- `POST /api/admin/blog/categories`
- `PATCH /api/admin/blog/categories/[categoryId]`
- `GET /api/admin/blog/tags`
- `POST /api/admin/blog/tags`
- `PATCH /api/admin/blog/tags/[tagId]`

### Admin media API
Recommended route:
- `POST /api/admin/blog/media`

Behavior:
- accept one image at a time
- validate MIME type and file size
- upload to the blog-specific Cloudinary folder
- return URL, public ID, dimensions, and a convenience Markdown snippet

## File structure

### New files
- `src/app/blog/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/blog/category/[slug]/page.tsx`
- `src/app/blog/tag/[slug]/page.tsx`
- `src/app/admin/blog/page.tsx` or integrate into existing admin shell
- `src/app/admin/blog/[articleId]/preview/page.tsx`
- `src/app/api/admin/blog/articles/route.ts`
- `src/app/api/admin/blog/articles/[articleId]/route.ts`
- `src/app/api/admin/blog/categories/route.ts`
- `src/app/api/admin/blog/categories/[categoryId]/route.ts`
- `src/app/api/admin/blog/tags/route.ts`
- `src/app/api/admin/blog/tags/[tagId]/route.ts`
- `src/app/api/admin/blog/media/route.ts`
- `src/components/admin/blog-articles-panel.tsx`
- `src/components/admin/blog-category-panel.tsx`
- `src/components/admin/blog-tag-panel.tsx`
- `src/components/blog/blog-index.tsx`
- `src/components/blog/blog-article-page.tsx`
- `src/components/blog/blog-archive-page.tsx`
- `src/components/blog/blog-author-card.tsx`
- `src/server/services/blog-service.ts`
- `src/server/validators/blog.ts`

### Modified files
- `prisma/schema.prisma`
- `src/app/admin/page.tsx` if the entry copy or navigation needs blog mentions
- `src/components/admin/admin-console.tsx`
- `src/components/admin/admin-console-shared.tsx`
- `src/components/content/markdown-content.tsx`
- `src/server/cache/public-content.ts`
- `src/app/sitemap.ts`
- `src/server/seo/page-metadata.ts`
- `src/server/seo/page-schema.ts`
- related test files and new blog-focused tests

## Error handling

### Admin validation
- reject empty title, slug, excerpt, body, or missing category
- reject duplicate slugs
- reject invalid or inactive taxonomy references
- reject invalid image MIME types and oversize uploads

### Public behavior
- unpublished or archived article slugs return `notFound()`
- empty archive pages for inactive or nonexistent taxonomy return `notFound()`
- active taxonomy with zero published articles can either render a thin archive or 404; v1 should prefer `notFound()` to avoid thin SEO pages

## Testing strategy

### Service tests
- article create, update, publish, archive
- taxonomy assignment rules
- public article visibility rules
- related article selection

### Route tests
- admin APIs require admin
- media upload validation paths
- public article routes hide draft and archived content

### SEO tests
- metadata generation for article and archive pages
- schema generation for article and collection pages
- sitemap inclusion only for published content

### UI tests
- article editor form interactions
- preview rendering from Markdown
- admin list filtering

## Rollout recommendation

### Phase 1
- schema and migrations
- service layer
- public blog routes
- sitemap and metadata

### Phase 2
- admin article CMS
- category and tag management
- media upload utility
- preview flow

This ordering keeps the public rendering model and data contracts stable before layering in the admin UI.

## Recommended implementation choices
- Use Prisma models for blog content in the existing database.
- Keep article slugs independent of categories.
- Reuse the existing admin shell instead of building a second admin surface.
- Use explicit cache invalidation on mutations.
- Use a dedicated public author model instead of binding articles directly to auth users.
- Keep Markdown as the only source format for v1.
