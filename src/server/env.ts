import { z } from "zod";

const optionalEnvString = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal("").transform(() => undefined));

const envSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url("DATABASE_URL must be a valid Postgres connection string."),
  DIRECT_URL: z.url("DIRECT_URL must be a valid Postgres connection string."),
  BETTER_AUTH_SECRET: z
    .string()
    .trim()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters."),
  BETTER_AUTH_API_KEY: z.string().trim().min(1).optional(),
  GOOGLE_CLIENT_ID: optionalEnvString,
  GOOGLE_CLIENT_SECRET: optionalEnvString,
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  RESEND_API_KEY: optionalEnvString,
  RESEND_LEADS_SEGMENT_ID: optionalEnvString,
  RESEND_SIGNUP_SEGMENT_ID: optionalEnvString,
  POSTHOG_KEY: optionalEnvString,
  POSTHOG_HOST: optionalEnvString,
  RESEND_FROM_TRANSACTIONAL: optionalEnvString.transform(
    (value) => value ?? "ShipBoost <onboarding@resend.dev>",
  ),
  RESEND_REPLY_TO_TRANSACTIONAL: optionalEnvString,
  RESEND_FROM_MARKETING: optionalEnvString,
  LAUNCHPAD_GO_LIVE_AT: z
    .string()
    .trim()
    .datetime({ offset: true })
    .default("2026-05-04T00:00:00Z"),
  FREE_LAUNCH_SLOTS_PER_WEEK: z.coerce.number().int().positive().default(10),
  FOUNDING_PREMIUM_LAUNCH_LIMIT: z.coerce.number().int().positive().default(100),
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().trim().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().trim().min(1).optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().trim().min(1).optional(),
  DODO_PAYMENTS_API_KEY: optionalEnvString,
  DODO_PAYMENTS_WEBHOOK_SECRET: optionalEnvString,
  DODO_PAYMENTS_MODE: z.enum(["test", "live"]).default("test"),
  DODO_PREMIUM_LAUNCH_PRODUCT_ID: optionalEnvString,
  DODO_SPONSOR_PLACEMENT_PRODUCT_ID: optionalEnvString,
  DODO_PAYMENTS_RETURN_URL: optionalEnvString,
  CRON_SECRET: optionalEnvString,
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_NAME: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_PRELAUNCH_MODE: optionalEnvString,
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse({
      APP_ENV: process.env.APP_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_API_KEY: process.env.BETTER_AUTH_API_KEY,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_LEADS_SEGMENT_ID: process.env.RESEND_LEADS_SEGMENT_ID,
      RESEND_SIGNUP_SEGMENT_ID: process.env.RESEND_SIGNUP_SEGMENT_ID,
      POSTHOG_KEY: process.env.POSTHOG_KEY,
      POSTHOG_HOST: process.env.POSTHOG_HOST,
      RESEND_FROM_TRANSACTIONAL: process.env.RESEND_FROM_TRANSACTIONAL,
      RESEND_REPLY_TO_TRANSACTIONAL: process.env.RESEND_REPLY_TO_TRANSACTIONAL,
      RESEND_FROM_MARKETING: process.env.RESEND_FROM_MARKETING,
      LAUNCHPAD_GO_LIVE_AT: process.env.LAUNCHPAD_GO_LIVE_AT,
      FREE_LAUNCH_SLOTS_PER_WEEK: process.env.FREE_LAUNCH_SLOTS_PER_WEEK,
      FOUNDING_PREMIUM_LAUNCH_LIMIT: process.env.FOUNDING_PREMIUM_LAUNCH_LIMIT,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER,
      DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY,
      DODO_PAYMENTS_WEBHOOK_SECRET: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
      DODO_PAYMENTS_MODE: process.env.DODO_PAYMENTS_MODE,
      DODO_PREMIUM_LAUNCH_PRODUCT_ID:
        process.env.DODO_PREMIUM_LAUNCH_PRODUCT_ID,
      DODO_SPONSOR_PLACEMENT_PRODUCT_ID:
        process.env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID,
      DODO_PAYMENTS_RETURN_URL: process.env.DODO_PAYMENTS_RETURN_URL,
      CRON_SECRET: process.env.CRON_SECRET,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_NAME: process.env.ADMIN_NAME,
      NEXT_PUBLIC_PRELAUNCH_MODE: process.env.NEXT_PUBLIC_PRELAUNCH_MODE,
    });
  }

  return cachedEnv;
}
