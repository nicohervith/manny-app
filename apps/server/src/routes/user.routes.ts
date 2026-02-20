// apps/server/src/routes/user.routes.ts
import { Router } from "express";
import { upload } from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.patch(
  "/update-avatar/:userId",
  upload.single("avatar"),
  async (req, res) => {
    try {
      const userId = req.params.userId as string;

      if (!req.file) {
        return res.status(400).json({ error: "No se subió ninguna imagen" });
      }

      const imageUrl = req.file.path;

      // Validamos que el ID sea un número antes de seguir
      const parsedId = parseInt(userId);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: "ID de usuario inválido" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: parsedId },
        data: { avatar: imageUrl },
      });

      res.json({ message: "Foto de perfil actualizada", user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al actualizar avatar" });
    }
  },
);

export default router;
