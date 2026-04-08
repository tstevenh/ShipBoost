import { z } from "zod";

export const listingClaimCreateSchema = z.object({
  toolId: z.cuid(),
});

export const listingClaimReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  founderVisibleNote: z.string().trim().max(500).optional(),
  internalAdminNote: z.string().trim().max(1000).optional(),
});

export const listingClaimListQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "CANCELED"])
    .optional(),
});

export type ListingClaimCreateInput = z.infer<typeof listingClaimCreateSchema>;
export type ListingClaimReviewInput = z.infer<typeof listingClaimReviewSchema>;
export type ListingClaimListQuery = z.infer<typeof listingClaimListQuerySchema>;
