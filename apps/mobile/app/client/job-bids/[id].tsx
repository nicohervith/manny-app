import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../../src/constants/Config";

export default function JobBidsScreen() {
  const { id } = useLocalSearchParams(); // ID del Trabajo
  const router = useRouter();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = async () => {
    try {
      // Necesitamos un endpoint que traiga ofertas por JOB_ID
      const res = await axios.get(`${API_URL}/api/bids/job/${id}`);
      setBids(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [id]);

  const handleAcceptWorker = (bid: any) => {
    Alert.alert(
      "Confirmar Selección",
      `¿Quieres contratar a ${bid.worker.name} por $${bid.price}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Contratar",
          onPress: async () => {
            try {
              await axios.post(`${API_URL}/api/jobs/accept-bid`, {
                jobId: id,
                workerId: bid.workerId,
                bidId: bid.id,
              });
              Alert.alert(
                "¡Éxito!",
                "Trabajador contratado. Ya puedes chatear.",
              );
              router.replace("/(tabs)/my-jobs"); // Volver a la lista de sus posteos
            } catch (e) {
              Alert.alert("Error", "No se pudo procesar la contratación.");
            }
          },
        },
      ],
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Postulantes</Text>

      <FlatList
        data={bids}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.empty}>Nadie se ha postulado aún.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.bidCard}>
            <View style={styles.headerRow}>
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{item.worker.name}</Text>
                <Text style={styles.rating}>⭐ 4.8 (15 reseñas)</Text>
              </View>
              <Text style={styles.price}>${item.price}</Text>
            </View>

            <Text style={styles.messageLabel}>Propuesta:</Text>
            <Text style={styles.messageText}>{item.message}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.timeText}>
                ⏱ {item.estimatedMin} min estimación
              </Text>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptWorker(item)}
              >
                <Text style={styles.acceptButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/client/worker-profile/[id]",
                  params: { id: item.workerId }, // ID del usuario/trabajador
                })
              }
              style={styles.workerInfo}
            >
              <Text style={styles.workerName}>{item.worker.name}</Text>
              <Text style={styles.rating}>⭐ Ver Perfil y Reseñas</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 20,
    paddingTop: 60,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  bidCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  workerName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  workerInfo: { flex: 1 },
  rating: { fontSize: 12, color: "#666" },
  price: { fontSize: 20, fontWeight: "bold", color: "#28A745" },
  messageLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#999",
    marginTop: 10,
  },
  messageText: {
    fontSize: 15,
    color: "#444",
    fontStyle: "italic",
    marginVertical: 5,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  timeText: { color: "#666", fontSize: 13 },
  acceptButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  acceptButtonText: { color: "#fff", fontWeight: "bold" },
  empty: { textAlign: "center", marginTop: 50, color: "#999" },
});
