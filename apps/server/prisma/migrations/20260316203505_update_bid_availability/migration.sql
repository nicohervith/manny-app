/*
  Warnings:

  - You are about to drop the column `estimatedMin` on the `bid` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Bid` DROP COLUMN `estimatedMin`,
    ADD COLUMN `availableFrom` VARCHAR(191) NULL,
    ADD COLUMN `availableTo` VARCHAR(191) NULL;
