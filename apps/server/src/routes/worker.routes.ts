import { Router } from "express";
import { upload } from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";
// 1. Importa el Enum Role generado por Prisma
import { Role } from "@prisma/client";

const router = Router();

router.post("/complete-profile", upload.single("fotoDni"), async (req, res) => {
  try {
    const { userId, oficio, descripcion, dni } = req.body;
    const fotoDniUrl = (req.file as any)?.path; // Cast opcional para evitar quejas de Multer

    const profile = await prisma.workerProfile.create({
      data: {
        userId: parseInt(userId),
        oficio,
        descripcion,
        dni,
        fotoDni: fotoDniUrl,
      },
    });

    // 2. Usa el Enum Role.WORKER en lugar del string "WORKER"
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { role: Role.WORKER },
    });

    res.json({ message: "Perfil completado con éxito", profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el perfil" });
  }
});

export default router;
