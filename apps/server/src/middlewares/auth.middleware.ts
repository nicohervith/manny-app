// apps/server/src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
