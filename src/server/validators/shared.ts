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

export function normalizeHttpUrl(value: string) {
  let normalized = value.trim();

  while (/^https?:\/\/https?:\/\//i.test(normalized)) {
    normalized = normalized.replace(/^https?:\/\//i, "");
  }

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  const parsed = new URL(normalized);

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("URL must start with http:// or https://.");
  }

  if (parsed.hostname === "http" || parsed.hostname === "https") {
    throw new Error("URL has a duplicated protocol.");
  }

  return normalized;
}

export const websiteUrlSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value, ctx) => {
    try {
      return normalizeHttpUrl(value);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "Enter a valid website URL.",
      });
      return z.NEVER;
    }
  })
  .pipe(z.url());

export const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));
