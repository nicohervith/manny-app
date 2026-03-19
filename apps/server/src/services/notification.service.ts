import { Expo } from "expo-server-sdk";

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
      data: data, // Aquí puedes mandar el jobId para que al tocar la notificación abra el chat
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
