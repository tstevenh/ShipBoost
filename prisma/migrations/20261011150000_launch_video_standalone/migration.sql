-- AlterTable
ALTER TABLE "LaunchVideoOrder" ADD COLUMN     "deliverBy" TIMESTAMP(3),
ADD COLUMN     "standalone" BOOLEAN NOT NULL DEFAULT false;

