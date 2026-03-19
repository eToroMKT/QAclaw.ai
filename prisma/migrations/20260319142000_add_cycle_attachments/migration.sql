-- CreateTable
CREATE TABLE "CycleAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cycleId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'file',
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CycleAttachment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "TestCycle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CycleAttachment_cycleId_createdAt_idx" ON "CycleAttachment"("cycleId", "createdAt");
