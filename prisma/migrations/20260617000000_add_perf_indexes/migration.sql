-- Performance indexes to reduce sequential scans on growth tables.
-- All additive (CREATE INDEX only); no data or column changes.

-- Hourly conversions export: paid premium launches ordered by paidAt.
CREATE INDEX "Submission_submissionType_paymentStatus_paidAt_idx"
  ON "Submission" ("submissionType", "paymentStatus", "paidAt");

-- Hourly conversions export: paid sponsor placements ordered/windowed by paidAt.
CREATE INDEX "SponsorPlacement_paidAt_idx"
  ON "SponsorPlacement" ("paidAt");

-- Launch prep reminder cron: APPROVED launches with no reminder sent in window.
CREATE INDEX "Launch_status_preLaunchEmailSentAt_launchDate_idx"
  ON "Launch" ("status", "preLaunchEmailSentAt", "launchDate");

-- Free-launch slot scheduling: filter by launchType + status over a date range.
CREATE INDEX "Launch_launchType_status_launchDate_idx"
  ON "Launch" ("launchType", "status", "launchDate");

-- Weekly board weighted vote aggregation: group by toolId over a createdAt window.
CREATE INDEX "ToolVote_toolId_createdAt_idx"
  ON "ToolVote" ("toolId", "createdAt");
