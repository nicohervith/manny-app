import { Router } from "express";
import { upload } from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";
// 1. Importa el Enum Role generado por Prisma

const router = Router();

// apps/server/src/routes/worker.routes.ts

const uploadFields = upload.fields([
  { name: "dniFront", maxCount: 1 },
  { name: "dniBack", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
]);

router.post(
  "/complete-profile",
  (req, res, next) => {
    uploadFields(req, res, (err) => {
      if (err) {
        console.error("❌ Error de Multer/Cloudinary:", err);
        return res
          .status(400)
          .json({ error: "Error al subir archivos", details: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const {
        userId,
        occupation,
        description,
        dni,
        latitude,
        longitude,
        hourlyRate,
        tags, // <--- Recibimos el string JSON de los tags
      } = req.body;

      if (!userId)
        return res.status(400).json({ error: "El userId es obligatorio" });

      // 1. Procesar los tags de JSON string a Array de objetos para Prisma
      let tagsData: { where: { name: string }; create: { name: string } }[] =
        [];
      if (tags) {
        try {
          const parsedTags = JSON.parse(tags) as string[];
          tagsData = parsedTags.map((tagName) => ({
            where: { name: tagName },
            create: { name: tagName },
          }));
        } catch (e) {
          console.error("Error parsing tags:", e);
        }
      }

      const files = req.files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      const dniFrontUrl = files?.["dniFront"]?.[0]?.path || null;
      const dniBackUrl = files?.["dniBack"]?.[0]?.path || null;
      const selfieUrl = files?.["selfie"]?.[0]?.path || null;

      const profile = await prisma.workerProfile.upsert({
        where: { userId: parseInt(userId) },
        update: {
          occupation,
          description,
          dni,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          ...(dniFrontUrl && { dniFront: dniFrontUrl }),
          ...(dniBackUrl && { dniBack: dniBackUrl }),
          ...(selfieUrl && { selfie: selfieUrl }),
          verification: "PENDING",
          // ACTUALIZAR TAGS: Limpiamos los anteriores y conectamos los nuevos
          tags: {
            set: [], // Esto limpia la relación previa para que no se acumulen
            connectOrCreate: tagsData,
          },
        },
        create: {
          userId: parseInt(userId),
          occupation,
          description,
          dni,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          dniFront: dniFrontUrl,
          dniBack: dniBackUrl,
          selfie: selfieUrl,
          verification: "PENDING",
          // CREAR CON TAGS
          tags: {
            connectOrCreate: tagsData,
          },
        },
      });

      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { role: "WORKER" },
      });

      res.json({ message: "Perfil enviado a revisión", profile });
    } catch (error: any) {
      console.error("❌ Error en Prisma:", error);
      res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message });
    }
  },
);

// Agregar este GET a tu archivo de rutas de worker
router.get("/list", async (req, res) => {
  try {
    // Obtenemos el tag de los query params (ej: /list?tag=Plomería)
    const { tag } = req.query;

    const workers = await prisma.workerProfile.findMany({
      where: tag
        ? {
            tags: {
              some: {
                name: tag as string,
              },
            },
          }
        : {}, // Si no hay tag, trae a todos
      include: {
        tags: true, // IMPORTANTE: Incluir los tags para verlos en la Card
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true, // Añadimos avatar
            lastSeen: true, // IMPORTANTE: Para el punto verde de "Online"
          },
        },
      },
    });

    res.json(workers);
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ error: "Error fetching workers" });
  }
});

// apps/server/src/routes/worker.routes.ts

router.get("/profile/:userId", async (req, res) => {
  try {
    const profile = await prisma.workerProfile.findUnique({
      where: { userId: parseInt(req.params.userId) },
      include: {
        tags: true, 
        user: {
          select: {
            name: true,
            avatar: true,
            emailVerified: true,
            receivedReviews: {
              include: {
                reviewer: { select: { name: true } },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!profile) return res.status(404).json({ error: "No profile" });

    const reviews = profile.user.receivedReviews;
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
        : 0;

    res.json({
      ...profile,
      emailVerified: profile.user.emailVerified === true,
      isApproved: profile.verification === "VERIFIED",
      averageRating: averageRating.toFixed(1),
      totalReviews: reviews.length,
      reviews: reviews,
      // Los tags ya van incluidos dentro de '...profile'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/jobs/:id/complete-worker
router.patch("/:id/complete-worker", async (req, res) => {
  const { id } = req.params;
  try {
    const job = await prisma.job.update({
      where: { id: parseInt(id) },
      data: { status: "COMPLETED" },
    });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "No se pudo actualizar el estado" });
  }
});

// apps/server/src/routes/admin.routes.ts o worker.routes.ts

router.patch("/verify-worker/:userId", async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body; // "VERIFIED" o "REJECTED"

  try {
    const updatedProfile = await prisma.workerProfile.update({
      where: { userId: parseInt(userId) },
      data: { verification: status },
    });

    // Opcional: Si es RECHAZADO, podrías enviar una notificación push al usuario
    res.json({ message: `Estado actualizado a ${status}`, updatedProfile });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la verificación" });
  }
});

router.get("/status/:userId", async (req, res) => {
  const profile = await prisma.workerProfile.findUnique({
    where: { userId: parseInt(req.params.userId) },
    select: { verification: true },
  });
  res.json({ verification: profile?.verification || "NONE" });
});

export default router;
