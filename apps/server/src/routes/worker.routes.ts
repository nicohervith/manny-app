import { Router } from "express";
import { upload } from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";
// 1. Importa el Enum Role generado por Prisma

const router = Router();

// apps/server/src/routes/worker.routes.ts

router.post(
  "/complete-profile",
  upload.single("dniPhoto"),
  async (req, res) => {
    try {
      // 1. Desestructuramos usando 'hourlyRate' (como viene del frontend)
      const {
        userId,
        occupation,
        description,
        dni,
        latitude,
        longitude,
        hourlyRate,
      } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "El userId es obligatorio" });
      }

      const fotoDniUrl = req.file ? req.file.path : null;
      const profile = await prisma.workerProfile.upsert({
        where: { userId: parseInt(userId) },
        update: {
          occupation,
          description,
          dni,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          dniPhoto: fotoDniUrl || undefined, // Solo actualiza si hay foto nueva
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        },
        create: {
          userId: parseInt(userId),
          occupation,
          description,
          dni,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          dniPhoto: fotoDniUrl,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        },
      });

      // 3. Asegurar que el rol cambie a WORKER
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { role: "WORKER" },
      });

      res.json({ message: "Perfil completado con éxito", profile });
    } catch (error) {
      console.error("Error en complete-profile:", error);
      res
        .status(500)
        .json({ error: "No se pudo procesar el perfil profesional" });
    }
  },
);

// Agregar este GET a tu archivo de rutas de worker
router.get("/list", async (req, res) => {
  try {
    const workers = await prisma.workerProfile.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(workers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching workers" });
  }
});

router.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await prisma.workerProfile.findUnique({
      where: { userId: parseInt(userId) },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: "Perfil no encontrado" });
    }

    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error de servidor" });
  }
});

export default router;
