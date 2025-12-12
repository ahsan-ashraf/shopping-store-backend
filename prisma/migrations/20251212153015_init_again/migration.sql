/*
  Warnings:

  - Added the required column `operationalState` to the `ProductReview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "operationalState" "OperationalState" NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "approvalState" "ApprovalState" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "operationalState" "OperationalState" NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "ProductReview" ADD COLUMN     "operationalState" "OperationalState" NOT NULL;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "approvalState" "ApprovalState" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "operationalState" "OperationalState" NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approvalState" "ApprovalState" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "operationalState" "OperationalState" NOT NULL DEFAULT 'Active';
