ALTER TABLE "ToolVote" ADD COLUMN "weight" INTEGER NOT NULL DEFAULT 1;

UPDATE "ToolVote"
SET "weight" = 3
FROM "User"
WHERE "ToolVote"."userId" = "User"."id"
  AND "User"."role" = 'ADMIN';
