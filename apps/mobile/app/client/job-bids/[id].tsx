import { Ionicons } from "@expo/vector-icons";
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
import { useTheme } from "../../../src/context/ThemeContext";

export default function JobBidsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const styles = getStyles(colors);

  const fetchBids = async () => {
    try {
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
              Alert.alert("¡Éxito!", "Trabajador contratado. Ya puedes chatear.");
              router.replace("/(tabs)/my-jobs");
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

            <Text style={styles.messageLabel}>Propuesta:</Text>
            <Text style={styles.messageText}>"{item.message}"</Text>

            <View style={styles.footerRow}>
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
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

function getStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20,
      paddingTop: 60,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      color: colors.text,
    },
    bidCard: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
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
    workerName: { fontSize: 18, fontWeight: "700", color: colors.text },
    rating: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    viewProfileLink: {
      color: colors.primary,
      fontWeight: "600",
    },
    price: { fontSize: 22, fontWeight: "800", color: colors.success },

    messageLabel: {
      fontSize: 11,
      fontWeight: "bold",
      color: colors.textLight,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    messageText: {
      fontSize: 15,
      color: colors.text,
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
      borderTopColor: colors.border,
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    timeText: { color: colors.textSecondary, fontSize: 13 },

    acceptButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 10,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 2,
    },
    acceptButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
    empty: { textAlign: "center", marginTop: 50, color: colors.textLight, fontSize: 16 },
  });
}
