-- AlterTable
ALTER TABLE `job` ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL;

-- AlterTable
ALTER TABLE `workerprofile` ADD COLUMN `lastLat` DOUBLE NULL,
    ADD COLUMN `lastLng` DOUBLE NULL;
