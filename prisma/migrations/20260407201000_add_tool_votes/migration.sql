-- CreateTable
CREATE TABLE "ToolVote" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ToolVote_toolId_userId_key" ON "ToolVote"("toolId", "userId");

-- CreateIndex
CREATE INDEX "ToolVote_toolId_idx" ON "ToolVote"("toolId");

-- CreateIndex
CREATE INDEX "ToolVote_userId_createdAt_idx" ON "ToolVote"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ToolVote" ADD CONSTRAINT "ToolVote_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolVote" ADD CONSTRAINT "ToolVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
