import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
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

  // 2. REGISTRO DE PUSH TOKEN Y UNIÓN A SALAS
  useEffect(() => {
    if (!user) return;

    const initializeServices = async () => {
      // Registrar Push Token en el servidor
      const token = await registerForPushNotificationsAsync();
      if (token) {
        try {
          await api.patch(`/api/users/update-push-token/${user.id}`, {
            pushToken: token,
          });
          console.log("Push Token guardado");
        } catch (e) {
          console.error("Error guardando Push Token", e);
        }
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

  // Si no hay usuario cargado aún, no mostramos los tabs
  if (!user) return null;

  const role = user.role;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#007AFF" }}>
      {/* Vista de profesionales (Solo Cliente) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Profesionales",
          href: role === "CLIENT" ? "/" : (null as any),
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={24} color={color} />
          ),
        }}
      />

      {/* Vista de trabajos (Solo Trabajador) */}
      <Tabs.Screen
        name="worker-feed"
        options={{
          title: "Trabajos",
          href: role === "WORKER" ? "/worker-feed" : (null as any),
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
        name="verify-workers"
        options={{
          title: "Validar",
          href: role === "ADMIN" ? "/verify-workers" : null, // Oculta el tab si no es ADMIN
          tabBarIcon: ({ color }) => (
            <Ionicons name="shield-checkmark" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
