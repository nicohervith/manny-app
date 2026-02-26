// apps/server/src/routes/user.routes.ts
import { Router } from "express";
import { upload } from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { sendVerificationEmail } from "../utils/mailer.js";

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

router.patch("/update-push-token/:userId", async (req, res) => {
  const { userId } = req.params;
  const { pushToken } = req.body;
  try {
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { pushToken },
    });
    console.log(`Token actualizado para el usuario ${userId}`);
    res.json({ message: "Token actualizado" });
  } catch (error) {
    console.error("Error en DB:", error);
    res.status(500).json({ error: "No se pudo guardar el token" });
  }
});

router.patch("/update-push-token", async (req, res) => {
  const { userId, token } = req.body;
  try {
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { pushToken: token },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error actualizando push token" });
  }
});

router.post("/send-code", authenticateToken, async (req: any, res) => {
  // Cambiamos 'id' por 'userId' que es lo que viene en el token
  const userId = req.user.userId;

  console.log("Iniciando envío para el usuario ID:", userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }, // Forzamos Number por seguridad
    });

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { id: Number(userId) },
      data: { verificationCode: code },
    });

    await sendVerificationEmail(user.email, code);

    res.json({ message: "Código enviado" });
  } catch (error) {
    console.error("DETALLE DEL ERROR:", error);
    res.status(500).json({ error: "Error al enviar el mail" });
  }
});

// 2. Verificar Código
router.post("/verify-otp", authenticateToken, async (req: any, res) => {
  const { code } = req.body;
  const userId = req.user.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (user?.verificationCode === code) {
      await prisma.user.update({
        where: { id: Number(userId) },
        data: { emailVerified: true, verificationCode: null },
      });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Código incorrecto" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error de servidor" });
  }
});

router.post("/ping/:userId", async (req, res) => {
  await prisma.user.update({
    where: { id: parseInt(req.params.userId) },
    data: { lastSeen: new Date() },
  });
  res.sendStatus(200);
});

export default router;
