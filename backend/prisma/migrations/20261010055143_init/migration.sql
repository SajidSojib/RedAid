/*
  Warnings:

  - Made the column `licenseNumber` on table `blood-banks` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "blood-banks" ALTER COLUMN "licenseNumber" SET NOT NULL;
