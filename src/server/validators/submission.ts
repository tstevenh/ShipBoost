import { z } from "zod";

import {
  cuidSchema,
  mediaInputSchema,
  optionalTrimmedString,
  pricingModelSchema,
} from "@/server/validators/shared";

export const submissionCreateBaseSchema = z.object({
  submissionId: cuidSchema.optional(),
  founderXUrl: z.url().optional(),
  founderGithubUrl: z.url().optional(),
  founderLinkedinUrl: z.url().optional(),
  founderFacebookUrl: z.url().optional(),
  submissionType: z.enum([
    "LISTING_ONLY",
    "FREE_LAUNCH",
    "FEATURED_LAUNCH",
    "RELAUNCH",
  ]),
  requestedSlug: optionalTrimmedString,
  preferredLaunchDate: z.coerce.date().optional(),
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(10).max(140),
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
});

export const submissionCreateFieldsSchema = submissionCreateBaseSchema.omit({
  logo: true,
  screenshots: true,
});

export const submissionCreateSchema = submissionCreateBaseSchema.superRefine(
  (value, ctx) => {
    if (
      value.submissionType === "FEATURED_LAUNCH" &&
      !value.preferredLaunchDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["preferredLaunchDate"],
        message: "Featured launches require a preferred launch date.",
      });
    }
  },
);

export const submissionListQuerySchema = z.object({
  includeAll: z.boolean().optional(),
});

export const adminSubmissionListQuerySchema = z.object({
  search: optionalTrimmedString,
  reviewStatus: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
});

export const submissionReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  founderVisibleNote: optionalTrimmedString,
  internalReviewNote: optionalTrimmedString,
  publishTool: z.boolean().default(true),
  goLiveNow: z.boolean().default(true),
});

export const featuredLaunchCheckoutSchema = z.object({
  submissionId: cuidSchema,
});

export const submissionActionSchema = z.object({
  submissionId: cuidSchema,
});

export const featuredLaunchRescheduleSchema = z.object({
  preferredLaunchDate: z.coerce.date(),
});

export type SubmissionCreateInput = z.infer<typeof submissionCreateSchema>;
export type SubmissionReviewInput = z.infer<typeof submissionReviewSchema>;
export type AdminSubmissionListQueryInput = z.infer<
  typeof adminSubmissionListQuerySchema
>;
export type FeaturedLaunchRescheduleInput = z.infer<
  typeof featuredLaunchRescheduleSchema
>;
