// apps/server/src/controllers/payment.controller.ts
import axios from "axios";
import { MercadoPagoConfig, Preference } from "mercadopago";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { sendPushNotification } from "../services/notification.service.js";
// ─────────────────────────────────────────────
// Helper: Refresh token del worker
// ─────────────────────────────────────────────
async function refreshWorkerToken(workerId) {
    const profile = await prisma.workerProfile.findUnique({
        where: { userId: workerId },
    });
    const response = await axios.post("https://api.mercadopago.com/oauth/token", {
        client_secret: process.env.MP_CLIENT_SECRET,
        client_id: process.env.MP_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: profile?.workerRefreshToken,
    });
    await prisma.workerProfile.update({
        where: { userId: workerId },
        data: {
            workerAccessToken: response.data.access_token,
            workerRefreshToken: response.data.refresh_token,
        },
    });
    return response.data.access_token;
}
// ─────────────────────────────────────────────
// POST /api/payments/create-preference
// ─────────────────────────────────────────────
export const createPreference = async (req, res) => {
    console.log("== NUEVA SOLICITUD DE PREFERENCIA ==");
    console.log("Body recibido:", req.body);
    const { jobId, price, workerId } = req.body;
    const commission = price * 0.1;
    try {
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job || job.workerId !== workerId) {
            return res.status(403).json({ error: "No autorizado" });
        }
        const workerProfile = await prisma.workerProfile.findUnique({
            where: { userId: workerId },
        });
        if (!workerProfile?.workerAccessToken) {
            return res
                .status(400)
                .json({ error: "El trabajador debe vincular Mercado Pago" });
        }
        const workerClient = new MercadoPagoConfig({
            accessToken: workerProfile.workerAccessToken,
        });
        const preference = new Preference(workerClient);
        const notificationUrl = `${process.env.SERVER_URL}/api/payments/webhook`;
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: jobId.toString(),
                        title: `Servicio Manny Oficios - ID ${jobId}`,
                        quantity: 1,
                        unit_price: price,
                        currency_id: "ARS",
                    },
                ],
                marketplace_fee: commission,
                external_reference: jobId.toString(),
                back_urls: {
                    success: "manny-oficios-cerca://checkout/congrats",
                    failure: "manny-oficios-cerca://checkout/congrats",
                    pending: "manny-oficios-cerca://checkout/congrats",
                },
                auto_return: "approved",
                notification_url: notificationUrl,
            },
        });
        res.json({ id: result.id });
    }
    catch (error) {
        if (error.status === 401) {
            await refreshWorkerToken(workerId);
        }
        console.error("Detalle del error de MP:", error.response?.data || error.message);
        res.status(500).json({
            error: "Error al crear la preferencia",
            details: error.response?.data,
        });
    }
};
// ─────────────────────────────────────────────
// POST /api/payments/webhook
// ─────────────────────────────────────────────
export const webhook = async (req, res) => {
    const signature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];
    if (!signature) {
        return res.sendStatus(400);
    }
    const [tsPart, v1Part] = signature.split(",");
    const ts = tsPart?.split("=")[1];
    const v1 = v1Part?.split("=")[1];
    const manifest = `id:${req.query["data.id"]};request-id:${xRequestId};ts:${ts};`;
    const hmac = crypto.createHmac("sha256", process.env.MP_WEBHOOK_SECRET || "");
    hmac.update(manifest);
    const hash = hmac.digest("hex");
    if (hash !== v1) {
        return res.sendStatus(400);
    }
    const { action, data, type } = req.body;
    if (type === "payment" || action?.includes("payment")) {
        const paymentId = data.id;
        try {
            const paymentInfo = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
            });
            if (paymentInfo.data.status === "approved") {
                const jobId = paymentInfo.data.external_reference;
                const job = await prisma.job.findUnique({
                    where: { id: parseInt(jobId) },
                    include: {
                        worker: { select: { pushToken: true, name: true } },
                        client: { select: { name: true } },
                    },
                });
                await prisma.$transaction([
                    prisma.job.update({
                        where: { id: parseInt(jobId) },
                        data: { status: "PAID" },
                    }),
                    prisma.transaction.create({
                        data: {
                            jobId: parseInt(jobId),
                            mpPaymentId: paymentId.toString(),
                            totalAmount: paymentInfo.data.transaction_amount,
                            commission: paymentInfo.data.fee_details.find((f) => f.type === "marketplace_fee")?.amount || 0,
                            workerNet: paymentInfo.data.transaction_details.net_received_amount,
                            status: "APPROVED",
                        },
                    }),
                ]);
                if (job?.worker?.pushToken) {
                    await sendPushNotification(job.worker.pushToken, "¡Pago recibido! 💰", `${job.client?.name} pagó el trabajo "${job?.title}"`, { jobId: jobId.toString(), type: "PAYMENT_RECEIVED" });
                }
            }
        }
        catch (e) {
            console.error("Error procesando webhook:", e);
        }
    }
    res.sendStatus(200);
};
// ─────────────────────────────────────────────
// GET /api/payments/auth/url/:workerId
// ─────────────────────────────────────────────
export const getAuthUrl = (req, res) => {
    const { workerId } = req.params;
    const clientId = process.env.MP_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.MP_REDIRECT_URI || "");
    const url = `https://auth.mercadopago.com.ar/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${workerId}&redirect_uri=${redirectUri}`;
    res.json({ url });
};
// ─────────────────────────────────────────────
// GET /api/payments/oauth/callback
// ─────────────────────────────────────────────
export const oauthCallback = async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state) {
        return res.status(400).send("Faltan parámetros de autorización.");
    }
    try {
        const response = await axios.post("https://api.mercadopago.com/oauth/token", {
            client_secret: process.env.MP_CLIENT_SECRET,
            client_id: process.env.MP_CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: process.env.MP_REDIRECT_URI,
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            },
        });
        const { access_token, refresh_token, user_id } = response.data;
        await prisma.workerProfile.update({
            where: { userId: parseInt(state) },
            data: {
                mercadopagoId: user_id.toString(),
                workerAccessToken: access_token,
                workerRefreshToken: refresh_token,
            },
        });
        console.log(`✅ Token guardado para el worker ${state}`);
        res.redirect("manny-oficios-cerca://profile?status=mp_connected");
    }
    catch (error) {
        console.error("Error en OAuth Callback:", error.response?.data || error.message);
        res.redirect("manny-oficios-cerca://profile?status=error");
    }
};
