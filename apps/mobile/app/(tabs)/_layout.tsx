// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

export default function TabLayout() {
  const [role, setRole] = useState<string | null>(null);

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

  if (!role) return null;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#007AFF" }}>
      {/* Vista de profesionales (Solo Cliente) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Profesionales",
          // Usamos casting "as any" para evitar el error de tipado de Expo Router
          href: role === "CLIENT" ? "/" : (null as any),
        }}
      />

      {/* Vista de trabajos (Solo Trabajador) */}
      <Tabs.Screen
        name="worker-feed"
        options={{
          title: "Trabajos",
          href: role === "WORKER" ? "/worker-feed" : (null as any),
        }}
      />

      {/* Publicar Trabajo (Solo Cliente) */}
      <Tabs.Screen
        name="create-job"
        options={{
          title: "Publicar",
          href: role === "CLIENT" ? "/create-job" : (null as any),
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
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
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
    </Tabs>
  );
}
