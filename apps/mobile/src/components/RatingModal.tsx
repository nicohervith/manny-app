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

interface RatingModalProps {
  visible: boolean;
  selectedJob: Job | null;
  rating: number;
  comment: string;
  onClose: () => void;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSuccess: () => void;
}

export default function RatingModal({
  visible,
  selectedJob,
  rating,
  comment,
  onClose,
  onRatingChange,
  onCommentChange,
  onSuccess,
}: RatingModalProps) {
  const [loading, setLoading] = React.useState(false);

  const submitReview = async () => {
    if (!selectedJob) return;

    setLoading(true);
    try {
      await api.post(`/api/reviews`, {
        jobId: selectedJob.id,
        workerId: selectedJob.workerId,
        reviewerId: selectedJob.clientId,
        rating: rating,
        comment: comment.trim() || null,
      });

      Alert.alert("¡Éxito!", "Tu calificación ha sido enviada.");
      onClose();
      onSuccess();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo enviar la reseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeModal} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>¡Trabajo Terminado!</Text>
          <Text style={styles.modalSubtitle}>
            ¿Cómo calificarías el servicio de{" "}
            <Text style={{ fontWeight: "bold", color: "#333" }}>
              {selectedJob?.worker?.name || "el profesional"}
            </Text>
            ?
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => onRatingChange(star)}>
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={42}
                  color="#FFD700"
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.reviewInput}
            placeholder="Escribe un breve comentario sobre el profesional..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            onChangeText={onCommentChange}
            value={comment}
          />

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={submitReview}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Enviar Calificación</Text>
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
  starsRow: { flexDirection: "row", marginVertical: 20 },
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
  confirmButton: {
    backgroundColor: "#28A745",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
