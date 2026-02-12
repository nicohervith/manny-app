/* import { Expo } from "expo-server-sdk"; */
/* const expo = new Expo(); */
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

// Enviar un mensaje
// apps/server/src/routes/chat.routes.ts
router.post("/send", async (req, res) => {
  try {
    const { jobId, senderId, content } = req.body;

    const message = await prisma.message.create({
      data: {
        jobId: parseInt(jobId), // Convertir a número
        senderId: parseInt(senderId),
        content,
      },
      include: { sender: { select: { name: true } } },
    });

    const io = req.app.get("io");
    // Emitir a la sala "chat_X"
    io.to(`chat_${jobId}`).emit("new-message", message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: "Error sending message" });
  }
});
// Obtener mensajes de un trabajo
router.get("/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const messages = await prisma.message.findMany({
      where: { jobId: parseInt(jobId) },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { name: true } } },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Error fetching messages" });
  }
});

// apps/server/src/routes/chat.routes.ts
router.get("/list/:userId", async (req, res) => {
  const { userId } = req.params;
  const id = parseInt(userId);

  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() - 24);

  try {
    const chats = await prisma.job.findMany({
      where: {
        AND: [
          { OR: [{ clientId: id }, { workerId: id }] },
          {
            OR: [
              { status: "IN_PROGRESS" },
              {
                status: "COMPLETED",
                updatedAt: { gte: expirationDate },
              },
            ],
          },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                NOT: { senderId: id },
              },
            },
          },
        },
        client: { select: { name: true } },
        worker: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(chats);
  } catch (error) {
    console.error(error); // Agregamos log para debug
    res.status(500).json({ error: "Error al obtener lista de chats" });
  }
});

// Endpoint para marcar como leído
router.patch("/read-all/:jobId/:userId", async (req, res) => {
  const { jobId, userId } = req.params;
  await prisma.message.updateMany({
    where: {
      jobId: parseInt(jobId),
      NOT: { senderId: parseInt(userId) },
      read: false,
    },
    data: { read: true },
  });
  res.json({ success: true });
});

export default router;
