import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
import api from "../../src/services/api";

export default function DisputesScreen() {
  const { colors } = useTheme();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolution, setResolution] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = async () => {
    try {
      const res = await api.get("/api/disputes");
      setDisputes(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDisputes();
    }, []),
  );

  const handleResolve = (dispute: any) => {
    setSelectedDispute(dispute);
    setModalVisible(true);
  };

  const submitResolution = async (
    jobStatus: "IN_PROGRESS" | "CANCELLED" | "COMPLETED",
  ) => {
    if (!resolution.trim()) {
      Alert.alert("Atención", "Escribí una resolución antes de continuar.");
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/api/disputes/${selectedDispute.id}/resolve`, {
        resolution,
        jobStatus,
      });
      Alert.alert("Resuelto", "El caso fue cerrado correctamente.");
      setModalVisible(false);
      setResolution("");
      fetchDisputes();
    } catch (e) {
      Alert.alert("Error", "No se pudo resolver el caso.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>
        Casos Abiertos ({disputes.length})
      </Text>

      <FlatList
        data={disputes}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#28A745" />
            <Text style={styles.emptyText}>No hay casos abiertos</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.jobTitle, { color: colors.text }]}>
                {item.job?.title}
              </Text>
              <View style={styles.openBadge}>
                <Text style={[styles.openBadgeText, { color: colors.text }]}>
                  ABIERTO
                </Text>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Cliente:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {item.job?.client?.name}
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Trabajador:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {item.job?.worker?.name}
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Motivo del reporte:</Text>
            <Text style={[styles.reason, { color: colors.text }]}>
              {item.reason}
            </Text>

            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>

            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolve(item)}
            >
              <Ionicons name="hammer" size={16} color="#fff" />
              <Text style={styles.resolveButtonText}>Resolver caso</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeModal}
              onPress={() => {
                setModalVisible(false);
                setResolution("");
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Resolver caso</Text>
            <Text style={styles.modalSubtitle}>
              {selectedDispute?.job?.title}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Describí la resolución del caso..."
              multiline
              numberOfLines={4}
              value={resolution}
              onChangeText={setResolution}
            />

            <Text style={styles.modalLabel}>¿Qué pasa con el trabajo?</Text>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#28A745" }]}
              onPress={() => submitResolution("COMPLETED")}
              disabled={submitting}
            >
              <Text style={styles.actionButtonText}>
                Dar por completado → Cliente debe pagar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#007AFF" }]}
              onPress={() => submitResolution("IN_PROGRESS")}
              disabled={submitting}
            >
              <Text style={styles.actionButtonText}>Reanudar trabajo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#DC3545" }]}
              onPress={() => submitResolution("CANCELLED")}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>Cancelar trabajo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 15 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  jobTitle: { fontSize: 16, fontWeight: "bold", flex: 1 },
  openBadge: {
    backgroundColor: "#FDECEA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadgeText: { color: "#DC3545", fontSize: 10, fontWeight: "bold" },
  label: { fontSize: 12, color: "#999", marginTop: 6 },
  value: { fontSize: 14, color: "#333" },
  reason: {
    fontSize: 14,
    color: "#333",
    backgroundColor: "#F5F5F5",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  date: { fontSize: 11, color: "#999", marginTop: 8 },
  resolveButton: {
    flexDirection: "row",
    backgroundColor: "#6C3483",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  resolveButtonText: { color: "#fff", fontWeight: "bold" },
  emptyContainer: { alignItems: "center", marginTop: 80, gap: 12 },
  emptyText: { color: "#999", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 25 },
  closeModal: { alignSelf: "flex-end" },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 4,
  },
  modalSubtitle: { fontSize: 14, color: "#666", marginBottom: 16 },
  modalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    textAlignVertical: "top",
    fontSize: 14,
    marginBottom: 16,
  },
  actionButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  actionButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
