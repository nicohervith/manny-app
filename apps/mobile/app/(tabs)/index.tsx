import axios from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../src/constants/Config";

export default function ClientHomeScreen() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkRedirect = async () => {
      const userData = await SecureStore.getItemAsync("userData");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.role === "WORKER") {
          router.replace("/worker-feed");
        }
      }
    };
    checkRedirect();
  }, []);

  const fetchWorkers = async () => {
    try {
      console.log("Intentando conectar a:", `${API_URL}/api/worker/list`);
      const response = await axios.get(`${API_URL}/api/worker/list`);

      // Log para depuración: Veremos en la terminal qué llega exactamente
      console.log("Datos recibidos del server:", response.data);

      setWorkers(response.data);
    } catch (error: any) {
      console.error("Error al obtener trabajadores:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkers();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Cargando profesionales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Professionals</Text>
        <Text style={styles.headerSubtitle}>
          Find the right expert for your home
        </Text>
      </View>

      <FlatList
        data={workers}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          // Seguridad: Si por error el perfil no tiene usuario vinculado
          if (!item.user) return null;

          return (
            <TouchableOpacity style={styles.workerCard} activeOpacity={0.7}>
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{item.user.name}</Text>
                <Text style={styles.workerOficio}>
                  {item.occupation || "General Service"}
                </Text>
                <Text style={styles.workerDesc} numberOfLines={2}>
                  {item.description || "No description provided."}
                </Text>
                {item.hourlyRate && (
                  <Text style={styles.priceText}>
                    Price: ${item.hourlyRate}/hr
                  </Text>
                )}
              </View>

              <View style={styles.imageContainer}>
                {item.dniPhoto ? (
                  <Image
                    source={{ uri: item.dniPhoto }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Text style={styles.placeholderText}>No Pic</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No professionals found yet.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryText}>Reload</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#1A1A1A" },
  headerSubtitle: { fontSize: 16, color: "#666", marginTop: 4 },
  workerCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    // Sombras
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  workerInfo: { flex: 1, paddingRight: 10 },
  workerName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  workerOficio: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    marginVertical: 4,
  },
  workerDesc: { fontSize: 14, color: "#777", lineHeight: 20 },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2ecc71",
    marginTop: 6,
  },
  imageContainer: { justifyContent: "center", alignItems: "center" },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#EEE" },
  placeholderAvatar: {
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#BBB",
  },
  placeholderText: { fontSize: 10, color: "#999" },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: { fontSize: 16, color: "#999", textAlign: "center" },
  retryButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryText: { color: "#fff", fontWeight: "600" },
});
