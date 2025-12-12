/*
  Warnings:

  - The values [Deleted] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [Deleted] on the enum `ReturnRequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('Processing', 'OutForDeliver', 'Delivered', 'FailedToDeliver', 'Canceled');
ALTER TABLE "public"."Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'Processing';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReturnRequestStatus_new" AS ENUM ('ReturnRequested', 'ReturnInProgress', 'Returned');
ALTER TABLE "ReturnRequest" ALTER COLUMN "status" TYPE "ReturnRequestStatus_new" USING ("status"::text::"ReturnRequestStatus_new");
ALTER TYPE "ReturnRequestStatus" RENAME TO "ReturnRequestStatus_old";
ALTER TYPE "ReturnRequestStatus_new" RENAME TO "ReturnRequestStatus";
DROP TYPE "public"."ReturnRequestStatus_old";
COMMIT;
