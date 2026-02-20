import jwt from "jsonwebtoken";

/* const JWT_SECRET = process.env.JWT_SECRET || "secreto_por_defecto";

export const generateToken = (payload: {
  userId: string | number;
  role: string;
}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}; */

export const generateToken = (payload: object) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("FATAL: JWT_SECRET no está definido en el .env");
    throw new Error("Error interno de configuración");
  }
  return jwt.sign(payload, secret, { expiresIn: "7d" }); // Expira en 7 días
};
