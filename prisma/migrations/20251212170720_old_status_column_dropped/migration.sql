/*
  Warnings:

  - You are about to drop the column `status` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ProductReview` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "ProductReview" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "status";

-- DropEnum
DROP TYPE "Status";
