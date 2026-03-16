import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { sendVerificationEmail } from "../utils/mailer.js";

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    if (!req.file) {
      return res.status(400).json({ error: "No se subió ninguna imagen" });
    }

    const parsedId = parseInt(userId);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "ID de usuario inválido" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parsedId },
      data: { avatar: req.file.path },
    });

    res.json({ message: "Foto de perfil actualizada", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar avatar" });
  }
};

export const updatePushTokenById = async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
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
};

export const updatePushToken = async (req: Request, res: Response) => {
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
};

export const sendVerificationCode = async (req: any, res: Response) => {
  const userId = req.user.userId;
  console.log("Iniciando envío para el usuario ID:", userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
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
};

export const verifyOtp = async (req: any, res: Response) => {
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
};

export const pingUser = async (req: Request, res: Response) => {
  try {
    await prisma.user.update({
      where: { id: parseInt(req.params.userId as string) },
      data: { lastSeen: new Date() },
    });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar lastSeen" });
  }
};
