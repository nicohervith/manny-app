import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { Job } from "../types/job";

interface MyJobCardProps {
  item: Job;
  onDisputePress: (job: Job) => void;
  onRatingPress: (job: Job) => void;
  onRefresh: () => void;
}

export default function MyJobCard({
  item,
  onDisputePress,
  onRatingPress,
  onRefresh,
}: MyJobCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const [payingId, setPayingId] = React.useState<number | null>(null);

  const isPending = item.status === "PENDING";
  const isInProgress = item.status === "IN_PROGRESS";
  const isCompleted = item.status === "COMPLETED";
  const isPaid = item.status === "PAID";
  const hasBeenRated = !!item.review;

  const handlePayment = async () => {
    if (!item.budget || !item.workerId) {
      Alert.alert("Error", "Información de pago incompleta.");
      return;
    }

    setPayingId(item.id as number);
    try {
      const response = await api.post(`/api/payments/create-preference`, {
        jobId: item.id,
        price: item.budget,
        workerId: item.workerId,
      });

      const { id } = response.data;
      const checkoutUrl = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${id}`;

      await WebBrowser.openBrowserAsync(checkoutUrl);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onRefresh();
    } catch (error) {
      console.error("Error al iniciar pago", error);
      Alert.alert("Error", "No se pudo conectar con Mercado Pago.");
    } finally {
      setPayingId(null);
    }
  };

  const handleCancelJob = () => {
    Alert.alert(
      "Cancelar publicación",
      "¿Estás seguro? Se eliminarán todas las postulaciones recibidas.",
      [
        { text: "No, mantener", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/api/jobs/${item.id}/status`, {
                status: "CANCELLED",
              });
              onRefresh();
            } catch (e) {
              Alert.alert("Error", "No se pudo cancelar el trabajo.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.jobTitle, { color: colors.text }]}>
          {item.title}
        </Text>
        <View style={[styles.statusBadge, getStatusStyle(item.status, colors)]}>
          <Text
            style={[
              styles.statusText,
              { color: getStatusTextColor(item.status) },
            ]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={[styles.jobDate, { color: colors.textLight }]}>
        Publicado el: {new Date(item.createdAt).toLocaleDateString()}
      </Text>

      <View style={styles.buttonContainer}>
        {/* CHAT BUTTON */}
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

        {/* DISPUTE BUTTON */}
        {(isInProgress || isCompleted) && !item.dispute && (
          <TouchableOpacity
            style={styles.disputeButton}
            onPress={() => onDisputePress(item)}
          >
            <Ionicons name="warning" size={18} color="#fff" />
            <Text style={styles.buttonTextSmall}>Reportar problema</Text>
          </TouchableOpacity>
        )}

        {/* COMPLETED INFO BANNER */}
        {isCompleted && (
          <View
            style={[styles.completedInfoBanner, { borderColor: colors.border }]}
          >
            <Ionicons name="checkmark-circle" size={16} color="#856404" />
            <Text style={[styles.completedInfoText]}>
              El profesional marcó este trabajo como terminado. Revisá el
              trabajo y procedé al pago.
            </Text>
          </View>
        )}

        {/* PAYMENT METHOD SELECTOR */}
        {isCompleted && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>¿Cómo vas a pagar?</Text>

            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={payingId === item.id}
            >
              {payingId === item.id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="card" size={18} color="#fff" />
                  <Text style={styles.buttonTextSmall}>
                    Pagar con MercadoPago ${item.budget}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
              <Text style={[styles.dividerText, { color: colors.textLight }]}>
                o
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
            </View>

            <View
              style={[
                styles.cashBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="cash-outline" size={22} color="#28A745" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cashBoxTitle, { color: colors.text }]}>
                  Pago en efectivo
                </Text>
                <Text
                  style={[styles.cashBoxText, { color: colors.textSecondary }]}
                >
                  Pagale directamente al profesional. Una vez que reciba el
                  dinero, él confirmará el pago desde su app y el trabajo
                  quedará finalizado.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* RATING BUTTON */}
        {isPaid && !hasBeenRated && (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => onRatingPress(item)}
          >
            <Ionicons name="star" size={18} color="#fff" />
            <Text style={styles.buttonTextSmall}>Calificar</Text>
          </TouchableOpacity>
        )}

        {/* VIEW BIDS */}
        {isPending && (
          <View>
            <TouchableOpacity
              style={[
                styles.viewBidsButton,
                item._count?.bids > 0 ? styles.viewBidsButtonActive : {},
              ]}
              onPress={() =>
                router.push({
                  pathname: "/client/job-bids/[id]",
                  params: { id: item.id.toString() },
                })
              }
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="people"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.viewBidsText}>
                  {item._count?.bids > 0
                    ? `Ver postulantes (${item._count.bids})`
                    : "Sin postulantes aún"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelJobButton}
              onPress={handleCancelJob}
            >
              <Ionicons name="close-circle-outline" size={16} color="#DC3545" />
              <Text style={styles.cancelJobText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* COMPLETED BADGE */}
      {isPaid && hasBeenRated && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-done-circle" size={18} color="#28A745" />
          <Text style={styles.completedBadgeText}>Finalizado y Calificado</Text>
        </View>
      )}
    </View>
  );
}

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

const getStatusTextColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "#B8860B";
    case "IN_PROGRESS":
      return "#0051D5";
    case "COMPLETED":
      return "#FFC107";
    case "PAID":
      return "#2E7D32";
    case "DISPUTED":
      return "#C62828";
    default:
      return "#666";
  }
};

const getStatusStyle = (status: string, colors?: any) => {
  switch (status) {
    case "PENDING":
      return { backgroundColor: "#FFF3E0" };
    case "IN_PROGRESS":
      return { backgroundColor: "#E3F2FD" };
    case "COMPLETED":
      return { backgroundColor: "#FFFBEB" };
    case "PAID":
      return { backgroundColor: "#E8F5E9" };
    case "DISPUTED":
      return { backgroundColor: "#FDECEA" };
    default:
      return { backgroundColor: "#F5F5F5" };
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff", // será sobrescrito por el theme
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
  jobTitle: { fontSize: 18, fontWeight: "bold", flex: 1, color: "#333" }, // será sobrescrito por el theme
  jobDate: { fontSize: 12, color: "#6c757d", marginVertical: 8 }, // será sobrescrito por el theme
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
    backgroundColor: "#8E8E93",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  viewBidsButtonActive: {
    backgroundColor: "#34C759",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  viewBidsText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
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
  disputeButton: {
    backgroundColor: "#DC3545",
    flexDirection: "row",
    padding: 14,
    borderRadius: 8,
    width: "100%",
    justifyContent: "center",
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
  cancelJobButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DC3545",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 4,
  },
  cancelJobText: {
    color: "#DC3545",
    fontWeight: "600",
    fontSize: 13,
  },
  paymentSection: {
    marginTop: 10,
    gap: 10,
  },
  paymentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    fontSize: 13,
    color: "#999",
  },
  cashBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  cashBoxTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 4,
  },
  cashBoxText: {
    fontSize: 12,
    color: "#388E3C",
    lineHeight: 17,
  },
});
