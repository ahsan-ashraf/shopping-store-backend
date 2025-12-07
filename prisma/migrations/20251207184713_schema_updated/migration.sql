/*
  Warnings:

  - You are about to drop the column `totalPrice` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "totalPrice";

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'pendingApproval';
