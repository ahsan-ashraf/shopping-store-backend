/*
  Warnings:

  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `paymentMethod` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `paymentStatus` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `ReturnRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "paymentMethod" AS ENUM ('Prepaid', 'PostPaid');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Paid', 'Pending');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Processing', 'OutForDeliver', 'Delivered', 'FailedToDeliver');

-- CreateEnum
CREATE TYPE "ReturnRequestStatus" AS ENUM ('ReturnRequested', 'ReturnInProgress', 'Returned');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "paymentMethod" NOT NULL,
DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'Processing';

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "video" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ReturnRequest" DROP COLUMN "status",
ADD COLUMN     "status" "ReturnRequestStatus" NOT NULL;

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "ReturnRequest_status_idx" ON "ReturnRequest"("status");
