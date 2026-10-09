/*
  Warnings:

  - A unique constraint covering the columns `[donorId,upazilaId,unionId]` on the table `donor-service-areas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `upazilaId` to the `donor-service-areas` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BankRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('NORMAL', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'FULFILLED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('NOTIFIED', 'ACCEPTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_REQUEST', 'REQUEST_FILLED', 'DONOR_ACCEPTED', 'ELIGIBLE_AGAIN', 'BANK_REQUEST_UPDATE', 'BANK_VERIFICATION', 'ACHIEVEMENT', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "AchievementKind" AS ENUM ('BADGE', 'CERTIFICATE');

-- CreateEnum
CREATE TYPE "CodeName" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'DIAMOND', 'PLATINUM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'DISMISSED', 'ACTION_TAKEN');

-- DropIndex
DROP INDEX "donor-service-areas_donorId_idx";

-- DropIndex
DROP INDEX "donor-service-areas_donorId_unionId_key";

-- AlterTable
ALTER TABLE "donor-service-areas" ADD COLUMN     "upazilaId" TEXT NOT NULL,
ALTER COLUMN "unionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "donationCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "blood-banks" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "upazilaId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationNote" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blood-banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blood-inventory" (
    "bankId" TEXT NOT NULL,
    "bloodType" "BloodType" NOT NULL,
    "unitsAvailable" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blood-inventory_pkey" PRIMARY KEY ("bankId","bloodType")
);

-- CreateTable
CREATE TABLE "bank-requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "bloodType" "BloodType" NOT NULL,
    "unitsRequested" INTEGER NOT NULL,
    "status" "BankRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank-requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation-requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "patientName" TEXT,
    "hospitalName" TEXT,
    "contactPhone" TEXT,
    "note" TEXT,
    "bloodType" "BloodType" NOT NULL,
    "unitsNeeded" INTEGER NOT NULL,
    "unitsAccepted" INTEGER NOT NULL DEFAULT 0,
    "urgency" "Urgency" NOT NULL DEFAULT 'NORMAL',
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "upazilaId" TEXT NOT NULL,
    "unionId" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation-requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation-matches" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'NOTIFIED',
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "donation-matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation-history" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "requestId" TEXT,
    "matchId" TEXT,
    "bankId" TEXT,
    "units" INTEGER NOT NULL DEFAULT 1,
    "donatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation-history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "kind" "AchievementKind" NOT NULL,
    "code" "CodeName" NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blood-banks_ownerId_key" ON "blood-banks"("ownerId");

-- CreateIndex
CREATE INDEX "blood-banks_verificationStatus_upazilaId_idx" ON "blood-banks"("verificationStatus", "upazilaId");

-- CreateIndex
CREATE INDEX "bank-requests_bankId_status_idx" ON "bank-requests"("bankId", "status");

-- CreateIndex
CREATE INDEX "bank-requests_requesterId_idx" ON "bank-requests"("requesterId");

-- CreateIndex
CREATE INDEX "donation-requests_status_upazilaId_unionId_idx" ON "donation-requests"("status", "upazilaId", "unionId");

-- CreateIndex
CREATE INDEX "donation-requests_requesterId_idx" ON "donation-requests"("requesterId");

-- CreateIndex
CREATE INDEX "donation-matches_donorId_status_idx" ON "donation-matches"("donorId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "donation-matches_requestId_donorId_key" ON "donation-matches"("requestId", "donorId");

-- CreateIndex
CREATE UNIQUE INDEX "donation-history_matchId_key" ON "donation-history"("matchId");

-- CreateIndex
CREATE INDEX "donation-history_donorId_donatedAt_idx" ON "donation-history"("donorId", "donatedAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_donorId_kind_code_key" ON "achievements"("donorId", "kind", "code");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_reportedUserId_idx" ON "reports"("reportedUserId");

-- CreateIndex
CREATE INDEX "donor-service-areas_upazilaId_idx" ON "donor-service-areas"("upazilaId");

-- CreateIndex
CREATE UNIQUE INDEX "donor-service-areas_donorId_upazilaId_unionId_key" ON "donor-service-areas"("donorId", "upazilaId", "unionId");

-- CreateIndex
CREATE INDEX "user_donationCount_idx" ON "user"("donationCount");

-- AddForeignKey
ALTER TABLE "blood-banks" ADD CONSTRAINT "blood-banks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood-banks" ADD CONSTRAINT "blood-banks_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blood-inventory" ADD CONSTRAINT "blood-inventory_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "blood-banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank-requests" ADD CONSTRAINT "bank-requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank-requests" ADD CONSTRAINT "bank-requests_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "blood-banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation-requests" ADD CONSTRAINT "donation-requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation-requests" ADD CONSTRAINT "donation-requests_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation-requests" ADD CONSTRAINT "donation-requests_unionId_fkey" FOREIGN KEY ("unionId") REFERENCES "unions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation-matches" ADD CONSTRAINT "donation-matches_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "donation-requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation-matches" ADD CONSTRAINT "donation-matches_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor-service-areas" ADD CONSTRAINT "donor-service-areas_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation-history" ADD CONSTRAINT "donation-history_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation-history" ADD CONSTRAINT "donation-history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "donation-requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation-history" ADD CONSTRAINT "donation-history_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "donation-matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation-history" ADD CONSTRAINT "donation-history_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "blood-banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
