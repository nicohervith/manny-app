import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router"; // 1. Agregamos useFocusEffect
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../src/constants/Config";

export default function MyBidsScreen() {
  const router = useRouter();
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true); // Nuevo: estado de carga inicial
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const fetchMyBids = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const userData = await SecureStore.getItemAsync("userData");
      const user = JSON.parse(userData || "{}");
      setUserId(user.id);

      const res = await axios.get(`${API_URL}/api/bids/worker/${user.id}`);
      setMyBids(res.data);
    } catch (e) {
      console.error("Error fetching bids:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
              await axios.patch(`${API_URL}/api/jobs/${jobId}/status`, {
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

  // 2. Esto hace que la pantalla se actualice cada vez que entras a la pestaña
  useFocusEffect(
    useCallback(() => {
      fetchMyBids();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyBids(true);
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
            item.job?.status === "IN_PROGRESS" && item.job?.workerId === userId;

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
                  <Text style={styles.pendingText}>
                    Estado:{" "}
                    {item.job?.status === "OPEN"
                      ? "Pendiente"
                      : "Cerrado / No seleccionado"}
                  </Text>
                )}
              </View>

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
              {item.job?.status === "IN_PROGRESS" && (
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
    paddingTop: 60,
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
});
