import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { useAuth } from "../../src/context/AuthContext";
import api from "../../src/services/api";

export default function MyJobsScreen() {
  const router = useRouter();
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);

  const { user } = useAuth();
  // Estados para el Modal de Reseña
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Agregá estos estados junto a los otros useState del componente:
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeJob, setDisputeJob] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const handleDispute = (job: any) => {
    setDisputeJob(job);
    setDisputeModalVisible(true);
  };

  const submitDispute = async () => {
    if (!disputeReason.trim()) {
      Alert.alert("Atención", "Por favor describí el problema.");
      return;
    }

    setSubmittingDispute(true);
    try {
      await api.post("/api/disputes", {
        jobId: disputeJob.id,
        reason: disputeReason,
      });

      Alert.alert(
        "Reporte enviado",
        "Revisaremos tu caso a la brevedad. El trabajo quedará pausado hasta resolverlo.",
      );
      setDisputeModalVisible(false);
      setDisputeReason("");
      setDisputeJob(null);
      fetchMyJobs();
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar el reporte. Intentá de nuevo.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const fetchMyJobs = async () => {
    try {
      const res = await api.get(`/api/jobs/client/${user.id}`);
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
      const response = await api.post(`/api/payments/create-preference`, {
        jobId: job.id,
        price: job.budget,
        workerId: job.workerId,
      });

      const { id } = response.data;
      const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}`;

      // Abrimos el navegador para el pago
      await WebBrowser.openBrowserAsync(checkoutUrl);

      await new Promise((resolve) => setTimeout(resolve, 2000));
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
      await api.post(`/api/reviews`, {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Buscando profesional";
      case "IN_PROGRESS":
        return "En progreso";
      case "COMPLETED":
        return "Listo para pagar";
      case "PAID":
        return "Pagado";
      case "CANCELLED":
        return "Cancelado";
      case "DISPUTED":
        return "En disputa";
      default:
        return status;
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
                  <Text style={styles.statusText}>
                    {getStatusLabel(item.status)}
                  </Text>
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

                {(isInProgress || isCompleted) && !item.dispute && (
                  <TouchableOpacity
                    style={styles.disputeButton}
                    onPress={() => handleDispute(item)}
                  >
                    <Ionicons name="warning" size={18} color="#fff" />
                    <Text style={styles.buttonTextSmall}>
                      Reportar problema
                    </Text>
                  </TouchableOpacity>
                )}

                {isCompleted && (
                  <View style={styles.completedInfoBanner}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#856404"
                    />
                    <Text style={styles.completedInfoText}>
                      El profesional marcó este trabajo como terminado. Revisá
                      el trabajo y procedé al pago.
                    </Text>
                  </View>
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

                {isCompleted && (
                  <View style={styles.cashInfoButton}>
                    <Ionicons name="cash-outline" size={18} color="#28A745" />
                    <Text style={styles.cashInfoText}>
                      ¿Pagás en efectivo? El profesional debe confirmar la
                      recepción del pago.
                    </Text>
                  </View>
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

      <Modal visible={disputeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeModal}
              onPress={() => {
                setDisputeModalVisible(false);
                setDisputeReason("");
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Ionicons name="warning" size={40} color="#DC3545" />
            <Text style={styles.modalTitle}>Reportar un problema</Text>
            <Text style={styles.modalSubtitle}>
              Describí qué salió mal con este trabajo
            </Text>

            <TextInput
              style={styles.reviewInput}
              placeholder="Ej: El trabajador no se presentó, el trabajo quedó incompleto..."
              multiline
              numberOfLines={4}
              onChangeText={setDisputeReason}
              value={disputeReason}
            />

            <TouchableOpacity
              style={styles.disputeConfirmButton}
              onPress={submitDispute}
              disabled={submittingDispute}
            >
              {submittingDispute ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Enviar Reporte</Text>
              )}
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
    case "DISPUTED":
      return { backgroundColor: "#FDECEA" };
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
    paddingTop: 20,
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
  buttonContainer: { flexDirection: "column", gap: 12, marginTop: 10 },
  chatButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  payButton: {
    backgroundColor: "#28A745",
    flexDirection: "row",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  rateButton: {
    backgroundColor: "#FFC107",
    flexDirection: "row",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonTextSmall: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
    fontSize: 14,
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
  disputeButton: {
    backgroundColor: "#DC3545",
    flexDirection: "row",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  disputeConfirmButton: {
    backgroundColor: "#DC3545",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  completedInfoBanner: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FFC107",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
  },
  completedInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#856404",
  },
  cashInfoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 8,
    flex: 1,
  },
  cashInfoText: {
    flex: 1,
    fontSize: 12,
    color: "#28A745",
  },
});
