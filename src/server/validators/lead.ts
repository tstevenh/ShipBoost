import { z } from "zod";

const optionalTrackingField = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const leadCaptureSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  source: z.string().trim().min(1).max(100),
  leadMagnet: z.string().trim().min(1).max(100),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  utmSource: optionalTrackingField,
  utmMedium: optionalTrackingField,
  utmCampaign: optionalTrackingField,
  utmContent: optionalTrackingField,
  utmTerm: optionalTrackingField,
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
