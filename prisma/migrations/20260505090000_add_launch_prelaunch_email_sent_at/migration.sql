-- Track one-time founder reminder emails sent before a scheduled launch week.
ALTER TABLE "Launch" ADD COLUMN "preLaunchEmailSentAt" TIMESTAMP(3);
