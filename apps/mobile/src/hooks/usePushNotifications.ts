import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import Constants, { ExecutionEnvironment } from "expo-constants";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  !Constants.expoConfig?.extra?.eas?.projectId;

export const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    console.log("No es un dispositivo físico");
    return null;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permisos no concedidos");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: "6cb6f075-c825-4157-b8bf-27f02ee84fd6",
      })
    ).data;

    console.log("Token generado:", token);
    return token;
  } catch (error) {
    console.error("Error obteniendo token:", error);
    return null;
  }
};
