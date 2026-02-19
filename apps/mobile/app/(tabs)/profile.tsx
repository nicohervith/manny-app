import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_URL } from "../../src/constants/Config";

export default function ProfileScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync("userData").then((data) => {
      const user = JSON.parse(data || "{}");
      setRole(user.role);
    });
  }, []);

  const handleLinkMercadoPago = async () => {
    try {
      const userData = await SecureStore.getItemAsync("userData");
      const user = JSON.parse(userData || "{}");

      const response = await axios.get(
        `${API_URL}/api/payments/auth/url/${user.id}`,
      );

      // IMPORTANTE: El segundo parámetro debe coincidir con tu app config (app.json)
      const result = await WebBrowser.openAuthSessionAsync(
        response.data.url,
        "findjob://profile",
      );

      if (result.type === "success") {
        // Aquí podrías recargar los datos del usuario para verificar si ya está conectado
        alert("Proceso de vinculación finalizado.");
      }
    } catch (error) {
      console.error("Error vinculando MP:", error);
      alert("No se pudo iniciar la vinculación.");
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userData");
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Ionicons name="person-circle" size={100} color="#007AFF" />
      <Text style={styles.title}>Mi Cuenta</Text>

      {role === "WORKER" && (
        <>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => router.push("/worker/complete-profile")}
          >
            <Ionicons name="briefcase-outline" size={20} color="#333" />
            <Text style={styles.menuText}>Editar Perfil Profesional</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          {/* BOTÓN DE MERCADO PAGO AÑADIDO AQUÍ */}
          <TouchableOpacity
            style={[
              styles.menuButton,
              { borderLeftWidth: 4, borderLeftColor: "#00B1EA" },
            ]}
            onPress={handleLinkMercadoPago}
          >
            <Ionicons name="wallet-outline" size={20} color="#00B1EA" />
            <Text style={[styles.menuText, { color: "#00B1EA" }]}>
              Vincular Mercado Pago
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 30 },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 12,
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 12,
    width: "90%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
  },
  menuText: { flex: 1, marginLeft: 10, fontSize: 16, color: "#333" },
});
