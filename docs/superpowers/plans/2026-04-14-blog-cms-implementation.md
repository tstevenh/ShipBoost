# Blog CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native ShipBoost blog system with public blog pages, Markdown-based article publishing, Cloudinary media uploads, and admin CMS workflows that do not require redeploys.

**Architecture:** Add a blog content domain to the existing Prisma schema, implement blog-focused services and cache loaders under the current `src/server` patterns, then layer public App Router pages and admin API/UI surfaces on top. Keep rendering database-backed with explicit revalidation so publishing from the admin updates `/blog`, article pages, and archive pages immediately.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, PostgreSQL, Zod, Cloudinary, existing ShipBoost admin/auth/cache/SEO utilities

---

## File Structure

### Create
- `prisma/migrations/*_add_blog_cms/migration.sql`
  - schema changes for blog author, article, category, tag, and join table
- `src/server/validators/blog.ts`
  - blog article/category/tag request schemas and shared parsing helpers
- `src/server/services/blog-service.ts`
  - admin CRUD, public queries, related article lookup, publish/archive behavior
- `src/server/services/blog-service.test.ts`
  - focused tests for slug uniqueness, visibility rules, taxonomy rules, and publish behavior
- `src/server/uploads/blog-media.ts`
  - blog-specific Cloudinary upload helpers and validation
- `src/app/api/admin/blog/articles/route.ts`
  - admin article list/create API
- `src/app/api/admin/blog/articles/[articleId]/route.ts`
  - admin article get/update API
- `src/app/api/admin/blog/categories/route.ts`
  - admin blog category list/create API
- `src/app/api/admin/blog/categories/[categoryId]/route.ts`
  - admin blog category update API
- `src/app/api/admin/blog/tags/route.ts`
  - admin blog tag list/create API
- `src/app/api/admin/blog/tags/[tagId]/route.ts`
  - admin blog tag update API
- `src/app/api/admin/blog/media/route.ts`
  - admin inline/cover image upload API
- `src/components/blog/blog-index-page.tsx`
  - public `/blog` page shell
- `src/components/blog/blog-article-page.tsx`
  - public article page shell
- `src/components/blog/blog-archive-page.tsx`
  - reusable category/tag archive renderer
- `src/components/blog/blog-author-card.tsx`
  - author bio block for EEAT signals
- `src/components/admin/blog-panel.tsx`
  - admin blog article list and editor
- `src/components/admin/blog-taxonomy-panel.tsx`
  - admin blog category and tag management
- `src/app/blog/page.tsx`
  - public blog index route
- `src/app/blog/[slug]/page.tsx`
  - public blog article route
- `src/app/blog/category/[slug]/page.tsx`
  - public blog category archive route
- `src/app/blog/tag/[slug]/page.tsx`
  - public blog tag archive route
- `src/app/admin/blog/[articleId]/preview/page.tsx`
  - protected article preview for drafts

### Modify
- `prisma/schema.prisma`
  - add blog enums and models
- `prisma/seed.mjs`
  - seed the single default blog author record
- `src/server/cache/public-content.ts`
  - add blog cache tags, loaders, static params, and revalidation helpers
- `src/app/sitemap.ts`
  - include published blog URLs and live taxonomy archives
- `src/components/content/markdown-content.tsx`
  - render inline images and tighten article-friendly Markdown styling
- `src/components/admin/admin-console.tsx`
  - add blog navigation and integrate the new blog panels
- `src/components/admin/admin-console-shared.tsx`
  - add blog article/category/tag client types and shared API helpers
- `src/server/cloudinary.ts`
  - extend upload helper support for blog cover and inline asset kinds
- `src/server/seo/page-metadata.ts`
  - support article image metadata ergonomics for blog pages
- `src/server/seo/page-schema.ts`
  - add blog article and archive schema helpers
- `src/server/seo/page-schema.test.ts`
  - validate blog schema output
- `src/app/admin/page.tsx`
  - optionally update copy to mention blog operations

### Test
- `src/server/services/blog-service.test.ts`
- `src/server/seo/page-schema.test.ts`
- existing route or component tests only where behavior overlaps shared utilities

---

