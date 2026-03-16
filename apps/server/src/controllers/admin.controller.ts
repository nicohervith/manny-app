import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getPendingWorkers = async (req: Request, res: Response) => {
  try {
    const pending = await prisma.workerProfile.findMany({
      where: { verification: "PENDING" },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pendientes" });
  }
};

export const verifyWorker = async (req: Request, res: Response) => {
  const { workerId, status } = req.body;
  try {
    await prisma.workerProfile.update({
      where: { id: workerId },
      data: { verification: status },
    });
    res.json({ message: `Trabajador ${status}` });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar estado" });
  }
};
