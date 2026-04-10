import { prisma } from "../lib/prisma.js";
export const completeProfile = async (req, res) => {
    try {
        const { userId, occupation, description, dni, latitude, longitude, hourlyRate, tags, } = req.body;
        if (!userId)
            return res.status(400).json({ error: "El userId es obligatorio" });
        let tagsData = [];
        if (tags) {
            try {
                const parsedTags = JSON.parse(tags);
                tagsData = parsedTags.map((tagName) => ({
                    where: { name: tagName },
                    create: { name: tagName },
                }));
            }
            catch (e) {
                console.error("Error parsing tags:", e);
            }
        }
        const files = req.files;
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
                tags: { set: [], connectOrCreate: tagsData },
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
                tags: { connectOrCreate: tagsData },
            },
        });
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { role: "WORKER" },
        });
        res.json({ message: "Perfil enviado a revisión", profile });
    }
    catch (error) {
        console.error("❌ Error en Prisma:", error);
        res
            .status(500)
            .json({ error: "Error interno del servidor", details: error.message });
    }
};
export const listWorkers = async (req, res) => {
    try {
        const { tag } = req.query;
        const workers = await prisma.workerProfile.findMany({
            where: tag ? { tags: { some: { name: tag } } } : {},
            include: {
                tags: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        lastSeen: true,
                    },
                },
            },
        });
        res.json(workers);
    }
    catch (error) {
        console.error("Error fetching workers:", error);
        res.status(500).json({ error: "Error fetching workers" });
    }
};
export const getWorkerProfile = async (req, res) => {
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
                            include: { reviewer: { select: { name: true } } },
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
            },
        });
        if (!profile)
            return res.status(404).json({ error: "No profile" });
        const reviews = profile.user.receivedReviews;
        const averageRating = reviews.length > 0
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
            : 0;
        res.json({
            ...profile,
            emailVerified: profile.user.emailVerified === true,
            isApproved: profile.verification === "VERIFIED",
            averageRating: averageRating.toFixed(1),
            totalReviews: reviews.length,
            reviews,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};
export const completeWorkerJob = async (req, res) => {
    const id = req.params.id;
    try {
        const job = await prisma.job.update({
            where: { id: parseInt(id) },
            data: { status: "COMPLETED" },
        });
        res.json(job);
    }
    catch (error) {
        res.status(500).json({ error: "No se pudo actualizar el estado" });
    }
};
export const verifyWorkerStatus = async (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;
    try {
        const updatedProfile = await prisma.workerProfile.update({
            where: { userId: parseInt(userId) },
            data: { verification: status },
        });
        res.json({ message: `Estado actualizado a ${status}`, updatedProfile });
    }
    catch (error) {
        res.status(500).json({ error: "Error al actualizar la verificación" });
    }
};
export const getWorkerVerificationStatus = async (req, res) => {
    const profile = await prisma.workerProfile.findUnique({
        where: { userId: parseInt(req.params.userId) },
        select: { verification: true },
    });
    res.json({ verification: profile?.verification || "NONE" });
};
export const saveDraft = async (req, res) => {
    const { userId, occupation, description, hourlyRate, latitude, longitude, tags, } = req.body;
    try {
        const profile = await prisma.workerProfile.upsert({
            where: { userId: parseInt(userId) },
            update: {
                occupation: occupation || undefined,
                description: description || undefined,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                tags: tags
                    ? {
                        set: [],
                        connectOrCreate: JSON.parse(tags).map((name) => ({
                            where: { name },
                            create: { name },
                        })),
                    }
                    : undefined,
            },
            create: {
                userId: parseInt(userId),
                occupation: occupation || "",
                description: description || "",
                dni: "",
                verification: "PENDING",
            },
        });
        res.json({ message: "Borrador guardado", profile });
    }
    catch (error) {
        res.status(500).json({ error: "Error al guardar borrador" });
    }
};
