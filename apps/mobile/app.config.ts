export default {
  expo: {
    name: "Manny Oficios Cerca",
    slug: "manny-oficios-cerca",
    version: "1.1.3",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "manny-oficios-cerca",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      versionCode: 28,
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#E6F4FE",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "manny-oficios-cerca",
              host: "checkout",
              pathPrefix: "/congrats",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      package: "com.manny.oficioscerca",
      googleServicesFile: "./google-services.json",
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "CAMERA"],
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
      softwareKeyboardLayoutMode: "resize",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Esta app necesita acceso a tu ubicación para mostrarte trabajos cercanos.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-secure-store",
      "expo-notifications",
      "@react-native-community/datetimepicker",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "6cb6f075-c825-4157-b8bf-27f02ee84fd6",
      },
    },
    owner: "nicolashervith",
  },
};
