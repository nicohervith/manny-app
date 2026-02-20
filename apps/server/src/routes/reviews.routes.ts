import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// POST /api/reviews
router.post("/", async (req, res) => {
  const { jobId, rating, comment, reviewerId, workerId } = req.body;

  try {
    // Usamos una transacción para asegurar que ambas cosas pasen o ninguna
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la reseña
      const newReview = await tx.review.create({
        data: {
          jobId: parseInt(jobId),
          rating: parseInt(rating),
          comment,
          reviewerId: parseInt(reviewerId),
          workerId: parseInt(workerId),
        },
      });

      // 2. Actualizar el estado del trabajo a COMPLETED
      await tx.job.update({
        where: { id: parseInt(jobId) },
        data: { status: "COMPLETED" },
      });

      return newReview;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error al procesar la reseña:", error);
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Este trabajo ya ha sido calificado." });
    }
    res.status(500).json({ error: "No se pudo guardar la reseña." });
  }
});

export default router;
