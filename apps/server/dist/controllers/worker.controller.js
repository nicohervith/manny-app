import { prisma } from "../lib/prisma.js";
export const completeProfile = async (req, res) => {
    try {
        const { userId, occupation, description, dni, latitude, longitude, hourlyRate, province, city, tags, } = req.body;
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
        const existing = await prisma.workerProfile.findUnique({
            where: { userId: parseInt(userId) },
            select: { dniFront: true, dniBack: true, selfie: true },
        });
        const finalDniFront = dniFrontUrl || existing?.dniFront;
        const finalDniBack = dniBackUrl || existing?.dniBack;
        const finalSelfie = selfieUrl || existing?.selfie;
        const hasAllPhotos = !!finalDniFront && !!finalDniBack && !!finalSelfie;
        const hasLocation = !!latitude;
        const hasDni = !!dni;
        const verificationStatus = hasAllPhotos && hasLocation && hasDni ? "PENDING" : "INCOMPLETE";
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
                verification: verificationStatus,
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
                verification: verificationStatus,
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
            where: {
                verification: "VERIFIED",
                ...(tag ? { tags: { some: { name: tag } } } : {}),
            },
            include: {
                tags: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        lastSeen: true,
                        receivedReviews: { select: { rating: true } },
                    },
                },
            },
        });
        // Calcular promedio y ordenar
        const workersWithRating = workers.map((w) => {
            const reviews = w.user.receivedReviews;
            const avgRating = reviews.length > 0
                ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
                : 0;
            return { ...w, averageRating: avgRating, totalReviews: reviews.length };
        });
        workersWithRating.sort((a, b) => {
            if (b.totalReviews !== a.totalReviews)
                return b.totalReviews - a.totalReviews;
            return b.averageRating - a.averageRating;
        });
        res.json(workersWithRating);
    }
    catch (error) {
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
    res.json({ verification: profile?.verification || "NOT_STARTED" });
};
export const saveDraft = async (req, res) => {
    const { userId, occupation, description, hourlyRate, latitude, longitude, province, city, tags, } = req.body;
    try {
        const profile = await prisma.workerProfile.upsert({
            where: { userId: parseInt(userId) },
            update: {
                occupation: occupation || undefined,
                description: description || undefined,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                province: province || undefined,
                city: city || undefined,
                tags: tags
                    ? {
                        set: [],
                        connectOrCreate: JSON.parse(tags).map((name) => ({
                            where: { name },
                            create: { name },
                        })),
                    }
                    : undefined,
                verification: "DRAFT",
            },
            create: {
                userId: parseInt(userId),
                occupation: occupation || "",
                description: description || "",
                dni: "",
                province: province || "",
                city: city || "",
                verification: "DRAFT",
            },
        });
        res.json({ message: "Borrador guardado", profile });
    }
    catch (error) {
        res.status(500).json({ error: "Error al guardar borrador" });
    }
};
