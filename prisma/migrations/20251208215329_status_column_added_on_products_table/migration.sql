-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'Deleted';

-- AlterEnum
ALTER TYPE "ReturnRequestStatus" ADD VALUE 'Deleted';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'pendingApproval';
