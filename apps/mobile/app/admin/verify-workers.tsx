// apps/mobile/app/admin/verify-workers.tsx
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
import { useTheme } from "../../src/context/ThemeContext";
import api from "../../src/services/api";

interface PendingWorker {
  id: number;
  dni?: string;
  user: {
    name: string;
  };
  dniFront: string;
  dniBack: string;
  selfie: string;
}

export default function AdminVerifyScreen() {
  const [pending, setPending] = useState<PendingWorker[]>([]);
  const { colors } = useTheme();
  const loadPending = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");

      if (!token) {
        Alert.alert("Error", "No hay sesión activa");
        return;
      }

      const res = await api.get(`/api/admin/pending-workers`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
      await api.patch(
        `/api/admin/verify-worker`,
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Verificación de Trabajadores
      </Text>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.name, { color: colors.text }]}>
              {item.user.name}
            </Text>
            <Text style={[styles.dni, { color: colors.text }]}>
              DNI: {item.dni}
            </Text>

            <View style={styles.imageRow}>
              <View>
                <Text style={[styles.imgLabel, { color: colors.text }]}>
                  Frente
                </Text>
                <Image source={{ uri: item.dniFront }} style={styles.thumb} />
              </View>
              <View>
                <Text style={[styles.imgLabel, { color: colors.text }]}>
                  Dorso
                </Text>
                <Image source={{ uri: item.dniBack }} style={styles.thumb} />
              </View>
              <View>
                <Text style={[styles.imgLabel, { color: colors.text }]}>
                  Selfie
                </Text>
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
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20, marginTop: 20 },
  card: {
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
  dni: {},
});
