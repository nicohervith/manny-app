// apps/server/src/controllers/job.controller.ts

import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { sendPushNotification } from "../services/notification.service.js";

// ─────────────────────────────────────────────
// POST /api/jobs/create
// ─────────────────────────────────────────────
export const createJob = async (req: Request, res: Response) => {
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

    const files = req.files as Express.Multer.File[];
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
export const adjustBudget = async (req: Request, res: Response) => {
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
export const getAvailableJobs = async (req: Request, res: Response) => {
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
export const getClientJobs = async (req: Request, res: Response) => {
  try {
    const clientId = req.params.clientId as string;

    const jobs = await prisma.job.findMany({
      where: { clientId: parseInt(clientId) },
      include: {
        _count: {
          select: { bids: true },
        },
        review: true,
        worker: { select: { name: true } },
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
export const getWorkerFeed = async (req: Request, res: Response) => {
  try {
    const workerId = req.params.workerId as string;

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
export const acceptBid = async (req: Request, res: Response) => {
  try {
    const { jobId, workerId, bidId } = req.body;

    if (!jobId || !workerId || !bidId) {
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    // Obtener el job y bid ANTES de la transacción
    const [job, bid] = await Promise.all([
      prisma.job.findUnique({ where: { id: parseInt(jobId) } }),
      prisma.bid.findUnique({ where: { id: parseInt(bidId) } }),
    ]);

    if (!job || !bid) {
      return res.status(404).json({ error: "Trabajo u oferta no encontrado" });
    }

    await prisma.$transaction([
      prisma.job.update({
        where: { id: parseInt(jobId) },
        data: {
          status: "IN_PROGRESS",
          workerId: parseInt(workerId),
          budget: bid.price,
        },
      }),
      prisma.bid.update({
        where: { id: parseInt(bidId) },
        data: { status: "ACCEPTED" },
      }),
      prisma.bid.updateMany({
        where: { jobId: parseInt(jobId), NOT: { id: parseInt(bidId) } },
        data: { status: "REJECTED" },
      }),
    ]);

    // Notificar al worker
    const worker = await prisma.user.findUnique({
      where: { id: parseInt(workerId) },
      select: { pushToken: true },
    });

    if (worker?.pushToken) {
      await sendPushNotification(
        worker.pushToken,
        "¡Tu propuesta fue aceptada! 🎉",
        `El cliente aceptó tu oferta para "${job.title}". Ya podés contactarlo.`,
        { jobId: jobId.toString(), type: "BID_ACCEPTED" },
      );
    }

    res.json({ message: "Trabajador asignado con éxito" });
  } catch (error) {
    console.error("Error en acceptBid:", error);
    res.status(500).json({ error: "Error al aceptar la oferta" });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/jobs/:id/status
// ─────────────────────────────────────────────
export const updateJobStatus = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, paymentMethod } = req.body;

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
      data: { status, ...(paymentMethod && { paymentMethod }) },
      include: {
        client: { select: { pushToken: true, name: true } },
        worker: { select: { name: true } },
      },
    });

    const clientToken = (updatedJob as any).client?.pushToken;
    const workerName = (updatedJob as any).worker?.name;

    if (status === "COMPLETED" && clientToken) {
      await sendPushNotification(
        clientToken,
        "Trabajo completado",
        `${workerName} marcó el trabajo "${updatedJob.title}" como terminado. ¡Confirmá y pagá!`,
        { jobId: id, type: "JOB_COMPLETED" },
      );
    }

    if (status === "PAID" && clientToken) {
      await sendPushNotification(
        clientToken,
        "Pago confirmado ✅",
        `${workerName} confirmó que recibió el pago en efectivo.`,
        { jobId: id, type: "PAYMENT_RECEIVED" },
      );
    }

    res.json({ message: "Estado actualizado con éxito", job: updatedJob });
  } catch (error) {
    console.error("Error en updateJobStatus:", error);
    res.status(500).json({ error: "No se pudo actualizar el trabajo" });
  }
};
