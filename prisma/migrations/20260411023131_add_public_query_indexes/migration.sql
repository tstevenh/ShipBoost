-- CreateIndex
CREATE INDEX "Launch_status_launchDate_priorityWeight_idx" ON "Launch"("status", "launchDate", "priorityWeight");

-- CreateIndex
CREATE INDEX "Submission_userId_createdAt_idx" ON "Submission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Tool_publicationStatus_moderationStatus_updatedAt_idx" ON "Tool"("publicationStatus", "moderationStatus", "updatedAt");

-- CreateIndex
CREATE INDEX "Tool_publicationStatus_moderationStatus_createdAt_idx" ON "Tool"("publicationStatus", "moderationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "ToolCategory_categoryId_sortOrder_idx" ON "ToolCategory"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "ToolTag_tagId_sortOrder_idx" ON "ToolTag"("tagId", "sortOrder");
