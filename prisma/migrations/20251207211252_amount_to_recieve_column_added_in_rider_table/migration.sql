/*
  Warnings:

  - You are about to alter the column `amountToRecieve` on the `Rider` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "Rider" ALTER COLUMN "amountToRecieve" DROP DEFAULT,
ALTER COLUMN "amountToRecieve" SET DATA TYPE DECIMAL(65,30);
