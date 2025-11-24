-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pendingApproval', 'active', 'blocked');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'pendingApproval';
