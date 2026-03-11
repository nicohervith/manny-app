import jwt from "jsonwebtoken";
export const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "Acceso denegado" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "ADMIN") {
            return res
                .status(403)
                .json({ error: "No tienes permisos de administrador" });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Token inválido" });
    }
};
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "Acceso denegado. No hay token." });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Token inválido o expirado" });
    }
};
