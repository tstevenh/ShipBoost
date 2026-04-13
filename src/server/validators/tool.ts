import { z } from "zod";

import {
  cuidSchema,
  mediaInputSchema,
  optionalTrimmedString,
  pricingModelSchema,
} from "@/server/validators/shared";

export const adminToolCreateSchema = z.object({
  ownerUserId: cuidSchema.optional(),
  slug: optionalTrimmedString,
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(10).max(60),
  websiteUrl: z.url(),
  richDescription: z.string().trim().min(40).max(5000),
  pricingModel: pricingModelSchema,
  categoryIds: z.array(cuidSchema).min(1).max(3),
  tagIds: z.array(cuidSchema).min(1).max(5),
  logo: mediaInputSchema,
  screenshots: z.array(mediaInputSchema).max(3).default([]),
  affiliateUrl: z.url().optional(),
  affiliateSource: optionalTrimmedString,
  hasAffiliateProgram: z.boolean().default(false),
  founderXUrl: z.url().optional(),
  founderGithubUrl: z.url().optional(),
  founderLinkedinUrl: z.url().optional(),
  founderFacebookUrl: z.url().optional(),
  metaTitle: optionalTrimmedString,
  metaDescription: optionalTrimmedString,
  canonicalUrl: z.url().optional(),
  internalNote: optionalTrimmedString,
  isFeatured: z.boolean().default(false),
  publish: z.boolean().default(false),
});

export const adminToolUpdateSchema = adminToolCreateSchema
  .partial()
  .extend({
    moderationStatus: z
      .enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "HIDDEN"])
      .optional(),
    publicationStatus: z
      .enum(["UNPUBLISHED", "PUBLISHED", "ARCHIVED"])
      .optional(),
    launchBadgeRequired: z.boolean().optional(),
    badgeVerification: z
      .enum(["NOT_REQUIRED", "PENDING", "VERIFIED", "FAILED"])
      .optional(),
  });

export const adminToolListQuerySchema = z.object({
  search: optionalTrimmedString,
  moderationStatus: z
    .enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "HIDDEN"])
    .optional(),
  publicationStatus: z
    .enum(["UNPUBLISHED", "PUBLISHED", "ARCHIVED"])
    .optional(),
});

export const founderToolUpdateSchema = z.object({
  slug: optionalTrimmedString,
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(10).max(60),
  websiteUrl: z.url(),
  richDescription: z.string().trim().min(40).max(5000),
  pricingModel: pricingModelSchema,
  categoryIds: z.array(cuidSchema).min(1).max(3),
  tagIds: z.array(cuidSchema).min(1).max(5),
  logo: mediaInputSchema.optional(),
  screenshots: z.array(mediaInputSchema).max(3).optional(),
  hasAffiliateProgram: z.boolean().default(false),
  founderXUrl: z.url().optional(),
  founderGithubUrl: z.url().optional(),
  founderLinkedinUrl: z.url().optional(),
  founderFacebookUrl: z.url().optional(),
  existingScreenshotIds: z.array(cuidSchema).max(3).default([]),
});

export type AdminToolCreateInput = z.infer<typeof adminToolCreateSchema>;
export type AdminToolUpdateInput = z.infer<typeof adminToolUpdateSchema>;
export type FounderToolUpdateInput = z.infer<typeof founderToolUpdateSchema>;
