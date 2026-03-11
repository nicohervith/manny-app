import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import * as authService from "../services/auth.service.js";
import { sendPasswordResetEmail } from "../services/email.service.js";
// En auth.controller.ts
export const register = async (req, res) => {
    try {
        console.log("Datos recibidos en el server:", req.body); // <-- Agrega esto para debug
        const user = await authService.registerUser(req.body);
        res.status(201).json({ message: "Usuario creado con éxito", user });
    }
    catch (error) {
        console.error("Error en registro:", error); // <-- Esto te dirá el error exacto de Prisma
        res.status(400).json({ error: error.message });
    }
};
export const login = async (req, res) => {
    try {
        const data = await authService.loginUser(req.body);
        res.status(200).json(data);
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
};
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Respondemos igual para no revelar si el email existe
            return res.json({ message: "Si el email existe, recibirás un código." });
        }
        const resetToken = crypto.randomInt(100000, 999999).toString();
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        await prisma.user.update({
            where: { email },
            data: { resetToken, resetTokenExpiry: expiry },
        });
        await sendPasswordResetEmail(email, resetToken);
        res.json({ message: "Si el email existe, recibirás un código." });
    }
    catch (error) {
        console.error("Error en forgotPassword:", error);
        res.status(500).json({ error: "Error al procesar la solicitud" });
    }
};
export const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user ||
            user.resetToken !== code ||
            !user.resetTokenExpiry ||
            user.resetTokenExpiry < new Date()) {
            return res.status(400).json({ error: "Código inválido o expirado" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        res.json({ message: "Contraseña actualizada correctamente" });
    }
    catch (error) {
        console.error("Error en resetPassword:", error);
        res.status(500).json({ error: "Error al resetear la contraseña" });
    }
};
