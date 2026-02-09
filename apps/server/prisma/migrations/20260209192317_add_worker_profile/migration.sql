-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('CLIENTE', 'TRABAJADOR') NOT NULL DEFAULT 'CLIENTE',

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkerProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `oficio` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `dni` VARCHAR(191) NOT NULL,
    `fotoDni` VARCHAR(191) NULL,
    `tarifaHora` DOUBLE NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `WorkerProfile_dni_key`(`dni`),
    UNIQUE INDEX `WorkerProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WorkerProfile` ADD CONSTRAINT `WorkerProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
