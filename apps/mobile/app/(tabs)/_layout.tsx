import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import { io } from "socket.io-client";
import { API_URL } from "../../src/constants/Config";
import { useAuth } from "../../src/context/AuthContext";
import { registerForPushNotificationsAsync } from "../../src/hooks/usePushNotifications";
import api from "../../src/services/api";

const socket = io(API_URL.replace("/api", ""), {
  transports: ["websocket"],
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function TabLayout() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const initializeServices = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        // Solo intentamos guardar si realmente obtuvimos un token
        if (token) {
          await api.patch(`/api/users/update-push-token/${user.id}`, {
            pushToken: token,
          });
          console.log("Push Token guardado");
        }
      } catch (e) {
        // Esto atrapará el error de Expo Go sin romper la app
        console.warn(
          "Las notificaciones no están disponibles en este entorno (Probablemente Expo Go)",
        );
      }

      // El socket sí debería funcionar en Expo Go, así que lo dejamos fuera del catch anterior o en su propio bloque
      try {
        const res = await api.get(`/api/chat/list/${user.id}`);
        res.data.forEach((chat: any) => {
          socket.emit("join-chat", chat.id);
        });
      } catch (e) {
        console.error("Error uniendo a salas", e);
      }
    };

    initializeServices();
  }, [user]);

  // 3. MANEJO DE CLIC EN NOTIFICACIÓN (Deep Linking)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // 1. Extraemos los datos y les asignamos un tipo (casting)
        const data = response.notification.request.content.data as {
          jobId?: string | number;
          type?: string;
        };

        const { jobId, type } = data;

        if (type === "NEW_BID" && jobId) {
          // @ts-ignore
          router.push(`/(tabs)/my-jobs/${jobId}`);
        }
        if (type === "JOB_COMPLETED" && jobId) {
          router.push(`/(tabs)/my-jobs`);
        }
      },
    );

    return () => subscription.remove();
  }, []);

  // 4. LÓGICA DE SOCKETS (Se mantiene similar, pero usando 'user')
  useEffect(() => {
    socket.on("new-message", (message) => {
      const chatRoute = `/chat/${message.jobId}`;
      if (pathname !== chatRoute) {
        Toast.show({
          type: "info",
          text1: `Mensaje de ${message.sender?.name || "Alguien"}`,
          text2: message.content,
          onPress: () => {
            router.push({
              pathname: "/chat/[jobId]",
              params: { jobId: message.jobId },
            });
            Toast.hide();
          },
        });
      }
    });

    return () => {
      socket.off("new-message");
    };
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    const role = user.role;

    if (role === "WORKER" && pathname === "/") {
      router.replace("/worker-feed");
    }
    if (role === "CLIENT" && pathname === "/worker-feed") {
      router.replace("/");
    }
  }, [user, pathname]);

  if (!user) return null;

  const role = user.role;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#007AFF" }}>
      {/* Vista de profesionales (Solo Cliente) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Profesionales",
          // Si es Worker, ocultamos el TAB por completo
          href: role === "CLIENT" ? "/" : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="worker-feed"
        options={{
          title: "Trabajos",
          // Si es Client, ocultamos el TAB por completo
          href: role === "WORKER" ? "/worker-feed" : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="hammer" size={24} color={color} />
          ),
        }}
      />

      {/* Publicar Trabajo (Solo Cliente) */}
      <Tabs.Screen
        name="create-job"
        options={{
          title: "Publicar",
          // href controla la visibilidad para el Worker
          href: role === "CLIENT" ? "/create-job" : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={28} color={color} />
          ),
        }}
      />

      {/* NUEVA: Lista de Chats (Para ambos roles) */}
      <Tabs.Screen
        name="chats"
        options={{
          title: "Mensajes",
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-jobs"
        options={{
          title: "Mis Pedidos",
          href: role === "CLIENT" ? "/my-jobs" : (null as any),
          tabBarIcon: ({ color }) => (
            <Ionicons name="list" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-bids"
        options={{
          title: "Mis Ofertas",
          href: role === "WORKER" ? "/my-bids" : (null as any),
          tabBarIcon: ({ color }) => (
            <Ionicons name="briefcase" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="disputes"
        options={{
          title: "Disputas",
          href: role === "ADMIN" ? "/disputes" : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="warning" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="verify-workers"
        options={{
          title: "Validar",
          href: role === "ADMIN" ? "/verify-workers" : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="shield-checkmark" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
