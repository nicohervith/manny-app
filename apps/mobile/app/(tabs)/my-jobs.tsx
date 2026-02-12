import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../src/constants/Config";
export default function MyJobsScreen() {
  const router = useRouter();
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para el Modal de Reseña
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const fetchMyJobs = async () => {
    try {
      const userData = await SecureStore.getItemAsync("userData");
      const user = JSON.parse(userData || "{}");
      const res = await axios.get(`${API_URL}/api/jobs/client/${user.id}`);
      setMyJobs(res.data);
    } catch (e) {
      console.error("Error fetching jobs:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyJobs();
  };

  const submitReview = async () => {
    if (!comment.trim()) {
      Alert.alert("Atención", "Por favor deja un breve comentario.");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/reviews`, {
        jobId: selectedJob.id,
        workerId: selectedJob.workerId,
        reviewerId: selectedJob.clientId,
        rating: rating,
        comment: comment,
      });

      Alert.alert("¡Éxito!", "Tu calificación ha sido enviada.");
      setRatingModalVisible(false);
      setComment(""); // Limpiar comentario
      setRating(5); // Reset estrellas
      fetchMyJobs(); // Refrescar para ocultar el botón de calificar
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo enviar la reseña.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Pedidos</Text>

      <FlatList
        data={myJobs}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No has publicado ningún trabajo aún.
          </Text>
        }
        renderItem={({ item }) => {
          const isPending = item.status === "PENDING";
          const isInProgress = item.status === "IN_PROGRESS";
          const isCompleted = item.status === "COMPLETED";
          const hasBeenRated = !!item.review; // Si existe el objeto review

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.jobDate}>
                Publicado el: {new Date(item.createdAt).toLocaleDateString()}
              </Text>

              {/* LÓGICA DE BOTONES SEGÚN ESTADO */}

              {isPending && (
                <TouchableOpacity
                  style={styles.viewBidsButton}
                  onPress={() =>
                    router.push({
                      pathname: "/client/job-bids/[id]",
                      params: { id: item.id.toString() },
                    })
                  }
                >
                  <Text style={styles.viewBidsText}>
                    {item._count?.bids > 0
                      ? `Ver ${item._count.bids} Postulantes`
                      : "Sin postulantes aún"}
                  </Text>
                </TouchableOpacity>
              )}

              {isInProgress && (
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() =>
                    router.push({
                      pathname: "/chat/[jobId]",
                      params: { jobId: item.id },
                    })
                  }
                >
                  <Ionicons name="chatbubbles" size={20} color="#fff" />
                  <Text style={styles.chatButtonText}>
                    Hablar con el profesional
                  </Text>
                </TouchableOpacity>
              )}

              {isCompleted && !hasBeenRated && (
                <TouchableOpacity
                  style={styles.rateButton}
                  onPress={() => {
                    setSelectedJob(item);
                    setRatingModalVisible(true);
                  }}
                >
                  <Ionicons name="star" size={20} color="#fff" />
                  <Text style={styles.rateButtonText}>Calificar Servicio</Text>
                </TouchableOpacity>
              )}

              {isCompleted && hasBeenRated && (
                <View style={styles.completedBadge}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={20}
                    color="#28A745"
                  />
                  <Text style={styles.completedBadgeText}>
                    Finalizado y Calificado
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* MODAL DE CALIFICACIÓN */}
      <Modal visible={ratingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeModal}
              onPress={() => setRatingModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>¡Trabajo Terminado!</Text>
            <Text style={styles.modalSubtitle}>
              ¿Cómo calificarías el servicio?
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={42}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Escribe un breve comentario sobre el profesional..."
              multiline
              numberOfLines={4}
              onChangeText={setComment}
              value={comment}
            />

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={submitReview}
            >
              <Text style={styles.confirmButtonText}>Enviar Calificación</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper para colores de badges
const getStatusStyle = (status: string) => {
  switch (status) {
    case "PENDING":
      return { backgroundColor: "#FFF3E0" };
    case "IN_PROGRESS":
      return { backgroundColor: "#E3F2FD" };
    case "COMPLETED":
      return { backgroundColor: "#E8F5E9" };
    default:
      return { backgroundColor: "#F5F5F5" };
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    color: "#1A1A1A",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  jobDate: { fontSize: 13, color: "#888", marginBottom: 15 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "600", color: "#555" },

  // Botones
  viewBidsButton: {
    backgroundColor: "#F0F0F0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  viewBidsText: { color: "#007AFF", fontWeight: "600" },
  chatButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  chatButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  rateButton: {
    backgroundColor: "#FFC107",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  rateButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },

  // Badge Finalizado
  completedBadge: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  completedBadgeText: { color: "#28A745", fontWeight: "bold", marginLeft: 8 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  closeModal: { alignSelf: "flex-end" },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  modalSubtitle: { fontSize: 16, color: "#666", marginVertical: 10 },
  starsRow: { flexDirection: "row", marginVertical: 20 },
  reviewInput: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: "#28A745",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 50,
    fontSize: 16,
  },
});
