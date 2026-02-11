import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../src/constants/Config";

export default function MyJobsScreen() {
  const router = useRouter(); // 2. Inicializar router
  const [myJobs, setMyJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJobBids, setSelectedJobBids] = useState([]);
  const [bidsModalVisible, setBidsModalVisible] = useState(false);

  const fetchMyJobs = async () => {
    setRefreshing(true);
    const userData = await SecureStore.getItemAsync("userData");
    const user = JSON.parse(userData || "{}");
    try {
      const res = await axios.get(`${API_URL}/api/jobs/client/${user.id}`);
      setMyJobs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAcceptBid = async (jobId: number, workerId: number) => {
    try {
      await axios.patch(`${API_URL}/api/jobs/accept-bid`, { jobId, workerId });
      Alert.alert("Success!", "Worker assigned.");
      setBidsModalVisible(false);
      fetchMyJobs();
    } catch (error) {
      Alert.alert("Error", "Could not assign worker.");
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Pedidos</Text>

      <FlatList
        data={myJobs}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchMyJobs} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.jobTitle}>{item.title}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.status === "PENDING" ? "#FFF3E0" : "#E8F5E9",
                  },
                ]}
              >
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            {/* SI ESTÁ PENDIENTE: Mostrar botón para ver postulantes */}
            {item.status === "PENDING" && item._count?.bids > 0 && (
              <TouchableOpacity
                style={styles.viewBidsButton}
                onPress={() => {
                  setSelectedJobBids(item.bids);
                  setBidsModalVisible(true);
                }}
              >
                <Text style={styles.viewBidsText}>
                  Ver {item._count.bids} Postulantes
                </Text>
              </TouchableOpacity>
            )}

            {/* SI YA ESTÁ EN PROGRESO: Mostrar botón de CHAT */}
            {item.status === "IN_PROGRESS" && (
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() =>
                  router.push({
                    pathname: "/chat/[jobId]",
                    params: { jobId: item.id },
                  })
                }
              >
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>
                  Hablar con el profesional
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* MODAL DE BIDS (Se queda igual que antes) */}
      <Modal
        visible={bidsModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ofertas Recibidas</Text>
              <TouchableOpacity onPress={() => setBidsModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={selectedJobBids}
              keyExtractor={(bid) => bid.id.toString()}
              renderItem={({ item: bid }) => (
                <View style={styles.bidCard}>
                  <Text style={styles.workerName}>{bid.worker.name}</Text>
                  <Text style={styles.bidPrice}>${bid.price}</Text>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptBid(bid.jobId, bid.workerId)}
                  >
                    <Text style={styles.acceptButtonText}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
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
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: "bold" },
  offersRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  offersText: { marginLeft: 5, color: "#007AFF", fontWeight: "600" },
  viewBidsButton: {
    marginTop: 15,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  viewBidsText: { color: "#fff", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold" },
  bidCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  bidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  workerName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  workerOccupation: { fontSize: 13, color: "#007AFF", fontWeight: "600" },
  bidPrice: { fontSize: 18, fontWeight: "bold", color: "#28A745" },
  bidMessage: {
    fontSize: 14,
    color: "#666",
    marginVertical: 10,
    fontStyle: "italic",
  },
  bidFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  etaText: { color: "#666", fontSize: 13 },
  acceptButton: {
    backgroundColor: "#28A745",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: { color: "#fff", fontWeight: "bold" },
  chatButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  chatButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
});
