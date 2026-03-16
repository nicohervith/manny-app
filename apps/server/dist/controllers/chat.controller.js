// apps/server/src/controllers/chat.controller.ts
import { prisma } from "../lib/prisma.js";
import { sendPushNotification } from "../services/notification.service.js";
// ─────────────────────────────────────────────
// POST /api/chat/send
// ─────────────────────────────────────────────
export const sendMessage = async (req, res) => {
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
                        worker: { select: { id: true, pushToken: true } },
                    },
                },
            },
        });
        const fullMessage = message;
        const io = req.app.get("io");
        io.to(`chat_${jobId}`).emit("new-message", fullMessage);
        const job = fullMessage.job;
        const targetToken = job.clientId === parseInt(senderId)
            ? job.worker?.pushToken
            : job.client?.pushToken;
        console.log("=== DEBUG PUSH ===");
        console.log("senderId:", senderId, "clientId:", job.clientId);
        console.log("targetToken:", targetToken);
        console.log("==================");
        if (targetToken) {
            await sendPushNotification(targetToken, fullMessage.sender.name, content, { jobId: jobId.toString(), type: "CHAT" });
        }
        res.json(fullMessage);
    }
    catch (error) {
        console.error("Error en sendMessage:", error);
        res.status(500).json({ error: "Error sending message" });
    }
};
// ─────────────────────────────────────────────
// GET /api/chat/:jobId
// ─────────────────────────────────────────────
export const getMessages = async (req, res) => {
    try {
        const jobId = parseInt(req.params.jobId);
        const [messages, job] = await Promise.all([
            prisma.message.findMany({
                where: { jobId },
                orderBy: { createdAt: "asc" },
                include: { sender: { select: { name: true } } },
            }),
            prisma.job.findUnique({
                where: { id: jobId },
                include: {
                    client: { select: { id: true, name: true } },
                    worker: { select: { id: true, name: true } },
                },
            }),
        ]);
        res.json({ messages, job });
    }
    catch (error) {
        console.error("Error en getMessages:", error);
        res.status(500).json({ error: "Error fetching messages" });
    }
};
// ─────────────────────────────────────────────
// GET /api/chat/list/:userId
// ─────────────────────────────────────────────
export const listChats = async (req, res) => {
    try {
        const id = parseInt(req.params.userId);
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() - 24);
        const chats = await prisma.job.findMany({
            where: {
                AND: [
                    { OR: [{ clientId: id }, { workerId: id }] },
                    {
                        OR: [
                            { status: "IN_PROGRESS" },
                            { status: "COMPLETED", updatedAt: { gte: expirationDate } },
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
                            where: { read: false, NOT: { senderId: id } },
                        },
                    },
                },
                client: { select: { name: true } },
                worker: { select: { name: true } },
            },
            orderBy: { updatedAt: "desc" },
        });
        res.json(chats);
    }
    catch (error) {
        console.error("Error en listChats:", error);
        res.status(500).json({ error: "Error al obtener lista de chats" });
    }
};
// ─────────────────────────────────────────────
// PATCH /api/chat/read-all/:jobId/:userId
// ─────────────────────────────────────────────
export const markAsRead = async (req, res) => {
    try {
        const jobId = parseInt(req.params.jobId);
        const userId = parseInt(req.params.userId);
        await prisma.message.updateMany({
            where: {
                jobId,
                NOT: { senderId: userId },
                read: false,
            },
            data: { read: true },
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error en markAsRead:", error);
        res.status(500).json({ error: "Error al marcar mensajes como leídos" });
    }
};
