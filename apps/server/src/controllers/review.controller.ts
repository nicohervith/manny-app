import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const reviews = async (req: Request, res: Response) => {
  try {
    const { jobId, rating, comment, reviewerId, workerId } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          jobId: parseInt(jobId),
          rating: parseInt(rating),
          comment,
          reviewerId: parseInt(reviewerId),
          workerId: parseInt(workerId),
        },
      });
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
};
