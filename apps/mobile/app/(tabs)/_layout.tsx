import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
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

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/api/chat/list/${user.id}`);
      const total = res.data.reduce(
        (acc: number, chat: any) => acc + (chat._count?.messages || 0),
        0,
      );
      setUnreadCount(total);
    } catch (e) {
      console.error("Error fetching unread count:", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const initializeServices = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        console.log("Push token obtenido:", token);

        if (token) {
          console.log("Guardando token para usuario:", user.id);
          const res = await api.patch(
            `/api/users/update-push-token/${user.id}`,
            {
              pushToken: token,
            },
          );
          console.log("Respuesta guardar token:", res.status);
        } else {
          console.log("No se obtuvo token");
        }
      } catch (e) {
        console.warn(
          "Las notificaciones no están disponibles en este entorno (Probablemente Expo Go)",
        );
      }

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

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as {
          jobId?: string | number;
          type?: string;
        };

        const { jobId, type } = data;

        if (type === "NEW_BID" && jobId) {
          // @ts-ignore
          router.push(`/(tabs)/my-jobs/${jobId}`);
        }
        if (type === "BID_ACCEPTED" && jobId) {
          router.push("/(tabs)/my-bids");
        }
        if (type === "JOB_COMPLETED" && jobId) {
          router.push(`/(tabs)/my-jobs`);
        }
      },
    );

    return () => subscription.remove();
  }, []);

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
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.off("new-message");
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/chats") {
      setUnreadCount(0);
    }
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
    if (role === "ADMIN" && (pathname === "/" || pathname === "/worker-feed")) {
      router.replace("/verify-workers");
    }
  }, [user, pathname]);

  if (!user) return null;

  const role = user.role;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#007AFF" }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Profesionales",
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
          href: role === "WORKER" ? "/worker-feed" : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="hammer" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create-job"
        options={{
          title: "Publicar",
          href: role === "CLIENT" ? "/create-job" : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chats"
        options={{
          title: "Mensajes",
          href: role === "ADMIN" ? null : "/chats",
          tabBarIcon: ({ color }) => (
            <View>
              <Ionicons name="chatbubbles" size={24} color={color} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    right: -6,
                    top: -4,
                    backgroundColor: "#FF3B30",
                    borderRadius: 10,
                    width: 18,
                    height: 18,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
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
