import { PrismaClient } from "@prisma/client";
import { Expo } from "expo-server-sdk";

const prisma = new PrismaClient();
let expo = new Expo();

export const sendPushNotification = async (
  targetToken: string,
  title: string,
  body: string,
  data?: any,
) => {
  if (!Expo.isExpoPushToken(targetToken)) {
    console.error(`Token ${targetToken} no es un token de Expo válido`);
    return;
  }

  const messages = [
    {
      to: targetToken,
      sound: "default",
      title: title,
      body: body,
      data: data,
    },
  ];

  try {
    const tickets = await expo.sendPushNotificationsAsync(messages);
    console.log("Push tickets:", JSON.stringify(tickets));
    tickets.forEach((ticket) => {
      if (ticket.status === "error") {
        console.error("Error ticket:", ticket.message, ticket.details);
      }
    });
  } catch (error) {
    console.error("Error enviando push:", error);
  }
};

export const notifyNearbyJobs = async () => {
  const workers = await prisma.user.findMany({
    where: {
      role: "WORKER",
      pushToken: { not: null },
      profile: {
        latitude: { not: null },
        longitude: { not: null },
      },
    },
    include: {
      profile: true,
    },
  });

  for (const worker of workers) {
    if (
      !worker.profile ||
      worker.profile.latitude === null ||
      worker.profile.longitude === null
    ) {
      continue;
    }

    const lat = worker.profile.latitude;
    const lng = worker.profile.longitude;

    const nearbyJobs: any[] = await prisma.$queryRaw`
      SELECT id, title, 
      (6371 * acos(cos(radians(${lat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(latitude)))) AS distance 
      FROM \`Job\`
      WHERE status = 'PENDING' 
      HAVING distance < 10 
      ORDER BY distance ASC 
      LIMIT 3
    `;

    if (nearbyJobs.length > 0 && worker.pushToken) {
      const messages = [
        {
          to: worker.pushToken,
          sound: "default" as const,
          title: "💼 ¡Trabajos nuevos cerca!",
          body: `Hay ${nearbyJobs.length} pedidos de ${nearbyJobs[0].title} y otros cerca de tu ubicación.`,
          data: { screen: "worker-feed", jobId: nearbyJobs[0].id },
        },
      ];

      try {
        await expo.sendPushNotificationsAsync(messages);
      } catch (err) {
        console.error("Error enviando notificación a worker:", worker.id, err);
      }
    }
  }
};
