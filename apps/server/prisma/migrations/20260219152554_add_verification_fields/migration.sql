/*
  Warnings:

  - You are about to drop the column `dniPhoto` on the `workerprofile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `workerprofile` DROP COLUMN `dniPhoto`,
    ADD COLUMN `dniBack` VARCHAR(191) NULL,
    ADD COLUMN `dniFront` VARCHAR(191) NULL,
    ADD COLUMN `selfie` VARCHAR(191) NULL,
    ADD COLUMN `verification` ENUM('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'NOT_STARTED';
