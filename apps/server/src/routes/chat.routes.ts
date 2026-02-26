import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { sendPushNotification } from "../services/notification.service.js";

const router = Router();

router.post("/send", async (req, res) => {
  try {
    const { jobId, senderId, content } = req.body;

    const message = await prisma.message.create({
      data: {
        jobId: parseInt(jobId),
        senderId: parseInt(senderId),
        content,
      },
      include: {
        sender: { select: { name: true } },
        job: {
          include: {
            client: { select: { id: true, pushToken: true } },
            worker: { select: { id: true, pushToken: true } }, // 'worker' ya es un User
          },
        },
      },
    });

    // Casteamos a 'any' para evitar que TS se queje de las relaciones incluidas
    const fullMessage = message as any;

    // 1. Emitir por Socket.io
    const io = req.app.get("io");
    io.to(`chat_${jobId}`).emit("new-message", fullMessage);

    // 2. Lógica de Notificación Push
    const job = fullMessage.job;
    let targetToken = null;

    // Si el que envía es el Cliente (clientId), el destino es el Worker
    if (job.clientId === parseInt(senderId)) {
      targetToken = job.worker?.pushToken;
    } else {
      // Si el que envía es el Worker (u otro), el destino es el Cliente
      targetToken = job.client?.pushToken;
    }

    if (targetToken) {
      console.log(`Enviando Push a token: ${targetToken}`);
      await sendPushNotification(
        targetToken,
        fullMessage.sender.name, // "Nicolas"
        content, // "Hola, estoy llegando"
        { jobId: jobId.toString(), type: "CHAT" },
      );
    }

    res.json(fullMessage);
  } catch (error) {
    console.error("Error en /send:", error);
    res.status(500).json({ error: "Error sending message" });
  }
});

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
    console.error(error);
    res.status(500).json({ error: "Error al obtener lista de chats" });
  }
});

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
