import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
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

export default function WorkerFeedScreen() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [bidData, setBidData] = useState({
    price: "",
    message: "",
    tiempo: "",
  });

  // Función para calcular distancia (Haversine)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getPermissionsAndLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "We need location to show jobs near you.",
      );
      return;
    }
    let userLocation = await Location.getCurrentPositionAsync({});
    setLocation(userLocation.coords);
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/jobs/available`);
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApply = async () => {
    try {
      const userData = await SecureStore.getItemAsync("userData");
      const user = JSON.parse(userData || "{}");

      await axios.post(`${API_URL}/api/bids/apply`, {
        jobId: selectedJob.id,
        workerId: user.id,
        message: bidData.message,
        price: bidData.price,
        estimatedMin: bidData.tiempo,
      });

      Alert.alert("¡Enviado!", "Tu propuesta ha sido enviada al cliente.");
      setModalVisible(false);
      setBidData({ price: "", message: "", tiempo: "" });
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar la propuesta.");
    }
  };

  useEffect(() => {
    getPermissionsAndLocation();
    fetchJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
    getPermissionsAndLocation();
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Jobs</Text>
        <Text style={styles.subtitle}>Opportunities near your location</Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          let distance = null;
          if (location && item.latitude && item.longitude) {
            distance = calculateDistance(
              location.latitude,
              location.longitude,
              item.latitude,
              item.longitude,
            );
          }

          return (
            <View style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                {distance !== null && (
                  <View style={styles.distanceBadge}>
                    <Ionicons name="location" size={12} color="#007AFF" />
                    <Text style={styles.distanceText}>
                      {distance.toFixed(1)} km
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.description} numberOfLines={3}>
                {item.descripcion}
              </Text>

              <View style={styles.footer}>
                <View>
                  <Text style={styles.clientLabel}>Posted by:</Text>
                  <Text style={styles.clientName}>{item.client?.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() =>
                    Alert.alert("Apply", "Feature coming soon: Bidding system")
                  }
                >
                  <Text
                    style={styles.applyButtonText}
                    onPress={() => {
                      setSelectedJob(item);
                      setModalVisible(true);
                    }}
                  >
                    Apply Now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No pending jobs in your area.</Text>
        }
      />
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enviar Propuesta</Text>
            <Text style={styles.modalSubtitle}>{selectedJob?.title}</Text>

            <Text style={styles.label}>Tu Precio ($)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: 5000"
              keyboardType="numeric"
              onChangeText={(text) => setBidData({ ...bidData, price: text })}
            />

            <Text style={styles.label}>Tiempo estimado de llegada (min)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: 30"
              keyboardType="numeric"
              onChangeText={(text) => setBidData({ ...bidData, tiempo: text })}
            />

            <Text style={styles.label}>Mensaje al cliente</Text>
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Cuéntale por qué eres el indicado..."
              multiline
              onChangeText={(text) => setBidData({ ...bidData, message: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: "#666" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleApply}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Enviar Oferta
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F7" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "bold", color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  jobCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  jobTitle: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F0FF",
    padding: 6,
    borderRadius: 8,
  },
  distanceText: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
  },
  description: { color: "#555", marginVertical: 10, lineHeight: 20 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    paddingTop: 10,
  },
  clientLabel: { fontSize: 10, color: "#AAA", textTransform: "uppercase" },
  clientName: { fontSize: 14, fontWeight: "600", color: "#333" },
  applyButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  applyButtonText: { color: "#fff", fontWeight: "bold" },
  emptyText: { textAlign: "center", marginTop: 50, color: "#999" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  modalSubtitle: { color: "#007AFF", marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "bold", marginTop: 10, marginBottom: 5 },
  modalInput: { backgroundColor: "#F0F2F5", borderRadius: 10, padding: 12 },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 25,
  },
  cancelButton: { padding: 15, marginRight: 10 },
  confirmButton: { backgroundColor: "#007AFF", padding: 15, borderRadius: 10 },
});
