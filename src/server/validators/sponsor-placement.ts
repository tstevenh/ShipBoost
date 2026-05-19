import { z } from "zod";

import { cuidSchema } from "@/server/validators/shared";

export const sponsorPlacementCheckoutSchema = z
  .object({
    toolId: cuidSchema.optional(),
    placementId: cuidSchema.optional(),
    slot: z
      .enum(["SIDEBAR", "INLINE_BANNER", "INLINE_PRODUCT"])
      .default("SIDEBAR"),
  })
  .superRefine((value, ctx) => {
    if (!value.toolId && !value.placementId) {
      ctx.addIssue({
        code: "custom",
        path: ["toolId"],
        message: "Choose a tool or pending sponsor placement.",
      });
    }

    if (value.toolId && value.placementId) {
      ctx.addIssue({
        code: "custom",
        path: ["placementId"],
        message: "Choose either a tool or pending sponsor placement, not both.",
      });
    }
  });

export const sponsorPlacementDisableSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type SponsorPlacementCheckoutInput = z.infer<
  typeof sponsorPlacementCheckoutSchema
>;
