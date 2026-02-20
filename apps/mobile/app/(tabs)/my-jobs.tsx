import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../src/constants/Config";

export default function MyJobsScreen() {
  const router = useRouter();
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);

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

  // --- LÓGICA DE PAGO INTEGRADA ---
  const handlePayment = async (job: any) => {
    if (!job.budget || !job.workerId) {
      Alert.alert("Error", "Información de pago incompleta.");
      return;
    }

    setPayingId(job.id);
    try {
      const response = await axios.post(
        `${API_URL}/api/payments/create-preference`,
        {
          jobId: job.id,
          price: job.budget,
          workerId: job.workerId,
        },
      );

      const { id } = response.data;
      const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}`;

      // Abrimos el navegador para el pago
      await WebBrowser.openBrowserAsync(checkoutUrl);

      // Opcional: Refrescar al volver para ver si el webhook ya impactó
      fetchMyJobs();
    } catch (error) {
      console.error("Error al iniciar pago", error);
      Alert.alert("Error", "No se pudo conectar con Mercado Pago.");
    } finally {
      setPayingId(null);
    }
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
      setComment("");
      setRating(5);
      fetchMyJobs();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo enviar la reseña.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Pedidos</Text>

      <FlatList
        data={myJobs}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const isPending = item.status === "PENDING";
          const isInProgress = item.status === "IN_PROGRESS";
          const isCompleted = item.status === "COMPLETED"; // El trabajador marcó como terminado
          const isPaid = item.status === "PAID"; // Webhook confirmó el pago
          const hasBeenRated = !!item.review;

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

              <View style={styles.buttonContainer}>
                {/* SIEMPRE PERMITIR CHAT SI NO ESTÁ PAGADO TODAVÍA */}
                {(isInProgress || isCompleted) && (
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() =>
                      router.push({
                        pathname: "/chat/[jobId]",
                        params: { jobId: item.id },
                      })
                    }
                  >
                    <Ionicons name="chatbubbles" size={18} color="#fff" />
                    <Text style={styles.buttonTextSmall}>Chat</Text>
                  </TouchableOpacity>
                )}

                {/* BOTÓN PAGAR: Solo si está COMPLETED */}
                {isCompleted && (
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => handlePayment(item)}
                    disabled={payingId === item.id}
                  >
                    {payingId === item.id ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="card" size={18} color="#fff" />
                        <Text style={styles.buttonTextSmall}>
                          Pagar ${item.budget}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* BOTÓN CALIFICAR: Solo si está PAID y no tiene reseña */}
                {isPaid && !hasBeenRated && (
                  <TouchableOpacity
                    style={styles.rateButton}
                    onPress={() => {
                      setSelectedJob(item);
                      setRatingModalVisible(true);
                    }}
                  >
                    <Ionicons name="star" size={18} color="#fff" />
                    <Text style={styles.buttonTextSmall}>Calificar</Text>
                  </TouchableOpacity>
                )}

                {/* VER POSTULANTES: Solo si está PENDING */}
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
                    <Text style={styles.viewBidsText}>Ver Postulantes</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isPaid && hasBeenRated && (
                <View style={styles.completedBadge}>
                  <Ionicons
                    name="checkmark-done-circle"
                    size={18}
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

const getStatusStyle = (status: string) => {
  switch (status) {
    case "PENDING":
      return { backgroundColor: "#FFF3E0" };
    case "IN_PROGRESS":
      return { backgroundColor: "#E3F2FD" };
    case "COMPLETED":
      return { backgroundColor: "#FFFBEB" }; // Amarillo suave para "esperando pago"
    case "PAID":
      return { backgroundColor: "#E8F5E9" }; // Verde para pagado
    default:
      return { backgroundColor: "#F5F5F5" };
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 15 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    paddingTop: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobTitle: { fontSize: 18, fontWeight: "bold", flex: 1 },
  jobDate: { fontSize: 12, color: "#6c757d", marginVertical: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "bold" },
  buttonContainer: { flexDirection: "row", gap: 10, marginTop: 10 },
  chatButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  payButton: {
    backgroundColor: "#28A745",
    flexDirection: "row",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  rateButton: {
    backgroundColor: "#FFC107",
    flexDirection: "row",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonTextSmall: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 13,
  },
  viewBidsButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  viewBidsText: { color: "#007AFF", fontWeight: "bold" },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "center",
  },
  completedBadgeText: {
    color: "#28A745",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 13,
  },
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
