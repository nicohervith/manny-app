import axios from "axios"; // 1. IMPORTANTE: Instala axios si no lo hiciste
import { Router } from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "../lib/prisma.js";

const router = Router();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "",
});

router.post("/create-preference", async (req, res) => {
  console.log("== NUEVA SOLICITUD DE PREFERENCIA ==");
  console.log("Body recibido:", req.body);

  const { jobId, price, workerId } = req.body;
  const commission = price * 0.1;

  try {
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
            title: `Servicio FindJob - ID ${jobId}`,
            quantity: 1,
            unit_price: price,
            currency_id: "ARS",
          },
        ],
        marketplace_fee: commission,
        external_reference: jobId.toString(),

        back_urls: {
          success: "findjob://checkout/congrats",
          failure: "findjob://checkout/congrats",
          pending: "findjob://checkout/congrats",
        },
        auto_return: "approved",
        notification_url: notificationUrl,
      },
    });

    res.json({ id: result.id });
  } catch (error: any) {
    console.error(
      "Detalle del error de MP:",
      error.response?.data || error.message,
    );

    res.status(500).json({
      error: "Error al crear la preferencia",
      details: error.response?.data, // Enviamos el detalle al front para verlo en el log del móvil
    });
  }
});

router.post("/webhook", async (req, res) => {
  const { action, data, type } = req.body;

  // Mercado Pago envía notificaciones de tipo 'payment'
  if (type === "payment" || action?.includes("payment")) {
    const paymentId = data.id;

    try {
      const paymentInfo = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
        },
      );

      if (paymentInfo.data.status === "approved") {
        const jobId = paymentInfo.data.external_reference;

        // Actualizamos Job y creamos Transacción
        await prisma.$transaction([
          prisma.job.update({
            where: { id: parseInt(jobId) },
            data: { status: "PAID" }, // O el estado que definas
          }),
          prisma.transaction.create({
            data: {
              jobId: parseInt(jobId),
              mpPaymentId: paymentId.toString(),
              totalAmount: paymentInfo.data.transaction_amount,
              commission:
                paymentInfo.data.fee_details.find(
                  (f: any) => f.type === "marketplace_fee",
                )?.amount || 0,
              workerNet:
                paymentInfo.data.transaction_details.net_received_amount,
              status: "APPROVED",
            },
          }),
        ]);
      }
    } catch (e) {
      console.error("Error procesando webhook:", e);
    }
  }
  res.sendStatus(200);
});

router.get("/auth/url/:workerId", (req, res) => {
  const { workerId } = req.params;
  const clientId = process.env.MP_CLIENT_ID;

  const redirectUri = encodeURIComponent(process.env.MP_REDIRECT_URI || "");

  const url = `https://auth.mercadopago.com.ar/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${workerId}&redirect_uri=${redirectUri}`;

  res.json({ url });
});

router.get("/oauth/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send("Faltan parámetros de autorización.");
  }

  try {
    // 1. Intercambiamos el 'authorization_code' por los tokens reales
    const response = await axios.post(
      "https://api.mercadopago.com/oauth/token",
      {
        // VERIFICA QUE ESTOS NOMBRES COINCIDAN CON TU .ENV
        client_secret: process.env.MP_CLIENT_SECRET,
        client_id: process.env.MP_CLIENT_ID,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.MP_REDIRECT_URI,
      },
      {
        headers: {
          "Content-Type": "application/json",
          // Algunos entornos requieren el token de la plataforma también aquí
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      },
    );

    const { access_token, refresh_token, user_id } = response.data;

    // 2. Guardamos en la DB (Asegúrate de limpiar antes el registro si vas a re-vincular)
    await prisma.workerProfile.update({
      where: { userId: parseInt(state as string) },
      data: {
        mercadopagoId: user_id.toString(),
        workerAccessToken: access_token,
        workerRefreshToken: refresh_token,
      },
    });

    console.log(`✅ Token guardado para el worker ${state}`);
    res.redirect("findjob://profile?status=mp_connected");
  } catch (error: any) {
    console.error(
      "Error en OAuth Callback:",
      error.response?.data || error.message,
    );
    res.redirect("findjob://profile?status=error");
  }
});

async function refreshWorkerToken(workerId: number) {
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
}

export default router;
