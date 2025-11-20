/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Buyer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Buyer` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Rider` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Seller` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Seller` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Buyer" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Rider" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Seller" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";
