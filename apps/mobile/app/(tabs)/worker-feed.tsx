import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Circle, Marker } from "react-native-maps";
import ApplyBidModal from "../../src/components/ApplyBidModal";
import { JobCard } from "../../src/components/jobCard";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import api from "../../src/services/api";

interface Job {
  id: number;
  title: string;
  description: string;
  budget: number;
  latitude: number;
  longitude: number;
  _count?: {
    bids: number;
  };
  bids?: any[];
}

export default function WorkerFeedScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [radius, setRadius] = useState(50);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [bidData, setBidData] = useState({
    price: "",
    message: "",
    tiempo: "",
  });
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const router = useRouter();
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371;
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
      const response = await api.get("/api/jobs/available");
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePressApply = async (job: any) => {
    try {
      const res = await api.get(`/api/worker/status/${user.id}`);
      const { verification } = res.data;

      if (verification !== "VERIFIED") {
        const messages: Record<string, string> = {
          NOT_STARTED: "Todavía no completaste tu perfil profesional.",
          DRAFT: "Completá y enviá tu perfil para poder postularte.",
          INCOMPLETE: "Tu perfil está incompleto. Terminá de cargarlo.",
          PENDING: "Tu perfil está siendo revisado. Te avisaremos pronto.",
          REJECTED: "Tu perfil fue rechazado. Revisá los documentos enviados.",
        };

        Alert.alert(
          "Verificación Requerida",
          messages[verification] || `Estado: ${verification}`,
          [
            { text: "Cerrar" },
            {
              text: "Ver mi Perfil",
              onPress: () => router.push("/worker/complete-profile"),
            },
          ],
        );
        return;
      }

      setSelectedJob(job);
      setModalVisible(true);
    } catch (e) {
      Alert.alert("Error", "No pudimos validar tu perfil.");
    }
  };

  const handleApplyAction = async (data: any) => {
    try {
      await api.post(`/api/bids/apply`, {
        jobId: selectedJob.id,
        workerId: user.id,
        message: data.message,
        price: data.price,
        estimatedMin: data.tiempo,
      });

      Alert.alert("¡Enviado!", "Tu propuesta ha sido enviada.");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar la propuesta.");
    }
  };

  const filteredJobs = jobs.filter((item) => {
    if (!location || !item.latitude || !item.longitude) return true;

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      item.latitude,
      item.longitude,
    );

    return distance <= radius;
  });

  useFocusEffect(
    useCallback(() => {
      getPermissionsAndLocation();
      fetchJobs();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
    getPermissionsAndLocation();
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Trabajos activos
          </Text>

          {/* BOTÓN PARA CAMBIAR ENTRE LISTA Y MAPA */}
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              { backgroundColor: colors.commissionBg },
            ]}
            onPress={() => setViewMode(viewMode === "list" ? "map" : "list")}
          >
            <Ionicons
              name={viewMode === "list" ? "map-outline" : "list-outline"}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.viewToggleText}>
              {viewMode === "list" ? "Ver mapa" : "Ver lista"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenedor del Filtro */}
        <View
          style={[
            styles.filterContainer,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.filterTextRow}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
              Radio de búsqueda:
            </Text>
            <Text style={[styles.radiusValue, { color: colors.text }]}>
              {radius === 100 ? "Toda la ciudad" : `${radius} km`}
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={radius}
            onValueChange={(value) => setRadius(value)}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>
      </View>

      {viewMode === "list" ? (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const distance =
              location && item.latitude && item.longitude
                ? calculateDistance(
                    location.latitude,
                    location.longitude,
                    item.latitude,
                    item.longitude,
                  )
                : null;

            return (
              <JobCard
                item={item}
                distance={distance}
                onApply={(job) => handlePressApply(job)}
              />
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No hay trabajos pendientes en tu área.
            </Text>
          }
        />
      ) : (
        /* VISTA DE MAPA */
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: location?.latitude || -34.6037,
              longitude: location?.longitude || -58.3816,
              latitudeDelta: radius * 0.02,
              longitudeDelta: radius * 0.02,
            }}
          >
            {/* Círculo que representa el radio de búsqueda */}
            {location && (
              <Circle
                center={location}
                radius={radius * 1000}
                fillColor="rgba(0, 122, 255, 0.1)"
                strokeColor="rgba(0, 122, 255, 0.3)"
                zIndex={0} // Forzamos profundidad
              />
            )}

            {/* Marcador de la posición del trabajador */}
            {location && (
              <Marker coordinate={location} title="Tu ubicación" zIndex={1} />
            )}

            {filteredJobs.map((job) => (
              <Marker
                key={job.id}
                coordinate={{
                  latitude: job.latitude,
                  longitude: job.longitude,
                }}
                zIndex={10}
                onPress={() => handlePressApply(job)}
              >
                <View style={styles.customMarker}>
                  <Ionicons name="briefcase" size={20} color="#fff" />
                </View>

                <Callout tooltip={true}>
                  <View style={styles.calloutContainer}>
                    <View style={styles.calloutContent}>
                      <Text style={styles.calloutTitle}>{job.title}</Text>
                      <Text style={styles.calloutPrice}>${job.budget}</Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#666",
                          textAlign: "center",
                          marginTop: 4,
                        }}
                      >
                        Tocá el marcador para postularte
                      </Text>
                    </View>
                    <View style={styles.calloutArrow} />
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
      )}
      {/* MODAL MODULARIZADO */}
      <ApplyBidModal
        visible={modalVisible}
        jobTitle={selectedJob?.title}
        jobDescription={selectedJob?.description}
        onClose={() => setModalVisible(false)}
        onSubmit={handleApplyAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 20 },
  title: { fontSize: 26, fontWeight: "bold" },
  subtitle: { fontSize: 14, marginTop: 4 },
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
  filterContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  filterTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  radiusValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 50,
    paddingHorizontal: 40,
  },
  viewToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5F1FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewToggleText: {
    color: "#007AFF",
    marginLeft: 6,
    fontWeight: "600",
  },
  customMarker: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Sombra para Android
    elevation: 5,
  },
  fakeButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
  },
  calloutContainer: {
    alignItems: "center",
    width: 200,
    backgroundColor: "transparent",
  },
  calloutContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 2,
  },
  calloutCategory: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  calloutPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#28a745", // Verde para el precio
    marginBottom: 8,
  },
  calloutButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 4,
    borderRadius: 5,
    alignItems: "center",
  },
  calloutButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  calloutArrow: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderTopColor: "#fff",
    borderWidth: 10,
    alignSelf: "center",
    marginTop: -1,
  },
  calloutFooter: {},
});
