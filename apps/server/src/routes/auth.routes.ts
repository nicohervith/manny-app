import bcrypt from "bcryptjs";
import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { prisma } from "../lib/prisma.js";
import { sendVerificationEmail } from "../utils/mailer.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    console.log("Solicitando recuperación para:", email);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log("Usuario no encontrado");
      return res
        .status(404)
        .json({ error: "No existe un usuario con ese email" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({
      where: { email },
      data: { verificationCode: code },
    });

    console.log("Código generado, intentando enviar mail...");
    await sendVerificationEmail(email, code);

    res.json({ message: "Código de recuperación enviado" });
  } catch (error) {
    console.error("ERROR DETALLADO EN FORGOT-PASSWORD:", error); // <--- ESTO ES CLAVE
    res
      .status(500)
      .json({ error: "Error al procesar la solicitud", details: error });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.verificationCode === code && code !== null) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          verificationCode: null,
        },
      });
      res.json({ success: true, message: "Contraseña actualizada" });
    } else {
      res.status(400).json({ error: "Código inválido o expirado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar contraseña" });
  }
});

export default router;
