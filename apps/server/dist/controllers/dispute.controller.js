import { prisma } from "../lib/prisma.js";
export const createDispute = async (req, res) => {
    const { jobId, reason } = req.body;
    if (!jobId || !reason) {
        return res.status(400).json({ error: "jobId y reason son obligatorios" });
    }
    try {
        const dispute = await prisma.dispute.create({
            data: {
                jobId: parseInt(jobId),
                reason,
                status: "OPEN",
            },
        });
        // Cambiar el estado del job a DISPUTED
        await prisma.job.update({
            where: { id: parseInt(jobId) },
            data: { status: "DISPUTED" },
        });
        res.status(201).json({ message: "Reporte enviado correctamente", dispute });
    }
    catch (error) {
        console.error("Error en createDispute:", error);
        // Si el dispute ya existe para ese job (UNIQUE constraint)
        if (error.code === "P2002") {
            return res
                .status(409)
                .json({ error: "Ya existe un reporte para este trabajo" });
        }
        res.status(500).json({ error: "Error al crear el reporte" });
    }
};
