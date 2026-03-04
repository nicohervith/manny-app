import * as authService from "../services/auth.service.js";
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
