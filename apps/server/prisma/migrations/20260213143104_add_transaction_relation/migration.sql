/*
  Warnings:

  - A unique constraint covering the columns `[mercadopagoId]` on the table `WorkerProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `workerprofile` ADD COLUMN `mercadopagoId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `WorkerProfile_mercadopagoId_key` ON `WorkerProfile`(`mercadopagoId`);
