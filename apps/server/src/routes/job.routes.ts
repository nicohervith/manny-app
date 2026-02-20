import { Router } from "express";
import { upload } from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

// Crear un nuevo trabajo
router.post("/create", upload.array("images", 5), async (req, res) => {
  try {
    const {
      title,
      description,
      clientId,
      budget,
      latitude,
      longitude,
      address,
    } = req.body;

    // Extraemos las URLs de los archivos subidos a Cloudinary
    const files = req.files as Express.Multer.File[];
    const imageUrls = files ? files.map((file) => file.path).join(",") : null;

    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        clientId: parseInt(clientId),
        budget: budget ? parseFloat(budget) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address,
        images: imageUrls, // Guardamos las URLs
        status: "PENDING",
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

// NUEVA RUTA: Proponer ajuste de presupuesto
router.post("/adjust-budget", async (req, res) => {
  const { jobId, newAmount, reason } = req.body;
  try {
    const adjustment = await prisma.jobAdjustment.create({
      data: {
        jobId: parseInt(jobId),
        prevAmount: 0, // Podrías buscar el budget actual aquí
        newAmount: parseFloat(newAmount),
        reason,
      },
    });

    // Opcional: Cambiar estado del trabajo a "WAITING_APPROVAL" o similar
    res.json({ message: "Ajuste propuesto al cliente", adjustment });
  } catch (error) {
    res.status(500).json({ error: "No se pudo proponer el ajuste" });
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
          select: { name: true, avatar: true },
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
        review: true,
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

router.get("/feed/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;

    // 1. Obtenemos la ubicación del trabajador
    const worker = await prisma.workerProfile.findUnique({
      where: { userId: parseInt(workerId) },
      select: { latitude: true, longitude: true },
    });

    if (!worker || !worker.latitude || !worker.longitude) {
      return res
        .status(400)
        .json({ error: "El trabajador no tiene ubicación configurada" });
    }

    const { latitude: wLat, longitude: wLon } = worker;

    const jobs = await prisma.$queryRaw`
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.budget, 
        t.latitude, 
        t.longitude,
        u.name as creatorName,
        (
          6371 * acos(
            cos(radians(${wLat})) * cos(radians(t.latitude)) * cos(radians(t.longitude) - radians(${wLon})) + 
            sin(radians(${wLat})) * sin(radians(t.latitude))
          )
        ) AS distance
      FROM "Task" t
      JOIN "User" u ON t.creatorId = u.id
      WHERE t.status = 'OPEN' 
        AND t.creatorId != ${parseInt(workerId)}
      ORDER BY distance ASC
      LIMIT 20;
    `;

    res.json(jobs);
  } catch (error) {
    console.error("Error en el feed:", error);
    res.status(500).json({ error: "No se pudo cargar el feed" });
  }
});

// apps/server/src/routes/jobs.routes.ts

router.post("/accept-bid", async (req, res) => {
  try {
    const { jobId, workerId, bidId } = req.body;
    await prisma.$transaction([
      prisma.job.update({
        where: { id: parseInt(jobId) },
        data: {
          status: "IN_PROGRESS",
          workerId: parseInt(workerId),
        },
      }),
      prisma.bid.update({
        where: { id: parseInt(bidId) },
        data: { status: "ACCEPTED" },
      }),
      prisma.bid.updateMany({
        where: {
          jobId: parseInt(jobId),
          NOT: { id: parseInt(bidId) },
        },
        data: { status: "REJECTED" },
      }),
    ]);

    res.json({ message: "Trabajador asignado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al aceptar la oferta" });
  }
});

router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedJob = await prisma.job.update({
      where: { id: parseInt(id) },
      data: { status: status },
    });

    res.json({ message: "Estado actualizado con éxito", job: updatedJob });
  } catch (error) {
    console.error("Error al actualizar estado del trabajo:", error);
    res.status(500).json({ error: "No se pudo actualizar el trabajo" });
  }
});

export default router;
