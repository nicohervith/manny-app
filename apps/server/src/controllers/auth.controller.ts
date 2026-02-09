import { type Request, type Response } from "express"; // Usamos 'type' por tu config de TS
import * as authService from "../services/auth.service.js";

// En auth.controller.ts
export const register = async (req: Request, res: Response) => {
  try {
    console.log("Datos recibidos en el server:", req.body); // <-- Agrega esto para debug
    const user = await authService.registerUser(req.body);
    res.status(201).json({ message: "Usuario creado con éxito", user });
  } catch (error: any) {
    console.error("Error en registro:", error); // <-- Esto te dirá el error exacto de Prisma
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = await authService.loginUser(req.body);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};
