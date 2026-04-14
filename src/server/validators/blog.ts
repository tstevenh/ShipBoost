import { z } from "zod";

import { optionalTrimmedString } from "@/server/validators/shared";

export const blogArticleStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);

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
  status: blogArticleStatusSchema.default("DRAFT"),
});

export const blogArticleUpdateSchema = blogArticleCreateSchema.partial();

export const blogArticleListQuerySchema = z.object({
  search: optionalTrimmedString,
  status: blogArticleStatusSchema.optional(),
  categoryId: optionalTrimmedString,
});

export const blogCategoryCreateSchema = z.object({
  slug: optionalTrimmedString,
  name: z.string().trim().min(2).max(60),
  description: optionalTrimmedString,
  seoIntro: optionalTrimmedString,
  metaTitle: optionalTrimmedString,
  metaDescription: optionalTrimmedString,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const blogCategoryUpdateSchema = blogCategoryCreateSchema.partial();

export const blogTagCreateSchema = z.object({
  slug: optionalTrimmedString,
  name: z.string().trim().min(2).max(60),
  description: optionalTrimmedString,
  metaTitle: optionalTrimmedString,
  metaDescription: optionalTrimmedString,
  isActive: z.boolean().default(true),
});

export const blogTagUpdateSchema = blogTagCreateSchema.partial();

export type BlogArticleCreateInput = z.infer<typeof blogArticleCreateSchema>;
export type BlogArticleUpdateInput = z.infer<typeof blogArticleUpdateSchema>;
export type BlogArticleListQuery = z.infer<typeof blogArticleListQuerySchema>;
export type BlogCategoryCreateInput = z.infer<typeof blogCategoryCreateSchema>;
export type BlogCategoryUpdateInput = z.infer<typeof blogCategoryUpdateSchema>;
export type BlogTagCreateInput = z.infer<typeof blogTagCreateSchema>;
export type BlogTagUpdateInput = z.infer<typeof blogTagUpdateSchema>;
