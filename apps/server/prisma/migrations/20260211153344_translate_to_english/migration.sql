/*
  Warnings:

  - You are about to drop the column `estimadoMin` on the `bid` table. All the data in the column will be lost.
  - You are about to drop the column `mensaje` on the `bid` table. All the data in the column will be lost.
  - You are about to drop the column `precio` on the `bid` table. All the data in the column will be lost.
  - You are about to drop the column `trabajadorId` on the `bid` table. All the data in the column will be lost.
  - You are about to drop the column `clienteId` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `presupuesto` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `titulo` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `trabajadorId` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `montoNuevo` on the `jobadjustment` table. All the data in the column will be lost.
  - You are about to drop the column `montoPrevio` on the `jobadjustment` table. All the data in the column will be lost.
  - You are about to drop the column `motivo` on the `jobadjustment` table. All the data in the column will be lost.
  - You are about to drop the column `nombre` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `workerprofile` table. All the data in the column will be lost.
  - You are about to drop the column `fotoDni` on the `workerprofile` table. All the data in the column will be lost.
  - You are about to drop the column `oficio` on the `workerprofile` table. All the data in the column will be lost.
  - You are about to drop the column `tarifaHora` on the `workerprofile` table. All the data in the column will be lost.
  - Added the required column `estimatedMin` to the `Bid` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Bid` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Bid` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workerId` to the `Bid` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `newAmount` to the `JobAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prevAmount` to the `JobAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `JobAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `WorkerProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `occupation` to the `WorkerProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `bid` DROP FOREIGN KEY `Bid_trabajadorId_fkey`;

-- DropForeignKey
ALTER TABLE `job` DROP FOREIGN KEY `Job_clienteId_fkey`;

-- DropForeignKey
ALTER TABLE `job` DROP FOREIGN KEY `Job_trabajadorId_fkey`;

-- DropIndex
DROP INDEX `Bid_trabajadorId_fkey` ON `bid`;

-- DropIndex
DROP INDEX `Job_clienteId_fkey` ON `job`;

-- DropIndex
DROP INDEX `Job_trabajadorId_fkey` ON `job`;

-- AlterTable
ALTER TABLE `bid` DROP COLUMN `estimadoMin`,
    DROP COLUMN `mensaje`,
    DROP COLUMN `precio`,
    DROP COLUMN `trabajadorId`,
    ADD COLUMN `estimatedMin` INTEGER NOT NULL,
    ADD COLUMN `message` TEXT NOT NULL,
    ADD COLUMN `price` DOUBLE NOT NULL,
    ADD COLUMN `workerId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `job` DROP COLUMN `clienteId`,
    DROP COLUMN `descripcion`,
    DROP COLUMN `estado`,
    DROP COLUMN `presupuesto`,
    DROP COLUMN `titulo`,
    DROP COLUMN `trabajadorId`,
    ADD COLUMN `budget` DOUBLE NULL,
    ADD COLUMN `clientId` INTEGER NOT NULL,
    ADD COLUMN `description` TEXT NOT NULL,
    ADD COLUMN `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `title` VARCHAR(191) NOT NULL,
    ADD COLUMN `workerId` INTEGER NULL;

-- AlterTable
ALTER TABLE `jobadjustment` DROP COLUMN `montoNuevo`,
    DROP COLUMN `montoPrevio`,
    DROP COLUMN `motivo`,
    ADD COLUMN `newAmount` DOUBLE NOT NULL,
    ADD COLUMN `prevAmount` DOUBLE NOT NULL,
    ADD COLUMN `reason` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `nombre`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `workerprofile` DROP COLUMN `descripcion`,
    DROP COLUMN `fotoDni`,
    DROP COLUMN `oficio`,
    DROP COLUMN `tarifaHora`,
    ADD COLUMN `description` TEXT NOT NULL,
    ADD COLUMN `dniPhoto` VARCHAR(191) NULL,
    ADD COLUMN `hourlyRate` DOUBLE NULL,
    ADD COLUMN `occupation` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bid` ADD CONSTRAINT `Bid_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
