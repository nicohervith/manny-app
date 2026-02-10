-- DropForeignKey
ALTER TABLE `job` DROP FOREIGN KEY `Job_trabajadorId_fkey`;

-- DropIndex
DROP INDEX `Job_trabajadorId_fkey` ON `job`;

-- AlterTable
ALTER TABLE `job` MODIFY `trabajadorId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_trabajadorId_fkey` FOREIGN KEY (`trabajadorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
