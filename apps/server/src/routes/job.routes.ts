import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// Crear un nuevo trabajo
router.post("/create", async (req, res) => {
  try {
    const { title, description, clientId, budget, latitude, longitude } =
      req.body;

    const newJob = await prisma.job.create({
      data: {
        title, // antes titulo
        description, // antes descripcion
        clientId: parseInt(clientId), // antes clienteId
        budget: budget ? parseFloat(budget) : null, // antes presupuesto
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: "PENDING", // antes estado y PENDIENTE
      },
    });

    res
      .status(201)
      .json({ message: "Job published successfully", job: newJob });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error publishing job" });
  }
});

// Obtener trabajos disponibles
router.get("/available", async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        client: {
          // antes cliente
          select: { name: true }, // antes nombre
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Error fetching jobs" });
  }
});

// Obtener trabajos por cliente
router.get("/client/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const jobs = await prisma.job.findMany({
      where: { clientId: parseInt(clientId) },
      include: {
        _count: {
          select: { bids: true },
        },
        bids: {
          include: {
            worker: {
              select: { name: true, profile: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching your jobs" });
  }
});

// Aceptar una oferta (Hacer el Match)
router.patch("/accept-bid", async (req, res) => {
  try {
    const { jobId, workerId } = req.body;

    const updatedJob = await prisma.job.update({
      where: { id: parseInt(jobId) },
      data: {
        workerId: parseInt(workerId),
        status: "IN_PROGRESS",
      },
    });

    res.json({ message: "Contract accepted!", job: updatedJob });
  } catch (error) {
    res.status(500).json({ error: "Could not accept bid" });
  }
});

export default router;
