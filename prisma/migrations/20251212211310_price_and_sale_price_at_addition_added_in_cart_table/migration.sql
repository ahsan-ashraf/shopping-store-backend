/*
  Warnings:

  - Added the required column `salePriceAtAddition` to the `Cart` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "salePriceAtAddition" DECIMAL(65,30) NOT NULL;
