import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import api from "../../src/services/api";

interface Bids {
  id: number;
  price: number;
  status: string;
  job: any;
}

export default function MyBidsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [myBids, setMyBids] = useState<Bids[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyBids = async (isRefresh = false) => {
    if (!user) return;
    if (!isRefresh) setLoading(true);
    try {
      const res = await api.get(`/api/bids/worker/${user.id}`);
      setMyBids(res.data);
    } catch (e) {
      console.error("Error fetching bids:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyBids();
    }, [user]),
  );

  const handleFinishJob = async (jobId: number) => {
    Alert.alert(
      "Finalizar Trabajo",
      "¿Confirmas que has completado este trabajo? Se le notificará al cliente para que pueda calificarte.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, terminar",
          onPress: async () => {
            try {
              // Esta URL ahora coincide con el router.patch("/:id/status") de jobs.routes
              await api.patch(`/api/jobs/${jobId}/status`, {
                status: "COMPLETED",
              });
              Alert.alert("Éxito", "Has marcado el trabajo como completado.");
              fetchMyBids();
            } catch (error) {
              Alert.alert("Error", "No se pudo actualizar el estado.");
            }
          },
        },
      ],
    );
  };

  const handleCashPayment = async (jobId: number) => {
    Alert.alert(
      "Confirmar pago en efectivo",
      "¿Confirmás que el cliente realizó el pago en efectivo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, confirmar",
          onPress: async () => {
            try {
              await api.patch(`/api/jobs/${jobId}/status`, {
                status: "PAID",
                paymentMethod: "CASH",
              });
              Alert.alert(
                "✅ Confirmado",
                "El pago en efectivo fue registrado.",
              );
              fetchMyBids();
            } catch (error) {
              Alert.alert("Error", "No se pudo confirmar el pago.");
            }
          },
        },
      ],
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyBids(true);
  };

  const getStatusText = (job: any, userId: number) => {
    if (!job) return "Cargando...";

    switch (job.status) {
      case "IN_PROGRESS":
        return job.workerId === userId
          ? "En progreso"
          : "Cerrado / No seleccionado";
      case "COMPLETED":
        return job.workerId === userId
          ? "Esperando confirmación del cliente"
          : "Cerrado / No seleccionado";
      case "PAID":
        return "Completado y pagado ✓";
      case "CANCELLED":
        return "Cancelado";
      case "DISPUTED":
        return "En disputa";
      default:
        return "Pendiente";
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Postulaciones</Text>
      <FlatList
        data={myBids}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aún no has realizado ninguna oferta.
          </Text>
        }
        renderItem={({ item }) => {
          // Tu lógica de aceptación impecable
          const isAccepted =
            item.job?.status === "IN_PROGRESS" &&
            item.job?.workerId === user?.id;

          return (
            <View style={[styles.card, isAccepted && styles.acceptedCard]}>
              <View style={styles.row}>
                <Text style={styles.jobTitle}>{item.job?.title}</Text>
                <Text style={styles.price}>${item.price}</Text>
              </View>

              <Text style={styles.clientName}>
                Cliente: {item.job?.client?.name || "Cargando..."}
              </Text>

              <View style={styles.statusContainer}>
                {isAccepted ? (
                  <View style={styles.acceptedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#28A745"
                    />
                    <Text style={styles.acceptedText}>¡Oferta Aceptada!</Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.pendingText,
                      item.job?.status === "COMPLETED" &&
                        item.job?.workerId === user?.id && { color: "#FF9500" },
                    ]}
                  >
                    {getStatusText(item.job, user?.id!)}
                  </Text>
                )}
              </View>

              {/* INFO DE UBICACIÓN (Solo si fue aceptado) */}
              {isAccepted && item.job?.address && (
                <View style={styles.locationCard}>
                  <View style={styles.locationHeader}>
                    <Ionicons name="location" size={18} color="#FF3B30" />
                    <Text style={styles.locationTitle}>
                      Dirección del servicio
                    </Text>
                  </View>

                  <Text style={styles.addressText}>{item.job.address}</Text>

                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => {
                      const query = encodeURIComponent(item.job.address);
                      const url = Platform.select({
                        ios: `maps:0,0?q=${query}`,
                        android: `geo:0,0?q=${query}`,
                        default: `https://www.google.com/maps/search/?api=1&query=${query}`,
                      });
                      WebBrowser.openBrowserAsync(url);
                    }}
                  >
                    <Ionicons name="map-outline" size={16} color="#007AFF" />
                    <Text style={styles.mapButtonText}>Abrir en GPS</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isAccepted && (
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() =>
                    router.push({
                      pathname: "/chat/[jobId]",
                      params: { jobId: item.job.id },
                    })
                  }
                >
                  <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
                  <Text style={styles.chatButtonText}>
                    Hablar con el Cliente
                  </Text>
                </TouchableOpacity>
              )}

              {/* NUEVO: Botón de Finalizar */}
              {item.job?.status === "IN_PROGRESS" &&
                item.job?.workerId === user?.id && (
                  <TouchableOpacity
                    style={[
                      styles.chatButton,
                      { backgroundColor: "#28A745", marginTop: 8 },
                    ]}
                    onPress={() => handleFinishJob(item.job.id)}
                  >
                    <Ionicons
                      name="checkmark-done-circle-outline"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.chatButtonText}>
                      Marcar como Terminado
                    </Text>
                  </TouchableOpacity>
                )}

              {item.job?.status === "COMPLETED" &&
                item.job?.workerId === user?.id && (
                  <TouchableOpacity
                    style={[
                      styles.chatButton,
                      { backgroundColor: "#6C3483", marginTop: 8 },
                    ]}
                    onPress={() => handleCashPayment(item.job.id)}
                  >
                    <Ionicons name="cash-outline" size={20} color="#fff" />
                    <Text style={styles.chatButtonText}>
                      Confirmar pago en efectivo
                    </Text>
                  </TouchableOpacity>
                )}

              {item.job?.status === "PAID" &&
                item.job?.workerId === user?.id &&
                item.job?.paymentMethod !== "CASH" && (
                  <View style={styles.earningsBox}>
                    <Text style={styles.earningsTitle}>Resumen del pago</Text>
                    <View style={styles.earningsRow}>
                      <Text style={styles.earningsLabel}>Precio acordado</Text>
                      <Text style={styles.earningsValue}>${item.price}</Text>
                    </View>
                    <View style={styles.earningsRow}>
                      <Text style={styles.earningsLabel}>
                        Comisión Manny (10%)
                      </Text>
                      <Text style={styles.earningsNegative}>
                        -${(item.price * 0.1).toFixed(0)}
                      </Text>
                    </View>
                    <View style={[styles.earningsRow, styles.earningsTotalRow]}>
                      <Text style={styles.earningsTotalLabel}>Recibís</Text>
                      <Text style={styles.earningsTotalValue}>
                        ${(item.price * 0.9).toFixed(0)}
                      </Text>
                    </View>
                  </View>
                )}

              {item.job?.status === "PAID" &&
                item.job?.workerId === user?.id &&
                item.job?.paymentMethod === "CASH" && (
                  <View style={styles.earningsBox}>
                    <Text style={styles.earningsTitle}>
                      Pago en efectivo confirmado ✅
                    </Text>
                    <Text style={styles.earningsLabel}>
                      Recibiste: ${item.price}
                    </Text>
                  </View>
                )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 20,
    paddingTop: 20,
  },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 1,
  },
  acceptedCard: { borderColor: "#28A745", borderWidth: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  jobTitle: { fontSize: 16, fontWeight: "bold", flex: 1 },
  price: { fontSize: 16, fontWeight: "bold", color: "#28A745" },
  clientName: { color: "#666", fontSize: 14, marginBottom: 10 },
  statusContainer: { marginTop: 5 },
  acceptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 5,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  acceptedText: { color: "#28A745", fontWeight: "bold", marginLeft: 5 },
  pendingText: { color: "#999", fontStyle: "italic" },
  chatButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  chatButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#999",
    fontSize: 16,
  },
  earningsBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  earningsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  earningsLabel: { fontSize: 13, color: "#666" },
  earningsValue: { fontSize: 13, color: "#333" },
  earningsNegative: { fontSize: 13, color: "#DC3545" },
  earningsTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#DEE2E6",
    marginTop: 4,
    paddingTop: 8,
  },
  earningsTotalLabel: { fontSize: 14, fontWeight: "700", color: "#333" },
  earningsTotalValue: { fontSize: 14, fontWeight: "700", color: "#28A745" },
  locationCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#495057",
    marginLeft: 5,
    textTransform: "uppercase",
  },
  addressText: {
    fontSize: 15,
    color: "#212529",
    marginBottom: 10,
    lineHeight: 20,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F1FF",
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});
