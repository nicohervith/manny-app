// apps/server/src/middlewares/auth.middleware.ts
import bcrypt from "bcryptjs";
import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { sendVerificationEmail } from "../utils/mailer.js";

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Acceso denegado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "No tienes permisos de administrador" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
};

export const authenticateToken = (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Acceso denegado. No hay token." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    console.log("CONTENIDO DEL TOKEN DECODIFICADO:", decoded);
    // Inyectamos todo el objeto decodificado (id, email, role) en la request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};

export const forgotPassword = async (req: any, res: Response) => {
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
    console.error("ERROR DETALLADO EN FORGOT-PASSWORD:", error);
    res
      .status(500)
      .json({ error: "Error al procesar la solicitud", details: error });
  }
};

export const resetPassword = async (req: any, res: Response) => {
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
};
