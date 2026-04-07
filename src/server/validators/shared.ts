import { z } from "zod";

export const cuidSchema = z.cuid();

export const pricingModelSchema = z.enum([
  "FREE",
  "FREEMIUM",
  "PAID",
  "CUSTOM",
  "CONTACT_SALES",
]);

export const mediaInputSchema = z.object({
  url: z.url(),
  publicId: z.string().trim().min(1).optional(),
  format: z.string().trim().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

