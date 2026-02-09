import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secreto_por_defecto";

export const generateToken = (payload: { userId: string | number; role: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};