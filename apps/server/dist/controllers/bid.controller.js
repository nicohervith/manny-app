import { prisma } from "../lib/prisma.js";
import { sendPushNotification } from "../services/notification.service.js";
export const applyBid = async (req, res) => {
    try {
        const { jobId, workerId, message, price, availableFrom, availableTo } = req.body;
        const workerUser = await prisma.user.findUnique({
            where: { id: parseInt(workerId) },
            include: { profile: true },
        });
        if (!workerUser?.profile ||
            workerUser.profile.verification !== "VERIFIED") {
            return res.status(403).json({
                error: "Acceso denegado. Tu cuenta debe estar verificada.",
            });
        }
        const existingBid = await prisma.bid.findFirst({
            where: {
                jobId: parseInt(jobId),
                workerId: parseInt(workerId),
            },
        });
        if (existingBid)
            return res.status(400).json({ error: "Already applied" });
        const bid = await prisma.bid.create({
            data: {
                jobId: parseInt(jobId),
                workerId: parseInt(workerId),
                message,
                price: parseFloat(price),
                availableFrom,
                availableTo,
            },
            include: {
                job: {
                    include: { client: true },
                },
            },
        });
        const client = bid.job.client;
        if (client.pushToken) {
            await sendPushNotification(client.pushToken, "¡Nueva propuesta recibida! 🛠️", `${workerUser.name} se postuló para "${bid.job.title}" por $${price}`, { jobId: bid.jobId, type: "NEW_BID" });
        }
        res.status(201).json({ message: "Postulación enviada con éxito", bid });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al enviar la postulación" });
    }
};
export const getWorkerBids = async (req, res) => {
    try {
        const workerId = req.params.workerId;
        const bids = await prisma.bid.findMany({
            where: { workerId: parseInt(workerId) },
            include: {
                job: {
                    include: {
                        client: { select: { name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(bids);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener historial de ofertas" });
    }
};
export const getJobBids = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const bids = await prisma.bid.findMany({
            where: { jobId: parseInt(jobId) },
            include: {
                worker: {
                    select: {
                        name: true,
                        id: true,
                        receivedReviews: { select: { rating: true } },
                    },
                },
            },
            orderBy: { price: "asc" },
        });
        const formattedBids = bids.map((bid) => {
            const reviews = bid.worker.receivedReviews;
            const totalReviews = reviews.length;
            const averageRating = totalReviews > 0
                ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
                : "0.0";
            return {
                ...bid,
                worker: { ...bid.worker, averageRating, totalReviews },
            };
        });
        res.json(formattedBids);
    }
    catch (error) {
        res.status(500).json({ error: "Error al obtener ofertas" });
    }
};
