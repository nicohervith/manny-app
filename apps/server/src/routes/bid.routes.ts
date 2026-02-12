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

router.get("/worker/:workerId", async (req, res) => {
  try {
    const { workerId } = req.params;
    const bids = await prisma.bid.findMany({
      where: { workerId: parseInt(workerId) },
      include: {
        job: {
          include: {
            client: { 
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(bids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener historial de ofertas" });
  }
});

// apps/server/src/routes/bid.routes.ts

router.get("/job/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const bids = await prisma.bid.findMany({
      where: { jobId: parseInt(jobId) },
      include: {
        worker: {
          select: { 
            name: true, 
            id: true,
            receivedReviews: {
              select: { rating: true }
            }
          },
        },
      },
      orderBy: { price: "asc" },
    });

    // Mapeamos los resultados para calcular el promedio y total de reseñas antes de enviar
    const formattedBids = bids.map(bid => {
      const reviews = bid.worker.receivedReviews;
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
        : "0.0";

      return {
        ...bid,
        worker: {
          ...bid.worker,
          averageRating,
          totalReviews
        }
      };
    });

    res.json(formattedBids);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener ofertas" });
  }
});

export default router;
