import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../services/api";
import { Job } from "../types/job";

interface DisputeModalProps {
  visible: boolean;
  disputeJob: Job | null;
  disputeReason: string;
  onClose: () => void;
  onReasonChange: (reason: string) => void;
  onSuccess: () => void;
}

export default function DisputeModal({
  visible,
  disputeJob,
  disputeReason,
  onClose,
  onReasonChange,
  onSuccess,
}: DisputeModalProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const submitDispute = async () => {
    if (!disputeReason.trim()) {
      Alert.alert("Atención", "Por favor describí el problema.");
      return;
    }

    if (!disputeJob) return;

    setSubmitting(true);
    try {
      await api.post("/api/disputes", {
        jobId: disputeJob.id,
        reason: disputeReason,
      });

      Alert.alert(
        "Reporte enviado",
        "Revisaremos tu caso a la brevedad. El trabajo quedará pausado hasta resolverlo.",
      );
      onClose();
      onSuccess();
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar el reporte. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeModal} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          <Ionicons name="warning" size={40} color="#DC3545" />
          <Text style={styles.modalTitle}>Reportar un problema</Text>
          <Text style={styles.modalSubtitle}>
            Describí qué salió mal con este trabajo
          </Text>

          <TextInput
            style={styles.reviewInput}
            placeholderTextColor="#999"
            placeholder="Ej: El trabajador no se presentó, el trabajo quedó incompleto..."
            multiline
            numberOfLines={4}
            onChangeText={onReasonChange}
            value={disputeReason}
          />

          <TouchableOpacity
            style={styles.disputeConfirmButton}
            onPress={submitDispute}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Enviar Reporte</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  closeModal: { alignSelf: "flex-end" },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
  },
  modalSubtitle: { fontSize: 16, color: "#666", marginVertical: 10 },
  reviewInput: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 20,
    color: "#000",
  },
  confirmButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  disputeConfirmButton: {
    backgroundColor: "#DC3545",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
});
