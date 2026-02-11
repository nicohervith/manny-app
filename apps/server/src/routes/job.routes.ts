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

    /**
     * 2. Consulta SQL para calcular distancia (Haversine)
     * 6371 es el radio de la tierra en KM.
     * Filtramos tareas que estén "OPEN" y no sean del propio usuario.
     */
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

    // Usamos una transacción para asegurar que ambos cambios ocurran o ninguno
    // Importa el Enum si es necesario o úsalo como string si Prisma lo permite
    await prisma.$transaction([
      // 1. Actualizar el Trabajo
      prisma.job.update({
        // Asegúrate si es .task o .job según tu schema
        where: { id: parseInt(jobId) },
        data: {
          status: "IN_PROGRESS",
          workerId: parseInt(workerId),
        },
      }),
      // 2. Aceptar la oferta elegida
      prisma.bid.update({
        where: { id: parseInt(bidId) },
        data: { status: "ACCEPTED" }, // Ahora TypeScript reconocerá 'status'
      }),
      // 3. Rechazar las demás
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

export default router;
