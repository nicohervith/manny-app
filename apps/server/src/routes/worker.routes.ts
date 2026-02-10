import { Router } from "express";
import { upload } from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";
// 1. Importa el Enum Role generado por Prisma

const router = Router();

// apps/server/src/routes/worker.routes.ts

router.post("/complete-profile", upload.single("fotoDni"), async (req, res) => {
  try {
    const { userId, oficio, descripcion, dni, tarifaHora } = req.body;

    // Si usas Cloudinary, la URL está en req.file.path
    const fotoDniUrl = req.file ? req.file.path : null;

    const profile = await prisma.workerProfile.create({
      data: {
        userId: parseInt(userId),
        oficio,
        descripcion,
        dni,
        fotoDni: fotoDniUrl, // Guardamos la URL
        tarifaHora: tarifaHora ? parseFloat(tarifaHora) : null, // Convertimos a número
      },
    });

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role: "WORKER" },
    });

    res.json({ message: "Perfil completado", profile });
  } catch (error) {
    console.error("Error detallado:", error);
    res.status(500).json({ error: "No se pudo crear el perfil" });
  }
});

// Agregar este GET a tu archivo de rutas de worker
router.get("/list", async (req, res) => {
  try {
    const workers = await prisma.workerProfile.findMany({
      include: {
        user: {
          select: {
            nombre: true,
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

export default router;
