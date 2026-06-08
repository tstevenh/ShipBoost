-- Add a per-launch flag for the "launch is live" email so sends are idempotent
-- and failed/missed sends can be retried on the next cron run.
ALTER TABLE "Launch" ADD COLUMN "liveEmailSentAt" TIMESTAMP(3);

-- Backfill: treat existing LIVE launches as already-emailed so the new
-- retry logic doesn't re-email founders whose launches went live previously.
UPDATE "Launch" SET "liveEmailSentAt" = "launchDate" WHERE "status" = 'LIVE';
