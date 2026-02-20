// apps/server/src/routes/admin.routes.ts
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Obtener todos los trabajadores pendientes de validación
router.get("/pending-workers", isAdmin, async (req, res) => {
  try {
    const pending = await prisma.workerProfile.findMany({
      where: { verification: "PENDING" },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pendientes" });
  }
});

// Aprobar o rechazar
router.patch("/verify-worker", isAdmin, async (req, res) => {
  const { workerId, status } = req.body; // status: 'VERIFIED' o 'REJECTED'
  try {
    await prisma.workerProfile.update({
      where: { id: workerId },
      data: { verification: status },
    });
    res.json({ message: `Trabajador ${status}` });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

export default router;
