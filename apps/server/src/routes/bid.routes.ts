import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// Enviar una postulación
router.post("/apply", async (req, res) => {
  try {
    const { jobId, workerId, message, price, estimatedMin } = req.body;

    const existingBid = await prisma.bid.findFirst({
      where: {
        jobId: parseInt(jobId),
        workerId: parseInt(workerId),
      },
    });

    if (existingBid) return res.status(400).json({ error: "Already applied" });

    const bid = await prisma.bid.create({
      data: {
        jobId: parseInt(jobId),
        workerId: parseInt(workerId),
        message,
        price: parseFloat(price),
        estimatedMin: parseInt(estimatedMin),
      },
    });

    res.status(201).json({ message: "Postulación enviada con éxito", bid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al enviar la postulación" });
  }
});

// Obtener todas las ofertas de un trabajador específico
router.get("/worker/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const bids = await prisma.bid.findMany({
      where: { workerId: parseInt(workerId) },
      include: {
        job: {
          include: {
            client: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(bids);
  } catch (error) {
    res.status(500).json({ error: "Error fetching your bids" });
  }
});

export default router;
