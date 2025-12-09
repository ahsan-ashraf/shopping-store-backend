/*
  Warnings:

  - Added the required column `status` to the `ProductReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductReview"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Active';

