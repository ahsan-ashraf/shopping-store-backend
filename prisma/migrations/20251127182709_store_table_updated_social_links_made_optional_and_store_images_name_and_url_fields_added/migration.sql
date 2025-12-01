/*
  Warnings:

  - You are about to drop the column `bannerImage` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `iconImage` on the `Store` table. All the data in the column will be lost.
  - Added the required column `bannerImageName` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bannerImageUrl` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iconImageName` to the `Store` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iconImageUrl` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Store" DROP COLUMN "bannerImage",
DROP COLUMN "iconImage",
ADD COLUMN     "bannerImageName" TEXT NOT NULL,
ADD COLUMN     "bannerImageUrl" TEXT NOT NULL,
ADD COLUMN     "iconImageName" TEXT NOT NULL,
ADD COLUMN     "iconImageUrl" TEXT NOT NULL,
ALTER COLUMN "youtube" DROP NOT NULL,
ALTER COLUMN "facebook" DROP NOT NULL,
ALTER COLUMN "instagram" DROP NOT NULL,
ALTER COLUMN "tiktok" DROP NOT NULL;
