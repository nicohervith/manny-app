import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const reviews = async (req: Request, res: Response) => {
  try {
    const { jobId, rating, comment, reviewerId, workerId } = req.body;

    const newReview = await prisma.review.create({
      data: {
        jobId: parseInt(jobId),
        rating: parseInt(rating),
        comment: comment || null,
        reviewerId: parseInt(reviewerId),
        workerId: parseInt(workerId),
      },
    });

    res.status(201).json(newReview);
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
