-- AlterTable
ALTER TABLE `workerprofile` ADD COLUMN `workerAccessToken` VARCHAR(191) NULL,
    ADD COLUMN `workerRefreshToken` VARCHAR(191) NULL;
