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

// apps/server/src/routes/worker.routes.ts

router.get("/profile/:userId", async (req, res) => {
  try {
    const profile = await prisma.workerProfile.findUnique({
      where: { userId: parseInt(req.params.userId) },
      include: {
        user: {
          select: {
            name: true,
            receivedReviews: {
              include: {
                reviewer: { select: { name: true } } // Para saber quién comentó
              },
              orderBy: { createdAt: 'desc' } // Más recientes primero
            },
          },
        },
      },
    });

    if (!profile) return res.status(404).json({ error: "No profile" });

    const reviews = profile.user.receivedReviews;
    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
        : 0;

    res.json({ 
      ...profile, 
      averageRating: averageRating.toFixed(1), 
      totalReviews: reviews.length,
      reviews: reviews // Enviamos la lista completa al front
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/jobs/:id/complete-worker
router.patch("/:id/complete-worker", async (req, res) => {
  const { id } = req.params;
  try {
    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: { status: "COMPLETED" }, 
    });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el estado" });
  }
});

export default router;
