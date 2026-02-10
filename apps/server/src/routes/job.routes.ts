import { JobStatus } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// Crear un nuevo trabajo
router.post("/create", async (req, res) => {
  try {
    const { titulo, descripcion, clienteId, presupuesto } = req.body;

    const newJob = await prisma.job.create({
      data: {
        titulo,
        descripcion,
        clienteId: parseInt(clienteId),
        presupuesto: presupuesto ? parseFloat(presupuesto) : null,
        estado: JobStatus.PENDIENTE, // <--- Usa el Enum aquí
      },
    });

    res.status(201).json({ message: "Trabajo publicado", job: newJob });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al publicar el trabajo" });
  }
});

// Obtener trabajos disponibles (para que los vean los trabajadores)
router.get("/available", async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { estado: "PENDIENTE" },
      include: { cliente: { select: { nombre: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener trabajos" });
  }
});

export default router;
