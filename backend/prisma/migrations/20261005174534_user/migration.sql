/*
  Warnings:

  - You are about to drop the `pourashavas` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bloodType` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastDonationDate` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'BANK', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- DropForeignKey
ALTER TABLE "pourashavas" DROP CONSTRAINT "pourashavas_upazilaId_fkey";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "bloodType" "BloodType" NOT NULL,
ADD COLUMN     "lastDonationDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "role" "Role" DEFAULT 'USER',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- DropTable
DROP TABLE "pourashavas";

-- CreateTable
CREATE TABLE "donor-service-areas" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "unionId" TEXT NOT NULL,

    CONSTRAINT "donor-service-areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "donor-service-areas_donorId_idx" ON "donor-service-areas"("donorId");

-- CreateIndex
CREATE INDEX "donor-service-areas_unionId_idx" ON "donor-service-areas"("unionId");

-- CreateIndex
CREATE UNIQUE INDEX "donor-service-areas_donorId_unionId_key" ON "donor-service-areas"("donorId", "unionId");

-- AddForeignKey
ALTER TABLE "donor-service-areas" ADD CONSTRAINT "donor-service-areas_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor-service-areas" ADD CONSTRAINT "donor-service-areas_unionId_fkey" FOREIGN KEY ("unionId") REFERENCES "unions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
