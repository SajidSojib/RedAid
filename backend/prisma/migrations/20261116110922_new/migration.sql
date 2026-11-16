-- AlterEnum
ALTER TYPE "BankRequestStatus" ADD VALUE 'WITHDRAWN';

-- AlterTable
ALTER TABLE "bank-requests" ADD COLUMN     "donationRequestId" TEXT;

-- CreateIndex
CREATE INDEX "bank-requests_requesterId_status_idx" ON "bank-requests"("requesterId", "status");

-- AddForeignKey
ALTER TABLE "bank-requests" ADD CONSTRAINT "bank-requests_donationRequestId_fkey" FOREIGN KEY ("donationRequestId") REFERENCES "donation-requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
