import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
  $transaction: vi.fn(),
  blogArticle: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  blogArticleTag: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  blogAuthor: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  blogCategory: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  blogTag: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import { AppError } from "@/server/http/app-error";
import {
  createAdminBlogArticle,
  getPublicBlogTagPage,
  getPublishedBlogArticleBySlug,
  updateAdminBlogArticle,
} from "@/server/services/blog-service";

describe("blog-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
  });

  it("publishes an article with publishedAt when status is PUBLISHED", async () => {
    prismaMock.blogAuthor.findFirst.mockResolvedValueOnce({ id: "author_1" });
    prismaMock.blogCategory.findFirst.mockResolvedValueOnce({ id: "category_1" });
    prismaMock.blogArticle.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "article_1",
      slug: "eeat-guide",
      title: "EEAT Guide",
      status: "PUBLISHED",
      publishedAt: new Date("2026-04-14T00:00:00.000Z"),
      updatedAt: new Date("2026-04-14T00:00:00.000Z"),
      author: { id: "author_1", name: "Tony" },
      primaryCategory: { id: "category_1", slug: "seo", name: "SEO" },
      articleTags: [],
    });
    prismaMock.blogArticle.create.mockImplementation(async ({ data }) => ({
      id: "article_1",
      ...data,
    }));

    await createAdminBlogArticle({
      title: "EEAT Guide",
      slug: "eeat-guide",
      excerpt: "A practical guide to building stronger EEAT signals for SaaS content.",
      markdownContent: "## Body\n\nLong enough article body for publishing.",
      authorId: "author_1",
      primaryCategoryId: "category_1",
      tagIds: [],
      coverImageUrl: undefined,
      coverImagePublicId: undefined,
      coverImageAlt: undefined,
      metaTitle: undefined,
      metaDescription: undefined,
      canonicalUrl: undefined,
      ogImageUrl: undefined,
      status: "PUBLISHED",
    });

    expect(prismaMock.blogArticle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PUBLISHED",
          publishedAt: expect.any(Date),
          lastUpdatedAt: expect.any(Date),
        }),
      }),
    );
  });

  it("rejects duplicate article slugs", async () => {
    prismaMock.blogAuthor.findFirst.mockResolvedValueOnce({ id: "author_1" });
    prismaMock.blogCategory.findFirst.mockResolvedValueOnce({ id: "category_1" });
    prismaMock.blogArticle.findUnique.mockResolvedValueOnce({ id: "article_existing" });

    await expect(
      createAdminBlogArticle({
        title: "Duplicate",
        slug: "duplicate-post",
        excerpt: "A sufficiently long excerpt for a duplicate slug test case.",
        markdownContent: "## Body\n\nLong enough markdown to satisfy validation rules.",
        authorId: "author_1",
        primaryCategoryId: "category_1",
        tagIds: [],
        coverImageUrl: undefined,
        coverImagePublicId: undefined,
        coverImageAlt: undefined,
        metaTitle: undefined,
        metaDescription: undefined,
        canonicalUrl: undefined,
        ogImageUrl: undefined,
        status: "DRAFT",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "An article with that slug already exists.",
    } satisfies Partial<AppError>);
  });

  it("loads public article queries using published visibility rules", async () => {
    prismaMock.blogArticle.findFirst.mockResolvedValueOnce(null);

    const article = await getPublishedBlogArticleBySlug("draft-post");

    expect(article).toBeNull();
    expect(prismaMock.blogArticle.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: "draft-post",
          status: "PUBLISHED",
        }),
      }),
    );
  });

  it("filters inactive tags from public archives", async () => {
    prismaMock.blogTag.findFirst.mockResolvedValueOnce(null);

    await expect(getPublicBlogTagPage("stale-tag")).resolves.toBeNull();
    expect(prismaMock.blogTag.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          slug: "stale-tag",
          isActive: true,
        }),
      }),
    );
  });

  it("updates lastUpdatedAt when a published article changes", async () => {
    prismaMock.blogArticle.findUnique
      .mockResolvedValueOnce({
        id: "article_1",
        slug: "published-post",
        title: "Published",
        excerpt: "Existing published article excerpt that is definitely long enough.",
        markdownContent: "Existing body",
        status: "PUBLISHED",
        authorId: "author_1",
        primaryCategoryId: "category_1",
        publishedAt: new Date("2026-04-14T00:00:00.000Z"),
        articleTags: [{ tagId: "tag_1" }],
      })
      .mockResolvedValueOnce({
        id: "article_1",
        slug: "published-post",
        title: "Published",
        status: "PUBLISHED",
        publishedAt: new Date("2026-04-14T00:00:00.000Z"),
        updatedAt: new Date("2026-04-14T01:00:00.000Z"),
        author: { id: "author_1", name: "Tony" },
        primaryCategory: { id: "category_1", slug: "seo", name: "SEO" },
        articleTags: [],
      });
    prismaMock.blogAuthor.findFirst.mockResolvedValueOnce({ id: "author_1" });
    prismaMock.blogCategory.findFirst.mockResolvedValueOnce({ id: "category_1" });
    prismaMock.blogTag.findMany.mockResolvedValueOnce([{ id: "tag_1" }]);
    prismaMock.blogArticle.update.mockResolvedValueOnce({ id: "article_1" });

    await updateAdminBlogArticle("article_1", {
      title: "Published, updated",
    });

    expect(prismaMock.blogArticle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastUpdatedAt: expect.any(Date),
        }),
      }),
    );
  });
});
