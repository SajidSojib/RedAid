-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('FAKE_REQUEST', 'ABUSIVE', 'NO_SHOW', 'WRONG_INFORMATION', 'OTHER');

-- AlterEnum
ALTER TYPE "VerificationStatus" ADD VALUE 'SUSPENDED';

-- AlterTable
ALTER TABLE "blood-banks" ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "category" "ReportCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "reportedBankId" TEXT,
ALTER COLUMN "reportedUserId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT;

-- CreateIndex
CREATE INDEX "reports_reportedBankId_idx" ON "reports"("reportedBankId");

-- CreateIndex
CREATE INDEX "reports_reporterId_createdAt_idx" ON "reports"("reporterId", "createdAt");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedBankId_fkey" FOREIGN KEY ("reportedBankId") REFERENCES "blood-banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
