import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

import Constants, { ExecutionEnvironment } from "expo-constants";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const registerForPushNotificationsAsync = async () => {
  if (isExpoGo) {
    console.warn(
      "Saltando registro de Push: Expo Go (SDK 53+) no soporta notificaciones remotas.",
    );
    return null;
  }
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Fallo al obtener el token para notificaciones push");
      return;
    }

    // El projectID se saca de app.json (extra.eas.projectId)
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log("Debes usar un dispositivo físico para notificaciones push");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
};
