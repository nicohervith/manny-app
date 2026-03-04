import { Expo } from "expo-server-sdk";
let expo = new Expo();
export const sendPushNotification = async (targetToken, title, body, data) => {
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
        await expo.sendPushNotificationsAsync(messages);
    }
    catch (error) {
        console.error(error);
    }
};
