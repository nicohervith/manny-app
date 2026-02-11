import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Tabs, usePathname, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { io } from "socket.io-client";
import { API_URL } from "../../src/constants/Config";

// Inicializamos el socket (asegúrate de que la URL sea la misma que en ChatScreen)
const socket = io(API_URL.replace("/api", ""), {
  transports: ["websocket"],
});

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const getRole = async () => {
      const userData = await SecureStore.getItemAsync("userData");
      if (userData) {
        const user = JSON.parse(userData);
        setRole(user.role);
      }
    };
    getRole();
  }, []);

  // Lógica global para Toasts de nuevos mensajes
  useEffect(() => {
    socket.on("new-message", (message) => {
      // Verificamos si el usuario NO está actualmente en esa pantalla de chat
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

  // app/(tabs)/_layout.tsx

  useEffect(() => {
    const initSocketAndRole = async () => {
      const userData = await SecureStore.getItemAsync("userData");
      if (userData) {
        const user = JSON.parse(userData);
        setRole(user.role);

        // 1. Buscamos los chats activos del usuario para unirnos a las salas
        try {
          const res = await axios.get(`${API_URL}/api/chat/list/${user.id}`);
          const activeChats = res.data;

          // 2. Nos unimos a la sala de cada chat para recibir notificaciones
          activeChats.forEach((chat: any) => {
            socket.emit("join-chat", chat.id);
          });
          console.log("Suscrito a salas de chat para notificaciones");
        } catch (e) {
          console.error("Error uniendo a salas globales", e);
        }
      }
    };
    initSocketAndRole();
  }, []);

  if (!role) return null;

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
          href: role === "CLIENT" ? "/create-job" : (null as any),
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={24} color={color} />
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
    </Tabs>
  );
}
