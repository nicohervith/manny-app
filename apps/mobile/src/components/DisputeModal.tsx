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
import { useTheme } from "../context/ThemeContext";

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
  const { colors } = useTheme();

  const styles = getStyles(colors);

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
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>

          <Ionicons name="warning" size={40} color={colors.error} />
          <Text style={styles.modalTitle}>Reportar un problema</Text>
          <Text style={styles.modalSubtitle}>
            Describí qué salió mal con este trabajo
          </Text>

          <TextInput
            style={styles.reviewInput}
            placeholderTextColor={colors.textLight}
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

function getStyles(colors: any) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 25,
      alignItems: "center",
    },
    closeModal: { alignSelf: "flex-end" },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 10,
    },
    modalSubtitle: { fontSize: 16, color: colors.textSecondary, marginVertical: 10 },
    reviewInput: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 15,
      textAlignVertical: "top",
      fontSize: 16,
      marginBottom: 20,
      color: colors.text,
    },
    confirmButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    disputeConfirmButton: {
      backgroundColor: colors.error,
      width: "100%",
      padding: 15,
      borderRadius: 10,
      alignItems: "center",
    },
  });
}
