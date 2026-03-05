// apps/server/src/controllers/job.controller.ts
import { prisma } from "../lib/prisma.js";
// ─────────────────────────────────────────────
// POST /api/jobs/create
// ─────────────────────────────────────────────
export const createJob = async (req, res) => {
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
    const files = req.files;
    const imageUrls = files ? files.map((f) => f.path).join(",") : null;
    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        clientId: parseInt(clientId),
        budget: budget ? parseFloat(budget) : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address,
        images: imageUrls,
        status: "PENDING",
      },
    });
    res
      .status(201)
      .json({ message: "Job published successfully", job: newJob });
  } catch (error) {
    console.error("Error en createJob:", error);
    res.status(500).json({ error: "Error publishing job" });
  }
};
// ─────────────────────────────────────────────
// POST /api/jobs/adjust-budget
// ─────────────────────────────────────────────
export const adjustBudget = async (req, res) => {
  const { jobId, newAmount, reason } = req.body;
  try {
    const job = await prisma.job.findUnique({
      where: { id: parseInt(jobId) },
    });
    if (!job) {
      return res.status(404).json({ error: "Trabajo no encontrado" });
    }
    const adjustment = await prisma.jobAdjustment.create({
      data: {
        jobId: parseInt(jobId),
        prevAmount: job.budget ?? 0,
        newAmount: parseFloat(newAmount),
        reason,
      },
    });
    res.json({ message: "Ajuste propuesto al cliente", adjustment });
  } catch (error) {
    console.error("Error en adjustBudget:", error);
    res.status(500).json({ error: "No se pudo proponer el ajuste" });
  }
};
// ─────────────────────────────────────────────
// GET /api/jobs/available
// ─────────────────────────────────────────────
export const getAvailableJobs = async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: "PENDING" },
      include: {
        client: {
          select: { name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(jobs);
  } catch (error) {
    console.error("Error en getAvailableJobs:", error);
    res.status(500).json({ error: "Error fetching jobs" });
  }
};
// ─────────────────────────────────────────────
// GET /api/jobs/client/:clientId
// ─────────────────────────────────────────────
export const getClientJobs = async (req, res) => {
  try {
    const clientId = req.params.clientId;
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
    console.error("Error en getClientJobs:", error);
    res.status(500).json({ error: "Error fetching your jobs" });
  }
};
// ─────────────────────────────────────────────
// GET /api/jobs/feed/:workerId
// ─────────────────────────────────────────────
export const getWorkerFeed = async (req, res) => {
  try {
    const workerId = req.params.workerId;
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
    // IMPORTANTE: Verificá que "Job" y "clientId" coincidan con tu schema de Prisma.
    // Si tu tabla se llama "Task" con "creatorId", ajustá los nombres aquí.
    const jobs = await prisma.$queryRaw`
      SELECT 
        j.id,
        j.title,
        j.description,
        j.budget,
        j.latitude,
        j.longitude,
        j.address,
        j.images,
        j.status,
        j."createdAt",
        u.name AS "clientName",
        u.avatar AS "clientAvatar",
        (
          6371 * acos(
            cos(radians(${wLat})) * cos(radians(j.latitude)) *
            cos(radians(j.longitude) - radians(${wLon})) +
            sin(radians(${wLat})) * sin(radians(j.latitude))
          )
        ) AS distance
      FROM "Job" j
      JOIN "User" u ON j."clientId" = u.id
      WHERE j.status = 'PENDING'
        AND j."clientId" != ${parseInt(workerId)}
      ORDER BY distance ASC
      LIMIT 20;
    `;
    res.json(jobs);
  } catch (error) {
    console.error("Error en getWorkerFeed:", error);
    res.status(500).json({ error: "No se pudo cargar el feed" });
  }
};
// ─────────────────────────────────────────────
// POST /api/jobs/accept-bid
// ─────────────────────────────────────────────
export const acceptBid = async (req, res) => {
  try {
    const { jobId, workerId, bidId } = req.body;
    if (!jobId || !workerId || !bidId) {
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }
    await prisma.$transaction([
      // 1. Asignar el worker y cambiar estado del job
      prisma.job.update({
        where: { id: parseInt(jobId) },
        data: {
          status: "IN_PROGRESS",
          workerId: parseInt(workerId),
        },
      }),
      // 2. Marcar la bid ganadora como ACCEPTED
      prisma.bid.update({
        where: { id: parseInt(bidId) },
        data: { status: "ACCEPTED" },
      }),
      // 3. Rechazar el resto de bids del mismo job
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
    console.error("Error en acceptBid:", error);
    res.status(500).json({ error: "Error al aceptar la oferta" });
  }
};
// ─────────────────────────────────────────────
// PATCH /api/jobs/:id/status
// ─────────────────────────────────────────────
export const updateJobStatus = async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const validStatuses = [
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
    "PAID",
    "CANCELLED",
    "DISPUTED",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Estado inválido. Valores permitidos: ${validStatuses.join(", ")}`,
    });
  }
  try {
    const updatedJob = await prisma.job.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    res.json({ message: "Estado actualizado con éxito", job: updatedJob });
  } catch (error) {
    console.error("Error en updateJobStatus:", error);
    res.status(500).json({ error: "No se pudo actualizar el trabajo" });
  }
};
