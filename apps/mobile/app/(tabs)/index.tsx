import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CategoryGrid } from "../../src/components/Categories";
import { WorkerCard } from "../../src/components/WorkerCard";
import { useAuth } from "../../src/context/AuthContext";
import api from "../../src/services/api";

export default function ClientHomeScreen() {
  const { user, isLoading } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const fetchWorkers = async (tag?: string) => {
    try {
      setLoading(true);
      const url = tag ? `/api/worker/list?tag=${tag}` : `/api/worker/list`;
      const response = await api.get(url);
      setWorkers(response.data);
    } catch (error: any) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Al presionar una categoría en el Grid
  const handleSelectCategory = (categoryName: string) => {
    setSelectedTag(categoryName);
    fetchWorkers(categoryName);
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

  if (user?.role === "WORKER") {
    return <Redirect href="/worker-feed" />;
  }
  return (
    <View style={styles.container}>
      <FlatList
        data={workers}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>¿Qué necesitas hoy?</Text>

            {/* Buscador visual (lleva a crear trabajo) */}
            <TouchableOpacity
              style={styles.searchBar}
              onPress={() => router.push("/create-job")}
            >
              <Ionicons name="search" size={20} color="#999" />
              <Text style={styles.searchText}>
                Busca un servicio o publica un pedido
              </Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Categorías populares</Text>
            <CategoryGrid
              onSelectCategory={(name) => {
                console.log("Filtrar por:", name);
                handleSelectCategory(name);
              }}
            />

            {selectedTag && (
              <View style={styles.filterBadgeContainer}>
                <Text style={styles.filterText}>
                  Mostrando:{" "}
                  <Text style={{ fontWeight: "bold" }}>{selectedTag}</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedTag(null);
                    fetchWorkers(); // Carga todos de nuevo
                  }}
                  style={styles.clearFilterBtn}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  <Text style={{ color: "#FF3B30", marginLeft: 4 }}>
                    Quitar filtro
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Profesionales recomendados</Text>
          </View>
        }
        renderItem={({ item }) => <WorkerCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 20, backgroundColor: "#fff" },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 10,
  },
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
  headerContent: { padding: 20 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 25,
    elevation: 2, // Sombra en Android
    shadowColor: "#000", // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchText: { marginLeft: 10, color: "#999", fontSize: 16 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "31%", // Para que entren 3 por fila
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryText: { fontSize: 13, fontWeight: "500", color: "#444" },

  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 10 },
  filterBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F2F2F7", // Un gris muy claro/azulado
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  filterText: {
    fontSize: 15,
    color: "#3A3A3C",
    flex: 1,
  },
  clearFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5", // Fondo rojizo suave para el botón
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
});
