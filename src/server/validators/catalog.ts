import { z } from "zod";

import { optionalTrimmedString } from "@/server/validators/shared";

export const categoryCreateSchema = z.object({
  slug: optionalTrimmedString,
  name: z.string().trim().min(2).max(60),
  description: optionalTrimmedString,
  seoIntro: optionalTrimmedString,
  metaTitle: optionalTrimmedString,
  metaDescription: optionalTrimmedString,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const tagCreateSchema = z.object({
  slug: optionalTrimmedString,
  name: z.string().trim().min(2).max(60),
  description: optionalTrimmedString,
  isActive: z.boolean().default(true),
});

export const tagUpdateSchema = tagCreateSchema.partial();

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type TagCreateInput = z.infer<typeof tagCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type TagUpdateInput = z.infer<typeof tagUpdateSchema>;
