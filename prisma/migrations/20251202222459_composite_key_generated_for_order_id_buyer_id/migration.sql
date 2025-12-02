/*
  Warnings:

  - A unique constraint covering the columns `[id,buyerId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Order_buyerId_idx";

-- DropIndex
DROP INDEX "Order_riderId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Order_id_buyerId_key" ON "Order"("id", "buyerId");
