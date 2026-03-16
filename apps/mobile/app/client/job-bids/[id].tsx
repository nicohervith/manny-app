import { Ionicons } from "@expo/vector-icons";
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
import api from "../../../src/services/api";

export default function JobBidsScreen() {
  const { id } = useLocalSearchParams(); // ID del Trabajo
  const router = useRouter();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = async () => {
    try {
      // Necesitamos un endpoint que traiga ofertas por JOB_ID
      const res = await api.get(`/api/bids/job/${id}`);
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
              await api.post(`/api/jobs/accept-bid`, {
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
            {/* HEADER: Información del trabajador y enlace al perfil */}
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/client/worker-profile/[id]",
                    params: { id: item.workerId },
                  })
                }
                style={styles.workerInfoContainer}
              >
                <Text style={styles.workerName}>{item.worker.name}</Text>
                <Text style={styles.rating}>
                  ⭐ {item.worker.averageRating} ({item.worker.totalReviews}{" "}
                  reseñas)
                  <Text style={styles.viewProfileLink}> • Ver perfil</Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.price}>${item.price}</Text>
            </View>

            {/* CUERPO: Mensaje de la propuesta */}
            <Text style={styles.messageLabel}>Propuesta:</Text>
            <Text style={styles.messageText}>"{item.message}"</Text>

            {/* FOOTER: Separado visualmente con un borde o margen */}
            <View style={styles.footerRow}>
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.timeText}>
                  {" "}
                  {item.estimatedMin} min estimación
                </Text>
              </View>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAcceptWorker(item)}
              >
                <Text style={styles.acceptButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#1A1A1A",
  },
  bidCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    // Sombra más suave y moderna
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  workerInfoContainer: {
    flex: 1,
  },
  workerName: { fontSize: 18, fontWeight: "700", color: "#333" },
  rating: { fontSize: 13, color: "#666", marginTop: 2 },
  viewProfileLink: {
    color: "#007AFF",
    fontWeight: "600",
  },
  price: { fontSize: 22, fontWeight: "800", color: "#28A745" },

  messageLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#BBB",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 20,
    marginVertical: 8,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0", // Línea sutil de separación
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: { color: "#666", fontSize: 13 },

  acceptButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    // Pequeña sombra al botón para que resalte
    shadowColor: "#007AFF",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  acceptButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  empty: { textAlign: "center", marginTop: 50, color: "#999", fontSize: 16 },
});
