import jwt from "jsonwebtoken";
export const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("FATAL: JWT_SECRET no está definido en el .env");
        throw new Error("Error interno de configuración");
    }
    return jwt.sign(payload, secret, { expiresIn: "7d" });
};