## Task 1: Add Blog Prisma Models and Seed Data

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.mjs`
- Create: `prisma/migrations/*_add_blog_cms/migration.sql`

- [ ] **Step 1: Add the blog enum and models to Prisma**

```prisma
enum BlogArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model BlogAuthor {
  id          String  @id @default(cuid())
  slug        String  @unique
  name        String
  role        String?
  bio         String
  imageUrl    String?
  xUrl        String?
  linkedinUrl String?
  websiteUrl  String?
  isActive    Boolean @default(true)
  articles    BlogArticle[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model BlogCategory {
  id              String  @id @default(cuid())
  slug            String  @unique
  name            String
  description     String?
  seoIntro        String?
  metaTitle       String?
  metaDescription String?
  isActive        Boolean @default(true)
  sortOrder       Int     @default(0)
  articles        BlogArticle[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model BlogTag {
  id              String  @id @default(cuid())
  slug            String  @unique
  name            String
  description     String?
  metaTitle       String?
  metaDescription String?
  isActive        Boolean @default(true)
  articleTags     BlogArticleTag[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model BlogArticle {
  id                String            @id @default(cuid())
  slug              String            @unique
  title             String
  excerpt           String
  markdownContent   String
  status            BlogArticleStatus @default(DRAFT)
  authorId          String
  primaryCategoryId String
  coverImageUrl     String?
  coverImagePublicId String?
  coverImageAlt     String?
  metaTitle         String?
  metaDescription   String?
  canonicalUrl      String?
  ogImageUrl        String?
  publishedAt       DateTime?
  lastUpdatedAt     DateTime?
  author            BlogAuthor   @relation(fields: [authorId], references: [id])
  primaryCategory   BlogCategory @relation(fields: [primaryCategoryId], references: [id])
  articleTags       BlogArticleTag[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([status, publishedAt])
  @@index([primaryCategoryId, status, publishedAt])
}

model BlogArticleTag {
  id        String   @id @default(cuid())
  articleId String
  tagId     String
  sortOrder Int      @default(0)
  article   BlogArticle @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       BlogTag     @relation(fields: [tagId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([articleId, tagId])
  @@index([tagId])
}
```

- [ ] **Step 2: Generate and inspect the migration**

Run: `npm run db:migrate -- --name add_blog_cms`  
Expected: Prisma creates a new migration adding the blog tables, enum, and indexes without changing unrelated models.

- [ ] **Step 3: Add the default founder author seed**

```js
await prisma.blogAuthor.upsert({
  where: { slug: "tony" },
  update: {
    name: "Tony",
    role: "Founder, ShipBoost",
    bio: "Tony writes about SaaS discovery, launches, founder distribution, and practical SEO.",
    isActive: true,
  },
  create: {
    slug: "tony",
    name: "Tony",
    role: "Founder, ShipBoost",
    bio: "Tony writes about SaaS discovery, launches, founder distribution, and practical SEO.",
    isActive: true,
  },
});
```

- [ ] **Step 4: Regenerate Prisma client**

Run: `npm run prisma:generate`  
Expected: Prisma client regenerates with `BlogArticleStatus`, `BlogAuthor`, `BlogCategory`, `BlogTag`, `BlogArticle`, and `BlogArticleTag`.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations prisma/seed.mjs
git commit -m "feat: add blog CMS schema"
```

## Task 2: Add Blog Validation and Service Tests

**Files:**
- Create: `src/server/validators/blog.ts`
- Create: `src/server/services/blog-service.test.ts`

- [ ] **Step 1: Add request schemas for blog articles and taxonomy**

```ts
import { z } from "zod";

import { optionalTrimmedString } from "@/server/validators/shared";

export const blogArticleCreateSchema = z.object({
  title: z.string().trim().min(5).max(180),
  slug: optionalTrimmedString,
  excerpt: z.string().trim().min(20).max(320),
  markdownContent: z.string().trim().min(20),
  authorId: z.string().trim().min(1),
  primaryCategoryId: z.string().trim().min(1),
  tagIds: z.array(z.string().trim().min(1)).default([]),
  coverImageUrl: optionalTrimmedString,
  coverImagePublicId: optionalTrimmedString,
  coverImageAlt: optionalTrimmedString,
  metaTitle: optionalTrimmedString,
  metaDescription: optionalTrimmedString,
  canonicalUrl: optionalTrimmedString,
  ogImageUrl: optionalTrimmedString,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const blogArticleUpdateSchema = blogArticleCreateSchema.partial();
```

- [ ] **Step 2: Write service tests for critical rules**

```ts
it("publishes an article with publishedAt when status is PUBLISHED", async () => {
  // mock category + author lookup
  // call createAdminBlogArticle with status PUBLISHED
  // expect prisma.blogArticle.create to receive publishedAt
});

it("rejects duplicate article slugs", async () => {
  // mock prisma.blogArticle.findUnique to return an existing article
  // expect createAdminBlogArticle to reject with AppError 409
});

it("hides draft articles from public lookups", async () => {
  // mock prisma.blogArticle.findFirst to return null for draft filters
  // expect getPublishedBlogArticleBySlug("draft-post") to resolve null
});

it("filters inactive tags from public archives", async () => {
  // mock inactive tag result
  // expect getPublicBlogTagPage("stale-tag") to resolve null
});
```

- [ ] **Step 3: Run the new test file to verify failures**

Run: `npm test -- src/server/services/blog-service.test.ts`  
Expected: FAIL because `blog-service.ts` does not exist yet and tested exports are unresolved.

- [ ] **Step 4: Commit**

```bash
git add src/server/validators/blog.ts src/server/services/blog-service.test.ts
git commit -m "test: add blog service contracts"
```

## Task 3: Implement Blog Services

**Files:**
- Create: `src/server/services/blog-service.ts`
- Modify: `src/server/validators/blog.ts`
- Test: `src/server/services/blog-service.test.ts`

- [ ] **Step 1: Add admin list and create/update helpers**

```ts
export async function listAdminBlogArticles(query: {
  search?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  categoryId?: string;
}) {
  return prisma.blogArticle.findMany({
    where: {
      status: query.status,
      primaryCategoryId: query.categoryId,
      OR: query.search
        ? [
            { title: { contains: query.search, mode: "insensitive" } },
            { slug: { contains: query.search, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    include: {
      author: true,
      primaryCategory: true,
      articleTags: { include: { tag: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}
```

- [ ] **Step 2: Normalize publish/archive behavior in one write path**

```ts
function resolveArticleLifecycle(status: BlogArticleStatus) {
  if (status === "PUBLISHED") {
    const now = new Date();
    return { publishedAt: now, lastUpdatedAt: now };
  }

  if (status === "ARCHIVED") {
    return { lastUpdatedAt: new Date() };
  }

  return {};
}
```

- [ ] **Step 3: Add public query helpers**

```ts
export async function getPublishedBlogArticleBySlug(slug: string) {
  return prisma.blogArticle.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      author: true,
      primaryCategory: true,
      articleTags: { include: { tag: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getPublicBlogCategoryPage(slug: string) {
  // load active category with published articles only
}

export async function getPublicBlogTagPage(slug: string) {
  // load active tag with published articles only
}
```

- [ ] **Step 4: Add related article lookup**

```ts
export async function listRelatedPublishedBlogArticles(input: {
  articleId: string;
  categoryId: string;
  tagIds: string[];
  take?: number;
}) {
  return prisma.blogArticle.findMany({
    where: {
      id: { not: input.articleId },
      status: "PUBLISHED",
      OR: [
        { primaryCategoryId: input.categoryId },
        { articleTags: { some: { tagId: { in: input.tagIds } } } },
      ],
    },
    take: input.take ?? 4,
    orderBy: [{ publishedAt: "desc" }],
  });
}
```

- [ ] **Step 5: Run service tests**

Run: `npm test -- src/server/services/blog-service.test.ts`  
Expected: PASS for slug, visibility, taxonomy, and lifecycle behavior.

- [ ] **Step 6: Commit**

```bash
git add src/server/services/blog-service.ts src/server/validators/blog.ts src/server/services/blog-service.test.ts
git commit -m "feat: add blog content services"
```

## Task 4: Add Cache Loaders, Revalidation, Sitemap, and Schema Support

**Files:**
- Modify: `src/server/cache/public-content.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/server/seo/page-schema.ts`
- Modify: `src/server/seo/page-schema.test.ts`

- [ ] **Step 1: Add blog cache tags and public loaders**

```ts
export const PUBLIC_BLOG_REVALIDATE = 900;

export const PUBLIC_CACHE_TAGS = {
  ...PUBLIC_CACHE_TAGS,
  blogIndex: "public:blog:index",
  blogArticles: "public:blog:articles",
  blogCategories: "public:blog:categories",
  blogTags: "public:blog:tags",
} as const;

export const getCachedBlogIndexPage = cache(async () =>
  unstable_cache(() => getPublicBlogIndexPage(), ["public-blog-index", "v1"], {
    revalidate: PUBLIC_BLOG_REVALIDATE,
    tags: [PUBLIC_CACHE_TAGS.blogIndex, PUBLIC_CACHE_TAGS.blogArticles],
  })(),
);
```

- [ ] **Step 2: Add targeted revalidation helpers**

```ts
export function revalidateBlogContent(input: {
  articleSlug?: string;
  categorySlug?: string;
  tagSlugs?: string[];
}) {
  revalidateTag(PUBLIC_CACHE_TAGS.blogIndex, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.blogArticles, "max");
  revalidatePath("/blog");

  if (input.articleSlug) {
    revalidatePath(`/blog/${input.articleSlug}`);
  }

  if (input.categorySlug) {
    revalidatePath(`/blog/category/${input.categorySlug}`);
  }

  for (const slug of input.tagSlugs ?? []) {
    revalidatePath(`/blog/tag/${slug}`);
  }
}
```

- [ ] **Step 3: Extend sitemap with published blog URLs**

```ts
const [blogArticleParams, blogCategoryParams, blogTagParams] = await Promise.all([
  getCachedBlogArticleStaticParams(),
  getCachedBlogCategoryStaticParams(),
  getCachedBlogTagStaticParams(),
]);

const blogRoutes: MetadataRoute.Sitemap = [
  {
    url: toAbsoluteUrl("/blog", appUrl),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  },
  ...blogArticleParams.map(({ slug, updatedAt }) => ({
    url: toAbsoluteUrl(`/blog/${slug}`, appUrl),
    lastModified: updatedAt ?? now,
    changeFrequency: "monthly",
    priority: 0.7,
  })),
];
```

- [ ] **Step 4: Add blog article and archive schema builders**

```ts
export function buildBlogArticleSchema(input: {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: input.canonicalUrl,
    datePublished: input.publishedAt ?? undefined,
    dateModified: input.updatedAt ?? input.publishedAt ?? undefined,
    image: input.imageUrl ?? undefined,
    author: {
      "@type": "Person",
      name: input.authorName,
    },
  };
}
```

- [ ] **Step 5: Run schema tests**

Run: `npm test -- src/server/seo/page-schema.test.ts`  
Expected: PASS with new blog article and archive assertions.

- [ ] **Step 6: Commit**

```bash
git add src/server/cache/public-content.ts src/app/sitemap.ts src/server/seo/page-schema.ts src/server/seo/page-schema.test.ts
git commit -m "feat: add blog cache and seo plumbing"
```

## Task 5: Build Public Blog Routes and Components

**Files:**
- Create: `src/components/blog/blog-index-page.tsx`
- Create: `src/components/blog/blog-article-page.tsx`
- Create: `src/components/blog/blog-archive-page.tsx`
- Create: `src/components/blog/blog-author-card.tsx`
- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx`
- Create: `src/app/blog/category/[slug]/page.tsx`
- Create: `src/app/blog/tag/[slug]/page.tsx`
- Modify: `src/components/content/markdown-content.tsx`
- Modify: `src/server/seo/page-metadata.ts`

- [ ] **Step 1: Extend Markdown rendering for article content**

```tsx
img: ({ src, alt }) => (
  <img
    src={src ?? ""}
    alt={alt ?? ""}
    className="mt-6 w-full rounded-2xl border border-border object-cover"
    loading="lazy"
  />
),
```

- [ ] **Step 2: Build reusable blog page components**

```tsx
export function BlogAuthorCard({ author }: { author: BlogAuthorSummary }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <h2 className="text-xl font-black text-foreground">About the author</h2>
      <p className="mt-3 text-sm text-muted-foreground">{author.bio}</p>
    </section>
  );
}
```

- [ ] **Step 3: Add the blog index route**

```tsx
export default async function BlogPage() {
  const page = await getCachedBlogIndexPage();
  return <BlogIndexPage page={page} />;
}
```

- [ ] **Step 4: Add the article and archive routes**

```tsx
export async function generateMetadata({ params }: RouteContext): Promise<Metadata> {
  const { slug } = await params;
  const article = await getCachedPublishedBlogArticle(slug);

  if (!article) {
    return { title: "Article not found | ShipBoost" };
  }

  return buildPublicPageMetadata({
    title: article.metaTitle ?? `${article.title} | ShipBoost`,
    description: article.metaDescription ?? article.excerpt,
    url: `/blog/${article.slug}`,
    openGraphType: "article",
    twitterCard: article.coverImageUrl ? "summary_large_image" : "summary",
  });
}
```

- [ ] **Step 5: Hide empty or unpublished resources**

Run: `npm test -- src/server/services/blog-service.test.ts`  
Expected: PASS and route code should call `notFound()` for missing public resources.

- [ ] **Step 6: Commit**

```bash
git add src/components/blog src/app/blog src/components/content/markdown-content.tsx src/server/seo/page-metadata.ts
git commit -m "feat: add public blog pages"
```

## Task 6: Add Blog Media Upload Support

**Files:**
- Modify: `src/server/cloudinary.ts`
- Create: `src/server/uploads/blog-media.ts`
- Create: `src/app/api/admin/blog/media/route.ts`

- [ ] **Step 1: Extend Cloudinary upload support for blog assets**

```ts
export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  options: {
    kind: "logo" | "screenshot" | "blog-cover" | "blog-inline";
    filename: string;
  },
)
```

- [ ] **Step 2: Add a blog-specific upload helper**

```ts
export async function uploadBlogImage(file: File, kind: "blog-cover" | "blog-inline") {
  assertValidBlogImageFile(file);

  return uploadImageToCloudinary(Buffer.from(await file.arrayBuffer()), {
    kind,
    filename: file.name,
  });
}
```

- [ ] **Step 3: Add the admin upload route**

```ts
export async function POST(request: NextRequest) {
  await requireAdmin(request);
  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    throw new AppError(400, "Image file is required.");
  }

  const uploaded = await uploadBlogImage(
    file,
    kind === "blog-cover" ? "blog-cover" : "blog-inline",
  );

  return ok({
    ...uploaded,
    markdown: `![${file.name}](${uploaded.url})`,
  });
}
```

- [ ] **Step 4: Verify validation behavior**

Run: `npm run lint src/app/api/admin/blog/media/route.ts src/server/uploads/blog-media.ts src/server/cloudinary.ts`  
Expected: PASS with no type or import errors.

- [ ] **Step 5: Commit**

```bash
git add src/server/cloudinary.ts src/server/uploads/blog-media.ts src/app/api/admin/blog/media/route.ts
git commit -m "feat: add blog media uploads"
```

## Task 7: Add Admin Blog APIs

**Files:**
- Create: `src/app/api/admin/blog/articles/route.ts`
- Create: `src/app/api/admin/blog/articles/[articleId]/route.ts`
- Create: `src/app/api/admin/blog/categories/route.ts`
- Create: `src/app/api/admin/blog/categories/[categoryId]/route.ts`
- Create: `src/app/api/admin/blog/tags/route.ts`
- Create: `src/app/api/admin/blog/tags/[tagId]/route.ts`
- Modify: `src/server/services/blog-service.ts`
- Modify: `src/server/cache/public-content.ts`

- [ ] **Step 1: Add article list/create route**

```ts
export async function GET(request: NextRequest) {
  await requireAdmin(request);
  const query = blogArticleListQuerySchema.parse({
    search: request.nextUrl.searchParams.get("search") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    categoryId: request.nextUrl.searchParams.get("categoryId") ?? undefined,
  });

  return ok(await listAdminBlogArticles(query));
}

export async function POST(request: NextRequest) {
  await requireAdmin(request);
  const body = blogArticleCreateSchema.parse(await request.json());
  const article = await createAdminBlogArticle(body);
  revalidateBlogContent({
    articleSlug: article.slug,
    categorySlug: article.primaryCategory.slug,
    tagSlugs: article.articleTags.map((item) => item.tag.slug),
  });
  return created(article);
}
```

- [ ] **Step 2: Add article update route**

```ts
export async function PATCH(request: NextRequest, context: RouteContext) {
  await requireAdmin(request);
  const body = blogArticleUpdateSchema.parse(await request.json());
  const { articleId } = await context.params;
  const article = await updateAdminBlogArticle(articleId, body);
  revalidateBlogContent({
    articleSlug: article.slug,
    categorySlug: article.primaryCategory.slug,
    tagSlugs: article.articleTags.map((item) => item.tag.slug),
  });
  return ok(article);
}
```

- [ ] **Step 3: Add taxonomy list/create/update routes**

```ts
export async function POST(request: NextRequest) {
  await requireAdmin(request);
  const body = blogCategoryCreateSchema.parse(await request.json());
  return created(await createAdminBlogCategory(body));
}
```

- [ ] **Step 4: Run focused route verification**

Run: `npm run lint src/app/api/admin/blog/articles/route.ts src/app/api/admin/blog/articles/[articleId]/route.ts src/app/api/admin/blog/categories/route.ts src/app/api/admin/blog/tags/route.ts`  
Expected: PASS with route imports and Zod parsing wired correctly.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/blog src/server/services/blog-service.ts src/server/cache/public-content.ts
git commit -m "feat: add admin blog APIs"
```

## Task 8: Add Admin Blog UI and Preview

**Files:**
- Create: `src/components/admin/blog-panel.tsx`
- Create: `src/components/admin/blog-taxonomy-panel.tsx`
- Create: `src/app/admin/blog/[articleId]/preview/page.tsx`
- Modify: `src/components/admin/admin-console.tsx`
- Modify: `src/components/admin/admin-console-shared.tsx`
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add shared client types for blog entities**

```ts
export type BlogArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  updatedAt: string;
  author: { id: string; name: string };
  primaryCategory: { id: string; slug: string; name: string };
  articleTags: Array<{ tag: { id: string; slug: string; name: string } }>;
};
```

- [ ] **Step 2: Add the blog panel UI**

```tsx
<Field label="Markdown body">
  <textarea
    value={draft.markdownContent}
    onChange={(event) =>
      updateDraft({ markdownContent: event.target.value })
    }
    className={textInputClassName()}
    rows={18}
  />
</Field>
```

- [ ] **Step 3: Add inline image upload UX**

```tsx
async function handleInlineImageUpload(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("kind", "blog-inline");

  const result = await apiUpload("/api/admin/blog/media", formData);
  setInlineMarkdownSnippet(result.markdown);
}
```

- [ ] **Step 4: Add preview route using the public article shell**

```tsx
export default async function AdminBlogPreviewPage({ params }: RouteContext) {
  const session = await getServerSession();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/sign-in");
  }

  const article = await getAdminBlogArticleById((await params).articleId);
  if (!article) {
    notFound();
  }

  return <BlogArticlePage article={article} relatedArticles={[]} previewMode />;
}
```

- [ ] **Step 5: Wire admin navigation**

```tsx
const adminNavItems: AdminNavItem[] = [
  { id: "overview", label: "Overview", icon: Layout },
  { id: "moderate", label: "Moderate", icon: Shield, count: totalPending },
  { id: "inventory", label: "Inventory", icon: Package, count: publishedCount },
  { id: "taxonomy", label: "Taxonomy", icon: Layers },
  { id: "blog", label: "Blog", icon: ClipboardList },
];
```

- [ ] **Step 6: Verify admin UX locally**

Run: `npm run lint src/components/admin/blog-panel.tsx src/components/admin/blog-taxonomy-panel.tsx src/components/admin/admin-console.tsx src/app/admin/blog/[articleId]/preview/page.tsx`  
Expected: PASS with no client/server boundary issues.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin src/app/admin src/components/blog
git commit -m "feat: add admin blog cms"
```

## Task 9: Final Verification

**Files:**
- No new files

- [ ] **Step 1: Run the service and schema tests**

Run: `npm test -- src/server/services/blog-service.test.ts src/server/seo/page-schema.test.ts`  
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `npm run lint`  
Expected: PASS

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`  
Expected: PASS

- [ ] **Step 4: Run Prisma seed if local data is needed**

Run: `npm run db:seed`  
Expected: PASS and one default blog author is present.

- [ ] **Step 5: Manual smoke checks**

Run:
- `npm run dev`
- open `/blog`
- open `/blog/category/<slug>`
- open `/blog/tag/<slug>`
- create a draft article in `/admin`
- upload a cover image
- upload an inline image and paste the Markdown snippet
- preview the draft
- publish the article
- verify the article appears on `/blog` without redeploy

Expected:
- public pages render only published content
- admin preview renders drafts
- publishing updates the public blog and archive pages after revalidation

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: launch blog cms"
```

---

## Self-Review

### Spec coverage
- Public blog index, article page, category archive, and tag archive are covered in Tasks 4 and 5.
- Native admin CMS and preview are covered in Tasks 7 and 8.
- Markdown paste workflow and Cloudinary media upload are covered in Tasks 5, 6, and 8.
- Sitemap, schema, metadata, and revalidation are covered in Task 4.
- Single-author EEAT support is covered in Task 1 and surfaced in Task 5.

### Placeholder scan
- No `TBD`, `TODO`, or deferred implementation markers remain in the task list.
- The only intentionally deferred items from the spec are non-goals: scheduling, revision history, and rich editing.

### Type consistency
- Public article status uses `BlogArticleStatus` end-to-end.
- Public routes rely on `slug`, category routes on `primaryCategory.slug`, and tag routes on `tag.slug`.
- The admin flow uses one image API for both `blog-cover` and `blog-inline` so the UI and upload helper share the same contract.
