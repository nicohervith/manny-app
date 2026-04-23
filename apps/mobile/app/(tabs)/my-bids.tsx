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
import { useTheme } from "../../src/context/ThemeContext";
import api from "../../src/services/api";

interface Bids {
  id: number;
  price: number;
  status: string;
  job: any;
}

export default function MyBidsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
      <View
        style={[
          { flex: 1, justifyContent: "center" },
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>
        Mis Postulaciones
      </Text>
      <FlatList
        data={myBids}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aún no has realizado ninguna oferta.
          </Text>
        }
        renderItem={({ item }) => {
          // Tu lógica de aceptación impecable
          const isAccepted =
            item.job?.status === "IN_PROGRESS" &&
            item.job?.workerId === user?.id;

          return (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isAccepted && styles.acceptedCard,
              ]}
            >
              <View style={styles.row}>
                <Text style={[styles.jobTitle, { color: colors.text }]}>
                  {item.job?.title}
                </Text>
                <Text style={[styles.price, { color: colors.success }]}>
                  ${item.price}
                </Text>
              </View>

              <Text
                style={[styles.clientName, { color: colors.textSecondary }]}
              >
                Cliente: {item.job?.client?.name || "Cargando..."}
              </Text>

              <View style={styles.statusContainer}>
                {isAccepted ? (
                  <View style={styles.acceptedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.acceptedText}>¡Oferta Aceptada!</Text>
                  </View>
                ) : (
                  <Text
                    style={[
                      styles.pendingText,
                      { color: colors.textSecondary },
                      item.job?.status === "COMPLETED" &&
                        item.job?.workerId === user?.id && {
                          color: colors.warning,
                        },
                    ]}
                  >
                    {getStatusText(item.job, user?.id!)}
                  </Text>
                )}
              </View>

              {/* INFO DE UBICACIÓN (Solo si fue aceptado) */}
              {isAccepted && item.job?.address && (
                <View
                  style={[
                    styles.locationCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.locationHeader}>
                    <Ionicons name="location" size={18} color={colors.error} />
                    <Text
                      style={[
                        styles.locationTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Dirección del servicio
                    </Text>
                  </View>

                  <Text style={[styles.addressText, { color: colors.text }]}>
                    {item.job.address}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.mapButton,
                      { backgroundColor: colors.commissionBg },
                    ]}
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
                    <Ionicons
                      name="map-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.mapButtonText, { color: colors.primary }]}
                    >
                      Abrir en GPS
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {isAccepted && (
                <TouchableOpacity
                  style={[
                    styles.chatButton,
                    { backgroundColor: colors.primary },
                  ]}
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
                      { backgroundColor: colors.success, marginTop: 8 },
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
                      { backgroundColor: colors.info, marginTop: 8 },
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
                  <View
                    style={[
                      styles.earningsBox,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.earningsTitle, { color: colors.text }]}
                    >
                      Resumen del pago
                    </Text>
                    <View style={styles.earningsRow}>
                      <Text
                        style={[
                          styles.earningsLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Precio acordado
                      </Text>
                      <Text
                        style={[styles.earningsValue, { color: colors.text }]}
                      >
                        ${item.price}
                      </Text>
                    </View>
                    <View style={styles.earningsRow}>
                      <Text
                        style={[
                          styles.earningsLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Comisión Manny (10%)
                      </Text>
                      <Text
                        style={[
                          styles.earningsNegative,
                          { color: colors.error },
                        ]}
                      >
                        -${(item.price * 0.1).toFixed(0)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.earningsRow,
                        styles.earningsTotalRow,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.earningsTotalLabel,
                          { color: colors.text },
                        ]}
                      >
                        Recibís
                      </Text>
                      <Text
                        style={[
                          styles.earningsTotalValue,
                          { color: colors.success },
                        ]}
                      >
                        ${(item.price * 0.9).toFixed(0)}
                      </Text>
                    </View>
                  </View>
                )}

              {item.job?.status === "PAID" &&
                item.job?.workerId === user?.id &&
                item.job?.paymentMethod === "CASH" && (
                  <View
                    style={[
                      styles.earningsBox,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.earningsTitle, { color: colors.text }]}
                    >
                      Pago en efectivo confirmado ✅
                    </Text>
                    <Text
                      style={[
                        styles.earningsLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
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
    padding: 20,
    paddingTop: 20,
  },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    borderWidth: 1.5,
  },
  acceptedCard: { borderColor: "#28A745", borderWidth: 2.5 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  jobTitle: { fontSize: 16, fontWeight: "bold", flex: 1 },
  price: { fontSize: 16, fontWeight: "bold" },
  clientName: { fontSize: 14, marginBottom: 10 },
  statusContainer: { marginTop: 8 },
  acceptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(40, 167, 69, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(40, 167, 69, 0.3)",
  },
  acceptedText: { color: "#28A745", fontWeight: "bold", marginLeft: 6 },
  pendingText: { fontStyle: "italic" },
  chatButton: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  chatButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  earningsBox: {
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
  },
  earningsTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  earningsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  earningsLabel: { fontSize: 13 },
  earningsValue: { fontSize: 13 },
  earningsNegative: { fontSize: 13 },
  earningsTotalRow: {
    borderTopWidth: 1,
    marginTop: 6,
    paddingTop: 10,
  },
  earningsTotalLabel: { fontSize: 14, fontWeight: "700" },
  earningsTotalValue: { fontSize: 14, fontWeight: "700" },
  locationCard: {
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
    textTransform: "uppercase",
  },
  addressText: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});
