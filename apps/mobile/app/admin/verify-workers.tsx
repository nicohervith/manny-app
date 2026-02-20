// apps/mobile/app/admin/verify-workers.tsx
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../src/constants/Config";

export default function AdminVerifyScreen() {
  const [pending, setPending] = useState([]);

  // apps/mobile/app/admin/verify-workers.tsx

  const loadPending = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken"); // Recuperamos el token guardado en el Login

      if (!token) {
        Alert.alert("Error", "No hay sesión activa");
        return;
      }

      const res = await axios.get(`${API_URL}/api/admin/pending-workers`, {
        headers: {
          Authorization: `Bearer ${token}`, // <--- CLAVE: Enviamos el token aquí
        },
      });
      setPending(res.data);
    } catch (error: any) {
      console.error("Error cargando pendientes:", error.response?.status);
      if (error.response?.status === 401) {
        Alert.alert("Sesión expirada", "Por favor, vuelve a iniciar sesión.");
      }
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleVerify = async (id: number, status: "VERIFIED" | "REJECTED") => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      await axios.patch(
        `${API_URL}/api/admin/verify-worker`,
        { workerId: id, status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      Alert.alert("Éxito", `Usuario ${status.toLowerCase()}`);
      loadPending(); // Recargar lista
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verificación de Trabajadores</Text>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.user.name}</Text>
            <Text>DNI: {item.dni}</Text>

            <View style={styles.imageRow}>
              <View>
                <Text style={styles.imgLabel}>Frente</Text>
                <Image source={{ uri: item.dniFront }} style={styles.thumb} />
              </View>
              <View>
                <Text style={styles.imgLabel}>Dorso</Text>
                <Image source={{ uri: item.dniBack }} style={styles.thumb} />
              </View>
              <View>
                <Text style={styles.imgLabel}>Selfie</Text>
                <Image source={{ uri: item.selfie }} style={styles.thumb} />
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnReject]}
                onPress={() => handleVerify(item.id, "REJECTED")}
              >
                <Text style={styles.btnText}>Rechazar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnApprove]}
                onPress={() => handleVerify(item.id, "VERIFIED")}
              >
                <Text style={styles.btnText}>Aprobar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f4f4f4" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20, marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  name: { fontSize: 18, fontWeight: "bold" },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  thumb: { width: 80, height: 80, borderRadius: 5, backgroundColor: "#eee" },
  imgLabel: { fontSize: 10, textAlign: "center", marginBottom: 2 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  btn: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 5 },
  btnApprove: { backgroundColor: "#28a745" },
  btnReject: { backgroundColor: "#dc3545" },
  btnText: { color: "#fff", fontWeight: "bold" },
});
