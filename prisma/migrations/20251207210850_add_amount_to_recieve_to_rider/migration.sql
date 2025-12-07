/*
  Warnings:

  - Added the required column `amountToRecieve` to the `Rider` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Add the column with a default
ALTER TABLE "Rider" ADD COLUMN "amountToRecieve" decimal NOT NULL DEFAULT 0;

-- Optional: Ensure all existing rows have 0 (usually redundant with DEFAULT)
UPDATE "Rider" SET "amountToRecieve" = 0 WHERE "amountToRecieve" IS NULL;
