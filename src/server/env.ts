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
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  RESEND_API_KEY: optionalEnvString,
  POSTHOG_KEY: optionalEnvString,
  POSTHOG_HOST: optionalEnvString,
  RESEND_FROM_TRANSACTIONAL: optionalEnvString.transform(
    (value) => value ?? "Shipboost <onboarding@resend.dev>",
  ),
  RESEND_REPLY_TO_TRANSACTIONAL: optionalEnvString,
  RESEND_FROM_MARKETING: optionalEnvString,
  LEAD_MAGNET_STARTUP_DIRECTORIES_URL: optionalEnvString,
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().trim().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().trim().min(1).optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().trim().min(1).optional(),
  POLAR_ACCESS_TOKEN: optionalEnvString,
  POLAR_WEBHOOK_SECRET: optionalEnvString,
  POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),
  POLAR_FEATURED_LAUNCH_PRODUCT_ID: optionalEnvString,
  POLAR_SUCCESS_URL: optionalEnvString,
  POLAR_RETURN_URL: optionalEnvString,
  CRON_SECRET: optionalEnvString,
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_NAME: z.string().trim().min(1).optional(),
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
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      POSTHOG_KEY: process.env.POSTHOG_KEY,
      POSTHOG_HOST: process.env.POSTHOG_HOST,
      RESEND_FROM_TRANSACTIONAL: process.env.RESEND_FROM_TRANSACTIONAL,
      RESEND_REPLY_TO_TRANSACTIONAL: process.env.RESEND_REPLY_TO_TRANSACTIONAL,
      RESEND_FROM_MARKETING: process.env.RESEND_FROM_MARKETING,
      LEAD_MAGNET_STARTUP_DIRECTORIES_URL:
        process.env.LEAD_MAGNET_STARTUP_DIRECTORIES_URL,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER,
      POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
      POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
      POLAR_SERVER: process.env.POLAR_SERVER,
      POLAR_FEATURED_LAUNCH_PRODUCT_ID:
        process.env.POLAR_FEATURED_LAUNCH_PRODUCT_ID,
      POLAR_SUCCESS_URL: process.env.POLAR_SUCCESS_URL,
      POLAR_RETURN_URL: process.env.POLAR_RETURN_URL,
      CRON_SECRET: process.env.CRON_SECRET,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_NAME: process.env.ADMIN_NAME,
    });
  }

  return cachedEnv;
}
